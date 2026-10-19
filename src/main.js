import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FACES, PARTS, SKINS, PLANK, mirror, colorGrid } from "./patterns.js";

// World units are centimetres, matching the build guide (Guide 1, 4, 5).
// +x is the figure's LEFT (viewer's right when facing it), +z is forward.
const CELL_PX = 16;

const state = {
  skin: SKINS[0].hex,
  cutout: false,
  explode: false,
  base: true,
  pose: "run",
};

const viewport = document.getElementById("viewport");
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
viewport.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const bg = getComputedStyle(document.documentElement).getPropertyValue("--stage").trim() || "#F4F1EA";
scene.background = new THREE.Color(bg);
scene.fog = new THREE.Fog(scene.background, 380, 700);

const camera = new THREE.PerspectiveCamera(32, 1, 1, 2000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 37, 0);
controls.minDistance = 60;
controls.maxDistance = 520;
controls.maxPolarAngle = Math.PI * 0.495;
controls.autoRotateSpeed = 1.2;

scene.add(new THREE.HemisphereLight(0xffffff, 0xd8cfc0, 1.6));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(-80, 160, 120);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -90, right: 90, top: 110, bottom: -20, near: 10, far: 400 });
sun.shadow.bias = -0.0005;
scene.add(sun);
const fill = new THREE.DirectionalLight(0xffffff, 0.6);
fill.position.set(120, 60, -100);
scene.add(fill);

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(400, 64),
  new THREE.MeshLambertMaterial({ color: 0xece6db })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1.01;
floor.receiveShadow = true;
scene.add(floor);
const grid = new THREE.GridHelper(400, 400 / 9, 0xcfc6b6, 0xdcd4c6);
grid.position.y = -1;
scene.add(grid);

// ---------- textures ----------

const textures = new Map(); // key -> { canvas, tex, spec }

function specKey(s) {
  return [s.kind, s.variant, s.mirror ? "m" : ""].join("|");
}

function drawSpec(entry) {
  const { spec, canvas } = entry;
  const lib = spec.kind === "face" ? FACES : PARTS;
  let rows = lib[spec.variant];
  if (spec.mirror) rows = mirror(rows);
  const grid = colorGrid(spec.kind, rows, state.skin, { cutout: state.cutout });
  canvas.width = grid[0].length * CELL_PX;
  canvas.height = grid.length * CELL_PX;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  grid.forEach((row, r) =>
    row.forEach((fill, c) => {
      if (!fill) return;
      ctx.fillStyle = fill;
      ctx.fillRect(c * CELL_PX, r * CELL_PX, CELL_PX, CELL_PX);
    })
  );
  entry.tex.needsUpdate = true;
}

function texture(spec) {
  const key = specKey(spec);
  if (!textures.has(key)) {
    const canvas = document.createElement("canvas");
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestMipmapLinearFilter;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const entry = { spec, canvas, tex };
    drawSpec(entry);
    textures.set(key, entry);
  }
  return textures.get(key).tex;
}

const crownMaterials = [];

function material(spec) {
  const crown = spec.variant.startsWith("crown-");
  const m = new THREE.MeshLambertMaterial({ map: texture(spec) });
  if (crown) {
    m.alphaTest = 0.5;
    m.side = THREE.DoubleSide;
    crownMaterials.push(m);
  }
  return m;
}

const face = (variant, extra) => ({ kind: "face", variant, ...extra });
const part = (variant, extra) => ({ kind: "part", variant, ...extra });

// Order of BoxGeometry material slots: +x, -x, +y, -y, +z, -z.
function box(size, faces, info) {
  const [w, h, d] = size;
  const mats = [faces.px, faces.nx, faces.py, faces.ny, faces.pz, faces.nz].map(material);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = info;
  return mesh;
}

