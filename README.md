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
Drop the PDF there with that name, or change the `href` on `#pdf` in `index.html` to wherever the file lives.

## Run locally

ES modules need a server, so opening `index.html` straight from disk won't work:

```bash
python3 -m http.server 5179
```

Then open http://localhost:5179.

## Deploy to GitHub Pages

1. Push this folder to a GitHub repository (the files at the repository root).
2. In the repository, go to **Settings › Pages**.
3. Under **Build and deployment**, set **Source** to *Deploy from a branch*, pick `main` and `/ (root)`, then save.
4. The site appears at `https://<user>.github.io/<repo>/` after a minute or so.

All paths are relative, so it works from a project subpath without changes.
