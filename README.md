# FomoCLI — website

Landing page for [FomoCLI](https://github.com/FomoCLI/FomoCLI), *fomo.family in your terminal*.
Follow along on X: [@fomocli](https://x.com/fomocli).

A static, dependency-free site (HTML + CSS + vanilla JS) with a cinematic intro, an animated
terminal demo, the full command reference and install instructions.

```
index.html   page markup
styles.css   styles — palette taken from the FomoCLI logo (ice white on near-black)
script.js    intro, starfield, parallax, terminal scenes, command tabs, copy buttons
assets/      logo, banner, trader card, favicon, social preview
```

## Run locally

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

## Deploy

Any static host works (GitHub Pages, Vercel, Netlify, Cloudflare Pages). For GitHub Pages,
enable Pages on this branch with the root folder as the source — `.nojekyll` is already in place.