// Cut-out card pieces (shield, sword) become chunky voxel slabs.
function voxelSlab(variant, thickness, { rot = false } = {}, info) {
  let grid = colorGrid("part", PARTS[variant], state.skin);
  if (rot) grid = grid.map((r) => r.slice().reverse()).reverse();
  const unit = 2.25;
  const cells = [];
  grid.forEach((row, r) => row.forEach((fill, c) => fill && cells.push({ r, c, fill })));
  const geo = new THREE.BoxGeometry(unit, unit, thickness);
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial(), cells.length);
  const nr = grid.length, nc = grid[0].length;
  const m = new THREE.Matrix4();
  const color = new THREE.Color();
  cells.forEach((cell, i) => {
    m.makeTranslation((cell.c - (nc - 1) / 2) * unit, ((nr - 1) / 2 - cell.r) * unit, 0);
    mesh.setMatrixAt(i, m);
    mesh.setColorAt(i, color.setStyle(cell.fill, THREE.SRGBColorSpace));
  });
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = info;
  return mesh;
}

// ---------- the figure ----------

const figure = new THREE.Group();
scene.add(figure);
figure.rotation.order = "YXZ";
const pickables = [];
const assemblies = []; // { obj, home, offset }

function place(obj, pos, explodeOffset) {
  obj.position.set(...pos);
  figure.add(obj);
  assemblies.push({ obj, home: new THREE.Vector3(...pos), offset: new THREE.Vector3(...explodeOffset) });
  obj.traverse((o) => o.userData.label && pickables.push(o));
  return obj;
}

// Limbs hang from pivot groups at the hip and shoulder so poses can swing them.
function joint(mesh, drop) {
  const pivot = new THREE.Group();
  mesh.position.y = -drop;
  pivot.add(mesh);
  return pivot;
}
const rig = {};

// 1 · Legs: 9 × 27 × 9, sandals forward. Pivot at the hip.
for (const [side, x] of [["Right", -4.5], ["Left", 4.5]]) {
  const m = side === "Left";
  const leg = box(
    [9, 27, 9],
    {
      pz: part("leg-front", { mirror: m }),
      nz: part("leg-side", { mirror: m }),
      px: part("leg-side", { mirror: m }),
      nx: part("leg-side", { mirror: m }),
      py: part("leg-top", { mirror: m }),
      ny: part("foot", { mirror: m }),
    },
    { label: `${side} leg`, dims: "9 × 9 × 27 cm", sheet: m ? "Sheets 15L–16L" : "Sheets 15–16" }
  );
  rig["leg" + side[0]] = place(joint(leg, 13.5), [x, 27, 0], [x * 0.6, 0, 0]);
}

// 2 · Body: 18 W × 27 H × 9 D.
place(
  box(
    [18, 27, 9],
    {
      pz: part("body-front"),
      nz: part("body-back"),
      px: part("body-side"),
      nx: part("body-side"),
      py: part("body-top"),
      ny: part("body-bottom"),
    },
    { label: "Body", dims: "18 × 27 × 9 cm", sheet: "Sheets 8–11" }
  ),
  [0, 40.5, 0],
  [0, 10, 0]
);

// 6 · Shield: 22.5 × 27, carried on the left forearm.
const shieldGrip = new THREE.Group();
shieldGrip.add(voxelSlab("shield", 0.9, {}, { label: "Shield", dims: "22.5 × 27 cm", sheet: "Sheets 17–18, 17M–18M" }));

// 7 · Sword: 11.25 × 40.5, pommel up. Shifted so the grip sits on the group origin.
const swordGrip = new THREE.Group();
const sword = voxelSlab("sword", 0.9, { rot: true }, { label: "Sword", dims: "11.25 × 40.5 cm", sheet: "Sheets 19–20, 19M–20M" });
sword.position.y = -14.625; // grip centre is 6.5 cells above the slab centre
swordGrip.add(sword);

// 3 · Arms: 9 × 27 × 9, tops flush with the body top. Pivot 4.5 cm below the top.
for (const [side, x] of [["Right", -13.5], ["Left", 13.5]]) {
  const m = side === "Left";
  const arm = box(
    [9, 27, 9],
    {
      pz: part("arm-front", { mirror: m }),
      nz: part("arm-side", { mirror: m }),
      px: part("arm-side", { mirror: m }),
      nx: part("arm-side", { mirror: m }),
      py: part("arm-top"),
      ny: part("hand"),
    },
    { label: `${side} arm`, dims: "9 × 9 × 27 cm", sheet: m ? "Sheets 13L–14L" : "Sheets 13–14" }
  );
  const pivot = joint(arm, 9);
  pivot.add(m ? shieldGrip : swordGrip);
  rig["arm" + side[0]] = place(pivot, [x, 49.5, 0], [Math.sign(x) * 12, 10, 0]);
}

