// Pixel patterns and palettes, ported from the "Minecraft Raavan Faces" design
// (Face.dc.html and Part.dc.html). One character = one printed cell.

export const FACES = {
  dashanan: ["GgGJJGgG","HSSKKSSH","HBBSSBBH","SWESSEWS","SSSssSSS","SMMMMMMS","MMRTTRMM","MsSRRSsM"],
  roar:     ["GgGGGGgG","HBSSSSBH","SSBSSBSS","SWESSEWS","SSSssSSS","MMRRRRMM","MRTPPTRM","sSRRRRSs"],
  smirk:    ["GgGGGGgG","HSSSSBBH","SBBSSSSS","SEWSSEWS","SSSssSSS","SMMMMMMS","SMSSSRRS","sSSSSSSs"],
  laugh:    ["GgGGGGgG","HBBSSBBH","SSSSSSSS","SBBSSBBS","SSSssSSS","SMMMMMMS","SRTTTTRS","sSRPPRSs"],
  fury:     ["GgGGGGgG","HBSSSSBH","SSBSSBSS","SEESSEES","SSSssSSS","SMMMMMMS","MTTTTTTM","sMSSSSMs"],
  grin:     ["GgGGGGgG","HSSSSSSH","SBBSSBBS","SWESSWES","SSSssSSS","SSMMMMSS","STTTTTTS","sSRRRRSs"],
  sage:     ["GgGGGGgG","HSSKKSSH","SBBSSBBS","SWESSEWS","SSSssSSS","SMMMMMMS","MMMRRMMM","MMMMMMMM"],
  tongue:   ["GgGGGGgG","HSSSSSSH","SBBSSBBS","SEWSSWES","SSSssSSS","SMMMMMMS","SMRRRRMS","sSSPPSSs"],
  scar:     ["GgGGGGgG","HSSSSSXH","SBBSSXBS","SWESXEWS","SSSXsSSS","SMMMMMMS","SSRRRRSS","sSSSSSSs"],
  shock:    ["GgGGGGgG","HBBSSBBH","SWWSSWWS","SWESSEWS","SSSssSSS","SMMMMMMS","SSMRRMSS","sSSRRSSs"],
  "side-r": ["GgGGGGgG","HHHHHSSS","HHHHSSSS","HHHSSSSS","HHHSssSS","HHHSssSS","HHHHGSSS","HHHHHSSs"],
  top:      ["GGGGGGGG","GHHHHHHG","GHgGGgHG","GHGJJGHG","GHGJJGHG","GHgGGgHG","GHHHHHHG","GGGGGGGG"],
  back:     ["GgGGGGgG","HHHHHHHH","HHHHHHHH","HHHHHHHH","HHHHHHHH","HHHHHHHH","HHHHHHHH","HHHHHHHH"],
  "crown-front": ["...JJ...","...GG...","..GgGG..","..GJJG..",".GGWWGG.",".GgGGgG.","GJGGGGJG","gGgJJgGg"],
  "crown-side":  ["...JJ...","...GG...","..GGgG..","..GgGG..",".GGJJGG.",".GgGGgG.","GGJGGJGG","gGgGGgGg"],
  "crown-top":   ["........","........","........","...JJ...","...JJ...","........","........","........"],
};
FACES["side-l"] = mirror(FACES["side-r"]);

