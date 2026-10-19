# Dashanan Blockheads

A block-style, ten-headed Dashanan (Raavan) papercraft you can preview in 3D before you build it.

- Orbit, zoom and switch between front, back, side and 3/4 views
- Poses: Stand (as built), Run, Run cycle, Strike, Victory
- Choose which of the ten moods is the primary (centre) head
- Four skin colours, black or cut-out crown backdrop
- Toggles for secondary heads, head plank, exploded view, turntable and base board
- Save a PNG of the current view
- Download the print + assembly PDF

Built with plain HTML and [three.js](https://threejs.org) loaded from jsDelivr. No build step.

## Files

```
index.html          page, styles and controls
src/main.js         scene, rig, poses and UI wiring
src/patterns.js     pixel patterns and palettes for every face and part
favicon.svg
assets/             put the print PDF here
.nojekyll           tells GitHub Pages to serve files as-is
```

## The PDF link

The download button points to `assets/dashanan-blockheads-print.pdf`.

## Run locally

ES modules need a server, so opening `index.html` straight from disk won't work:

```bash
python3 -m http.server 5179
```

Then open http://localhost:5179.