// 4 · Plank: 90 × 1 × 9, 49.5 cm to the figure's right, 40.5 cm to its left.
const plank = new THREE.Mesh(
  new THREE.BoxGeometry(90, 1, 9),
  new THREE.MeshLambertMaterial({ color: PLANK })
);
plank.castShadow = plank.receiveShadow = true;
plank.userData = { label: "Head plank", dims: "90 × 9 × 1 cm", sheet: "Triple-layer cardboard" };
place(plank, [-4.5, 54.5, 0], [0, 20, 0]);

// 5 · Heads, as you face the figure, left to right.
const HEADS = [
  [10, "Right 5", "shock", "Shock"],
  [9, "Right 4", "scar", "Scar"],
  [8, "Right 3", "tongue", "Tongue"],
  [7, "Right 2", "sage", "Sage"],
  [6, "Right 1", "grin", "Grin"],
  [1, "Center", "dashanan", "Dashanan, the crowned king"],
  [2, "Left 1", "roar", "Roar"],
  [3, "Left 2", "smirk", "Smirk"],
  [4, "Left 3", "laugh", "Laugh"],
  [5, "Left 4", "fury", "Fury"],
];
const headRow = new THREE.Group();
const secondaryHeads = [];
const headSlots = []; // one head mesh per slot, left to right as you face the figure
HEADS.forEach(([n, pos, variant, name], i) => {
  const x = 9 * i + 4.5 - 49.5;
  const head = box(
    [9, 9, 9],
    { pz: face(variant), px: face("side-l"), nx: face("side-r"), py: face("top"), ny: face("back"), nz: face("back") },
    { label: `Head ${n} · ${pos}`, dims: name, sheet: `Sheet ${Math.ceil(n / 2)} · 9 cm cube` }
  );
  head.position.set(x, 0, 0);
  const crown = box(
    [9, 9, 9],
    {
      pz: face("crown-front"),
      px: face("crown-side"),
      nx: face("crown-side"),
      nz: face("crown-side"),
      py: face("crown-top"),
      ny: face("crown-top"),
    },
    { label: `Crown · head ${n}`, dims: "9 cm cube, tip up", sheet: "Sheet 21" }
  );
  crown.position.set(x, 9, 0);
  headRow.add(head, crown);
  headSlots.push(head);
  if (n !== 1) secondaryHeads.push(head, crown);
});
place(headRow, [0, 59.5, 0], [0, 30, 0]);

// Base board: 40 × 30, under the legs.
const base = new THREE.Mesh(
  new THREE.BoxGeometry(40, 1, 30),
  new THREE.MeshLambertMaterial({ color: 0xc8a27a })
);
base.position.set(0, -0.5, 0);
base.castShadow = base.receiveShadow = true;
base.userData = { label: "Base board", dims: "40 × 30 cm", sheet: "Corrugated cardboard" };
scene.add(base);
pickables.push(base);

// ---------- poses ----------

// Joint angles in radians. Arms and legs swing on x (negative = forward), z spreads them.
// sword = grip in the arm-local frame: [x, y, z, rx, ry, rz].
// shield = [x, y of the hand it is held near, tilt]; it stays upright and is pushed clear of the arm.
const POSES = {
  stand: {
    lean: 0, armR: [0, 0], armL: [0, 0], legR: [0, 0], legL: [0, 0],
    sword: [-10.2, -14.65, 0, 0, 0, 0],
    shield: [4.5, -9, 0],
  },
  run: {
    lean: 0.14, armR: [-1.15, -0.18], armL: [-0.75, 0.16], legR: [-0.75, 0], legL: [0.6, 0],
    sword: [0, -19, 0, -1.2, Math.PI / 2, 0],
    shield: [0, -18, 0],
  },
  strike: {
    lean: 0.06, armR: [-2.75, -0.22], armL: [-1.35, 0.1], legR: [-0.42, -0.06], legL: [0.36, 0.06],
    sword: [0, -19, 0, -1.4, Math.PI / 2, 0],
    shield: [0, -18, 0],
  },
  victory: {
    lean: -0.04, armR: [-2.95, -0.32], armL: [-2.55, 0.42], legR: [0, -0.12], legL: [0, 0.12],
    sword: [0, -19, 0, 0, Math.PI / 2, 0],
    shield: [0, -18, 0],
  },
};
POSES.cycle = POSES.run;

