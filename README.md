# FomoCLI — website

Landing page and documentation for [FomoCLI](https://github.com/FomoCLI/FomoCLI),
*fomo.family in your terminal*. Follow along on X: [@fomocli](https://x.com/fomocli).

A static site: plain HTML, CSS and JavaScript with no build step. Libraries are vendored in
`vendor/`, so it runs without any CDN.

```
index.html      landing page: boot intro, WebGL hero, terminal demo, commands, install
docs.html       documentation: every command and flag, guides, reference, search (Ctrl/Cmd K)
css/base.css    shared tokens, nav, buttons, footer, cursor
css/home.css    landing page styles
css/docs.css    docs styles
js/common.js    nav, mobile menu, cursor, clipboard, smooth scroll
js/home.js      boot sequence, GSAP scroll choreography, terminal scenes, command tabs
js/scene.js     three.js hero (glossy blades, travelling rim light, dust, bloom)
js/docs.js      docs scroll spy, table of contents, tabs, copy buttons, search
vendor/         three.js r160, GSAP 3.12 + ScrollTrigger, Lenis 1.1
assets/         logo, trader card, favicon, social preview
```

The palette follows the FomoCLI logo and the CLI's own theme: ice white on near-black, with
green and red kept for gains and losses. If WebGL is unavailable the hero falls back to CSS,
and `prefers-reduced-motion` turns the animation off.

## Run locally

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

## Deploy

Any static host works (Vercel, Netlify, Cloudflare Pages, GitHub Pages). On Vercel, import the
repo with no framework preset and no build command; the root folder is the output.
