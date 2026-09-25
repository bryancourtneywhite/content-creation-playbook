# 🌀 ashura.gg — Ashura Whole Heavens

The official site for **Ashura Whole Heavens**: livestreams, AION 2 builds
and guides, and the content-creation playbook. Interactive multi-page site
with an animated Three.js background (floating Akatsuki clouds + shuriken).

## 🔗 Live site

- **Custom domain (target):** [https://ashura.gg](https://ashura.gg)
- **GitHub Pages (current):** [https://bryancourtneywhite.github.io/content-creation-playbook/](https://bryancourtneywhite.github.io/content-creation-playbook/)

## Pages

- **Playbook** (`index.html`) — the 7-step content workflow + Golden Meta
  (real front-page AION 2 videos with tags, descriptions, analytics)
- **Watch** (`watch.html`) — embedded YouTube (auto-live) + Twitch (live + chat)
- **AION 2 Builds** (`builds/index.html`) — searchable/filterable builds & guides
  - Templar Macro Guide with an interactive JSON-driven build viewer + Questlog link

## Tech

- Static site, no build step — hosts free on GitHub Pages
- Shared assets: `assets/style.css`, `assets/background.js`
- [Three.js](https://threejs.org/) via CDN for the 3D background
- Vanilla CSS + JS

## Custom domain setup (ashura.gg)

1. Buy `ashura.gg` from a registrar (Namecheap, Porkbun, etc.). `.gg` runs
   ~$60–75/year.
2. The repo already includes a `CNAME` file pointing to `ashura.gg`.
3. At your registrar's DNS, add for the **apex** domain (`ashura.gg`) four
   A records pointing to GitHub Pages:
   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`
   And a `CNAME` record for `www` → `bryancourtneywhite.github.io`.
4. In the repo: **Settings → Pages → Custom domain** → enter `ashura.gg` → Save,
   then check **Enforce HTTPS** once the cert is issued.

DNS can take from minutes to a day or so to propagate.

## Run locally

Open `index.html` in a browser. Note: Twitch embeds only work on the live
domain(s), not `file://`. The 3D background needs internet the first time to
load Three.js, and falls back to a static gradient if unavailable.