const flatPose = (p) => [p.lean, ...p.armR, ...p.armL, ...p.legR, ...p.legL, ...p.sword, ...p.shield];
const poseNow = flatPose(POSES[state.pose]);
const legBox = new THREE.Box3();
const _b = new THREE.Box3();

function poseTarget(t) {
  if (state.pose !== "cycle") return flatPose(POSES[state.pose]);
  // Run cycle: legs and arms swing in opposition around the run pose.
  const p = structuredClone(POSES.run);
  const w = Math.sin(t * 7);
  p.legR[0] = -0.75 * w;
  p.legL[0] = 0.75 * w;
  p.armR[0] = -1.15 + 0.35 * w;
  p.armL[0] = -0.75 - 0.3 * w;
  return flatPose(p);
}

// Left-arm box corners in the arm pivot's frame (pivot 4.5 cm below the arm top).
const ARM_CORNERS = [];
for (const x of [-4.5, 4.5]) for (const y of [4.5, -22.5]) for (const z of [-4.5, 4.5]) ARM_CORNERS.push(new THREE.Vector3(x, y, z));
const SHIELD_GAP = 0.95; // half the slab thickness plus 0.5 cm of air
const _n = new THREE.Vector3();
const _h = new THREE.Vector3();

// Tilt the shield by `rx` in the arm frame, then slide it along its facing until
// every corner of the arm is behind its back face, keeping it level with the hand.
function placeShield(x, handY, rx) {
  shieldGrip.rotation.set(rx, 0, 0);
  _n.set(0, -Math.sin(rx), Math.cos(rx));
  let d = -Infinity;
  for (const c of ARM_CORNERS) d = Math.max(d, c.dot(_n));
  d += SHIELD_GAP;
  _h.set(x, handY, 0);
  shieldGrip.position.copy(_h).addScaledVector(_n, d - _h.dot(_n));
}

function applyPose(dt, t) {
  const target = poseTarget(t);
  const k = state.pose === "cycle" ? 1 : Math.min(1, dt * 7);
  for (let i = 0; i < poseNow.length; i++) poseNow[i] += (target[i] - poseNow[i]) * k;
  const [lean, arx, arz, alx, alz, lrx, lrz, llx, llz] = poseNow;
  figure.rotation.x = lean;
  rig.armR.rotation.set(arx, 0, arz);
  rig.armL.rotation.set(alx, 0, alz);
  rig.legR.rotation.set(lrx, 0, lrz);
  rig.legL.rotation.set(llx, 0, llz);
  swordGrip.position.fromArray(poseNow, 9);
  swordGrip.rotation.set(poseNow[12], poseNow[13], poseNow[14]);
  placeShield(poseNow[15], poseNow[16], poseNow[17] - lean - alx);

  // Keep the lowest foot on the ground.
  figure.position.y = 0;
  figure.updateMatrixWorld(true);
  legBox.makeEmpty();
  for (const leg of [rig.legR, rig.legL]) legBox.union(_b.setFromObject(leg.children[0]));
  figure.position.y = -legBox.min.y;
}

// Without the plank the heads drop 1 cm to sit straight on the shoulders.
function setPlank(on) {
  plank.visible = on;
  assemblies.find((a) => a.obj === headRow).home.y = on ? 59.5 : 58.5;
}

function setSecondaryHeads(on) {
  secondaryHeads.forEach((o) => (o.visible = on));
  // With only the centre head left, trim the plank to the shoulders.
  plank.scale.x = on ? 1 : 36 / 90;
  assemblies.find((a) => a.obj === plank).home.x = on ? -4.5 : 0;
}

// ---------- interaction ----------

let explodeT = 0;
const tmp = new THREE.Vector3();