export const PARTS = {
  "body-front": ["GGSSSSGG","GgGSSGgG","CCGJJGCC","CCCGGCCC","CCCCCCCC","CcCCCCcC","GGGJJGGG","OOOOOOOO","OoOOOOoO","OOOGGOOO","OoOGGOoO","OOOGGOOO"],
  "body-back":  ["GGCCCCGG","GgCCCCgG","CCCCCCCC","CcCCCCcC","CCCCCCCC","CCcCCcCC","GGGGGGGG","OOOOOOOO","OoOOOOoO","OOOOOOOO","OOoOOoOO","OOOOOOOO"],
  "body-side":  ["GGGG","GgGG","CCCC","CcCC","CCCC","CCcC","GGGG","OOOO","OoOO","OOOO","OOoO","OOOO"],
  "body-top":   ["GGCCCCGG","GgCCCCgG","GgCCCCgG","GGCCCCGG"],
  "body-bottom":["OOOOOOOO","OoOOOOoO","OOOOOOOO","OOoOOoOO"],
  "arm-front":  ["GGGG","GgJG","gGGg","SSSS","GGGG","SSsS","SSSS","SsSS","SSSS","GJGG","SSSS","SSSs"],
  "arm-side":   ["GGGG","GgGG","gGGg","SSSS","GGGG","SSsS","SSSS","SsSS","SSSS","GGGG","SSSS","SSSs"],
  "arm-top":    ["GGGG","GgGG","GGgG","GGGG"],
  "hand":       ["SSSS","SsSS","SSsS","SSSS"],
  "leg-front":  ["OOOO","OoOO","OOOO","OOoO","OOOO","GGGG","SSSS","SsSS","SSSS","GJGG","SLLS","LLLL"],
  "leg-side":   ["OOOO","OoOO","OOOO","OOoO","OOOO","GGGG","SSSS","SsSS","SSSS","GGGG","SLLS","LLLL"],
  "leg-top":    ["OOOO","OoOO","OOoO","OOOO"],
  "foot":       ["LLLL","LlLL","LLlL","LLLL"],
  "shield":     ["..GGGGGG..",".GgCCCCgG.","GgCCGGCCgG","GCCGCCGCCG","GCCCGGCCCG","GGCGJJGCGG","GGCGJJGCGG","GCCCGGCCCG","GCCGCCGCCG","GgCCGGCCgG",".GgCCCCgG.","..GGGGGG.."],
  "sword":      ["...K.","..VK.","..VK.",".VKk.",".VKk.",".VKk.",".VKk.",".VKk.",".VKk.",".VKk.",".VKk.",".VKk.","GGJGG","gGGGg","..L..","..L..","..l..",".GJG."],
};

export const SKINS = [
  { hex: "#C9874E", name: "Ochre" },
  { hex: "#4F7FB8", name: "Blue" },
  { hex: "#5E8F4E", name: "Green" },
  { hex: "#B5523B", name: "Brick" },
];

export const PLANK = "#6B4A2E";

export function mirror(rows) {
  return rows.map((r) => r.split("").reverse().join(""));
}


export function shade(hex, f) {
  const n = parseInt(String(hex).replace("#", ""), 16);
  if (isNaN(n)) return hex;
  const r = Math.min(255, Math.round(((n >> 16) & 255) * f));
  const g = Math.min(255, Math.round(((n >> 8) & 255) * f));
  const b = Math.min(255, Math.round((n & 255) * f));
  return "rgb(" + r + "," + g + "," + b + ")";
}

function facePalette(skin, cutout) {
  return {
    S: skin, s: shade(skin, 0.78),
    H: "#2A211D", B: "#120E0C", M: "#1A1412",
    W: "#F2EEE3", E: "#C4161C", R: "#7E1616", T: "#F2EEE3", P: "#E0607E",
    G: "#E9B425", g: "#A86F0C", J: "#C4161C", K: "#F2EEE3", X: "#6A1010",
    ".": cutout ? null : "#1A1412",
  };
}

function partPalette(skin) {
  return {
    S: skin, s: shade(skin, 0.78),
    G: "#E9B425", g: "#A86F0C", J: "#C4161C",
    C: "#7A1F2B", c: "#5A1520", O: "#D9731F", o: "#A9541A",
    L: "#5B3A22", l: "#3E2716", K: "#B8BEC6", k: "#7D848D", V: "#E6EAEE",
    N: "#1A1412", ".": null,
  };
}

// Same per-cell highlight / shadow speckle as the printed sheets.
function faceCell(P, ch, r, c, skin) {
  let fill = ch in P ? P[ch] : skin;
  const k = (r * 3 + c * 5) % 7;
  if ((ch === "S" || ch === "H" || ch === "G") && k === 0) fill = shade(P[ch], ch === "H" ? 1.35 : 1.09);
  if ((ch === "S" || ch === "G") && k === 4) fill = shade(P[ch], 0.92);
  return fill;
}

function partCell(P, ch, r, c, skin) {
  let fill = ch in P ? P[ch] : skin;
  const k = (r * 3 + c * 5) % 7;
  if ((ch === "S" || ch === "G" || ch === "C" || ch === "O") && k === 0) fill = shade(P[ch], 1.09);
  if ((ch === "S" || ch === "G" || ch === "O") && k === 4) fill = shade(P[ch], 0.92);
  return fill;
}

// Returns a grid of CSS colours (null = transparent) for a pattern.
export function colorGrid(kind, rows, skin, opts = {}) {
  const P = kind === "face" ? facePalette(skin, opts.cutout) : partPalette(skin);
  const cell = kind === "face" ? faceCell : partCell;
  return rows.map((row, r) => row.split("").map((ch, c) => cell(P, ch, r, c, skin)));
}
