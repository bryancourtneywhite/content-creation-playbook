# 🌀 Content Creation Playbook — Ashura Whole Heavens

An interactive, single-page walkthrough of my end-to-end YouTube content
creation process: capture → edit → upload → optimize. Built with an
animated Three.js background (floating Akatsuki clouds + shuriken) and a
print-friendly layout.

## 🔗 Live site

Once GitHub Pages is enabled, this lives at:

```
https://<your-username>.github.io/content-creation-playbook/
```

## What's inside

- The 7-step content workflow (SteelSeries → CapCut → YouTube → vidIQ)
- Pro tips for ranking
- A toolkit section with download links and current pricing
- Interactive 3D background, mobile-friendly, and "Save as PDF" ready

## Tech

- Single self-contained `index.html` (no build step)
- [Three.js](https://threejs.org/) via CDN for the 3D background
- Vanilla CSS + JS

## Run locally

Just open `index.html` in any browser. The 3D background needs an internet
connection the first time to load Three.js; without it, the page falls
back to a static gradient and still reads fine.