function setSkin(hex) {
  state.skin = hex;
  textures.forEach(drawSpec);
  drawMoodThumbs();
}

// Which head (by HEADS index) sits in each slot. Slot 5 is the centre.
const CENTER = 5;
const slotHeads = HEADS.map((_, i) => i);

function labelSlot(i) {
  const [n, , variant, name] = HEADS[slotHeads[i]];
  const mesh = headSlots[i];
  mesh.material[4].map = texture(face(variant)); // +z (front) slot of the box
  mesh.userData = { label: `Head ${n} · ${HEADS[i][1]}`, dims: name, sheet: `Sheet ${Math.ceil(n / 2)} · 9 cm cube` };
}

// Swap the chosen mood into the centre so all ten faces stay on the figure.
function setPrimary(variant) {
  const from = slotHeads.findIndex((h) => HEADS[h][2] === variant);
  [slotHeads[from], slotHeads[CENTER]] = [slotHeads[CENTER], slotHeads[from]];
  labelSlot(from);
  labelSlot(CENTER);
}

const moods = document.getElementById("moods");
HEADS.slice()
  .sort((a, b) => a[0] - b[0])
  .forEach(([n, , variant, name]) => {
    const short = name.split(",")[0];
    moods.insertAdjacentHTML(
      "beforeend",
      `<label class="mood"><input type="radio" name="mood" value="${variant}" ${n === 1 ? "checked" : ""} autocomplete="off">` +
        `<canvas width="8" height="8" data-face="${variant}" aria-hidden="true"></canvas><span>${short}</span></label>`
    );
  });
moods.addEventListener("change", (e) => setPrimary(e.target.value));

function drawMoodThumbs() {
  moods.querySelectorAll("canvas").forEach((c) => {
    const src = textures.get(specKey(face(c.dataset.face))).canvas;
    const ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 8, 8);
    ctx.drawImage(src, 0, 0, 8, 8);
  });
}
drawMoodThumbs();

function setCutout(on) {
  state.cutout = on;
  textures.forEach((e) => e.spec.variant.startsWith("crown-") && drawSpec(e));
}

// Unit directions; distance is fitted so the 90 cm head row fits the viewport.
const VIEWS = {
  front: [0, 0.05, 1],
  back: [0, 0.05, -1],
  left: [1, 0.05, 0],
  right: [-1, 0.05, 0],
  angle: [0.43, 0.3, 0.85],
};
function fitDistance() {
  const vfov = THREE.MathUtils.degToRad(camera.fov);
  const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
  const byWidth = 58 / Math.tan(hfov / 2);
  const byHeight = 48 / Math.tan(vfov / 2);
  return THREE.MathUtils.clamp(Math.max(byWidth, byHeight) + 10, controls.minDistance, controls.maxDistance);
}
function viewPosition(name) {
  return new THREE.Vector3(...VIEWS[name]).normalize().multiplyScalar(fitDistance()).add(controls.target);
}
let flight = null;
function flyTo(name) {
  // Swing around the target instead of cutting through the figure.
  const from = camera.position.clone().sub(controls.target);
  const to = viewPosition(name).sub(controls.target);
  const a = from.clone().normalize(), b = to.clone().normalize();
  if (a.dot(b) < -0.999) a.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.01);
  flight = { dir: a, rot: new THREE.Quaternion().setFromUnitVectors(a, b), r0: from.length(), r1: to.length(), t: 0 };
}
const slerpQ = new THREE.Quaternion();

const tip = document.getElementById("tip");
const info = {
  label: document.getElementById("info-label"),
  dims: document.getElementById("info-dims"),
  sheet: document.getElementById("info-sheet"),
};
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hovered = null;
let downAt = null;

function pick(ev) {
  const r = renderer.domElement.getBoundingClientRect();
  pointer.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(pickables, false).find((h) => {
    if (!h.object.visible) return false;
    if (!h.face || h.object.isInstancedMesh) return true;
    // Skip see-through crown pixels in cut-out mode.
    const mat = Array.isArray(h.object.material) ? h.object.material[h.face.materialIndex] : h.object.material;
    if (!mat.alphaTest || !h.uv) return true;
    const img = mat.map.image;
    const px = img.getContext("2d").getImageData(
      Math.min(img.width - 1, Math.floor(h.uv.x * img.width)),
      Math.min(img.height - 1, Math.floor((1 - h.uv.y) * img.height)),
      1,
      1
    ).data;
    return px[3] > 127;
  });
  return hit ? hit.object.userData : null;
}

