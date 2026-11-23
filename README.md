# 5x1 Developers (docs.5x1.com)

Developer docs for 5x1: making skills and themes for Jibo, installing and testing them, publishing to the 5x1 Store, and the BEacon HTTP API.

Built with [Astro Starlight](https://starlight.astro.build). Pages are Markdown in `src/content/docs/`.

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # static site in dist/
python3 check-links.py   # after a build: every internal link and image must exist
```

Pushing to `main` deploys to GitHub Pages (`.github/workflows/deploy.yml`).

`examples/` holds the tutorial's skill and theme (both tested on a real Jibo); their ZIPs are also in `public/downloads/`.