function showInfo(d) {
  info.label.textContent = d ? d.label : "Hover or tap a part";
  info.dims.textContent = d ? d.dims : "Drag to orbit · scroll or pinch to zoom";
  info.sheet.textContent = d ? d.sheet : "";
}

renderer.domElement.addEventListener("pointermove", (ev) => {
  if (ev.pointerType !== "mouse") return;
  const d = pick(ev);
  hovered = d;
  if (d) {
    tip.textContent = d.label;
    tip.style.transform = `translate(${ev.offsetX + 14}px, ${ev.offsetY + 14}px)`;
    tip.hidden = false;
  } else {
    tip.hidden = true;
  }
  renderer.domElement.style.cursor = d ? "pointer" : "grab";
});
renderer.domElement.addEventListener("pointerleave", () => (tip.hidden = true));
renderer.domElement.addEventListener("pointerdown", (ev) => (downAt = [ev.clientX, ev.clientY]));
renderer.domElement.addEventListener("pointerup", (ev) => {
  if (!downAt || Math.hypot(ev.clientX - downAt[0], ev.clientY - downAt[1]) > 5) return;
  showInfo(pick(ev));
});

// Panel controls
const swatches = document.getElementById("skins");
SKINS.forEach((s, i) => {
  const id = `skin-${i}`;
  swatches.insertAdjacentHTML(
    "beforeend",
    `<label class="swatch" for="${id}"><input type="radio" name="skin" id="${id}" autocomplete="off" value="${s.hex}" ${i === 0 ? "checked" : ""}>` +
      `<span class="chip" style="background:${s.hex}" aria-hidden="true"></span><span>${s.name}</span></label>`
  );
});
swatches.addEventListener("change", (e) => setSkin(e.target.value));

document.querySelectorAll('input[name="crown"]').forEach((el) =>
  el.addEventListener("change", (e) => setCutout(e.target.value === "cut-out"))
);
document.querySelectorAll('input[name="pose"]').forEach((el) =>
  el.addEventListener("change", (e) => (state.pose = e.target.value))
);
document.getElementById("plank").addEventListener("change", (e) => setPlank(e.target.checked));
setPlank(false);
document.getElementById("heads").addEventListener("change", (e) => setSecondaryHeads(e.target.checked));
document.getElementById("explode").addEventListener("change", (e) => (state.explode = e.target.checked));
document.getElementById("spin").addEventListener("change", (e) => (controls.autoRotate = e.target.checked));
document.getElementById("base").addEventListener("change", (e) => (base.visible = e.target.checked));
document.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => flyTo(b.dataset.view)));
document.getElementById("snap").addEventListener("click", () => {
  renderer.render(scene, camera);
  const a = document.createElement("a");
  a.href = renderer.domElement.toDataURL("image/png");
  a.download = "dashanan-blockheads.png";
  a.click();
});

function resize() {
  const { clientWidth: w, clientHeight: h } = viewport;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(viewport);
resize();
camera.position.copy(viewPosition("angle"));

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  explodeT += ((state.explode ? 1 : 0) - explodeT) * Math.min(1, dt * 6);
  const e = explodeT * explodeT * (3 - 2 * explodeT);
  for (const a of assemblies) a.obj.position.copy(tmp.copy(a.offset).multiplyScalar(e).add(a.home));
  applyPose(dt, clock.elapsedTime);

  if (flight) {
    flight.t = Math.min(1, flight.t + dt / 0.7);
    const k = 1 - Math.pow(1 - flight.t, 3);
    slerpQ.identity().slerp(flight.rot, k);
    camera.position
      .copy(flight.dir)
      .applyQuaternion(slerpQ)
      .multiplyScalar(THREE.MathUtils.lerp(flight.r0, flight.r1, k))
      .add(controls.target);
    if (flight.t === 1) flight = null;
  }
  controls.update(dt);
  renderer.render(scene, camera);
});

showInfo(null);
