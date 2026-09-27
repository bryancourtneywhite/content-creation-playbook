# SolAshur Stream Package - Two themes (Black/Red + White/Blue)

A complete, industry-standard streaming package that matches solashur.com, with the
website's drifting **Akatsuki clouds + shuriken** and eclipsed **Hueco Mundo moon** in
the background, plus zanpakuto + angelic-wing motifs. It ships in **two theme variants**,
exactly like the site:

- **Dark (default)** - black + Akatsuki red (Hueco Mundo)
- **Light** - white + electric blue (Lightning Templar)

Switch any scene to the white/blue variant by either:
- adding `data-theme="light"` to the `<html>` tag, or
- appending `?theme=light` to the file URL / OBS Browser source URL.

Everything is built as **self-contained animated HTML overlays** you
add to OBS as **Browser sources** - no build step, no image files, no dependencies
beyond the two shared files below.

> **Why HTML instead of MP4/PSD?** Browser-source overlays are the modern pro approach
> (they animate live, scale cleanly, and let you edit text/colors in seconds). Where the
> classic spec expects MP4/WebM or a PSD, this package gives you the editable source plus
> exact steps to export those formats - see [Exporting](#exporting-to-mp4--webm--psd).

---

## Contents

| File | Deliverable | Type | Recommended size |
|------|-------------|------|------------------|
| `theme.css` | Shared brand theme (colors, type, glow) | shared | - |
| `engine.js` | Shared canvas engine (moon, wings, blade, reishi) | shared | - |
| `scene-starting-soon.html` | **Starting Soon** scene (+ countdown) | scene | 1920×1080 |
| `scene-brb.html` | **Be Right Back** scene | scene | 1920×1080 |
| `scene-ending.html` | **Stream Ending** scene | scene | 1920×1080 |
| `scene-intermission.html` | **Modular intermission**: cam border + gameplay window + chat box | layout | 1920×1080 |
| `scene-offline.html` | **Offline screen** | scene | 1920×1080 |
| `bg-loop.html` | **Plain animated background** (no text) for MP4/WebM export | background | 1920×1080 |
| `icons.html` | **Custom icon set** (editable inline SVG) | assets | scalable |
| `social-banner.html` | **Social banner templates** (YouTube / Twitch / X, editable SVG = PSD stand-in) | assets | see file |
| `webcam-frame.html` | Circular **cam frame** (cloud + shuriken ring) | overlay | square |
| `cam-banner.html` | **6:2 cam banner** - name + sponsor logos cross-fade | overlay | 6:2 (e.g. 900x300) |

The two shared files (`theme.css`, `engine.js`) must sit in the **same folder** as the
scenes - they're linked with relative paths.

---

## Brand tokens

Both palettes live in `theme.css` (`:root` = dark, `:root[data-theme="light"]` = light)
and in `engine.js` (`PALETTES.dark` / `PALETTES.light`). Change them once to reskin
everything; canvas motifs recolor automatically on theme switch.

**Dark (default) - black + Akatsuki red**

| Token | Hex | Use |
|-------|-----|-----|
| Akatsuki crimson | `#d61e2c` | primary |
| Bright red glow | `#ff5563` | hot edges / accents |
| Deep blood red | `#7a0f18` | shadows |
| Pale reishi | `#eef2ff` | moon / feathers / particles |
| Hueco Mundo black | `#0d0b0d` | backdrop |

**Light - white + electric blue**

| Token | Hex | Use |
|-------|-----|-----|
| Electric blue | `#1f6fd6` | primary |
| Bright cyan glow | `#3fa9ff` | hot edges / lightning |
| Soft white | `#f4f8fd` | backdrop |

## Background: clouds, shuriken & moon

Every scene now carries the website's background - drifting **Akatsuki clouds** and
**four-point shuriken** (`Solashur.CloudField`), a **reishi** particle field, rune rings,
and an eclipsed **Hueco Mundo moon** - so the stream package and solashur.com read as one
brand. The cloud/shuriken silhouettes and per-theme colors mirror the site's
`assets/background.js`.

Change them once in `theme.css` (`:root`) and `engine.js` (the `C` object) to reskin the
whole pack.

---

## Adding a scene in OBS

1. **Sources → + → Browser**.
2. Check **Local file** and pick the scene (e.g. `scene-starting-soon.html`).
3. Set **Width 1920 / Height 1080** (scenes are responsive; any 16:9 works).
4. Uncheck **"Shutdown source when not visible"** so animation keeps running.
5. For full-screen scenes, that's it. For the **intermission layout**, keep the browser
  source at the **top** of the source list and add your real sources **below** it:
  - **Game Capture** aligned to the *GAMEPLAY* zone (left)
  - **Video Capture (webcam)** aligned to the *cam* circle (top-right)
  - **Chat** browser source (e.g. StreamElements/Nightbot popout) aligned to the *CHAT* box (bottom-right)
6. For the **cam frame** (`webcam-frame.html`), put your webcam *below* it so your face shows
  through the transparent center.

---

## Editing text & settings

Every scene has a `CONFIG` block near the bottom of its `<script>`. Edit the strings there:

```js
var CONFIG = {
  title:  'STREAM STARTING SOON',
  subtitle: 'Sharpening the blade - hang tight',
  countdownMinutes: 10,  // 0/null hides the countdown
  countdownDoneText: "LET'S GO"
};
```

- **Starting Soon** - title, subtitle, live countdown (minutes from load).
- **BRB / Ending / Offline** - title/subtitle/status + social lines (edit the `#socials` HTML).
- **Intermission** - zone labels, now-playing text, and the scrolling ticker. Reposition the
  three zones by editing `#gameplay`, `#cam`, `#chat` in the CSS (top/left/width/height).

Socials are plain HTML at the bottom of each scene - edit handles directly.

---

## Custom icons

Open `icons.html` to see the full set (zanpakuto, feather, wing, eclipsed moon, hollow,
live-dot, follow, youtube, twitch, discord, x, chat, gamepad, heart, star). Each icon is a
24×24 inline `<svg>` using `currentColor`, so set `color:` to recolor it. Copy any
`<svg>…</svg>` block into a scene, a panel, or your website. They're also exposed at runtime
as `window.SolashurIcons['wing']` etc. for reuse.

---

## Social banners

Open `social-banner.html` for three editable vector banners:
- **YouTube channel art** 2560×1440 (keep key text in the centered safe area)
- **Twitch profile banner** 1200×480
- **X / Twitter header** 1500×500

Edit the `<text>` nodes to change wording. They share one set of `<defs>` so the look stays
consistent.

---

## Exporting to MP4 / WebM / PSD

### Animated background → MP4 / WebM
`bg-loop.html` (and any scene) can be captured to video:

**Option A - OBS (simplest):**
1. Add `bg-loop.html` as a 1920×1080 Browser source, alone on a scene.
2. **Settings → Output → Recording**: format `mp4` (or `webm` for transparency-friendly
  workflows), 60 fps.
3. **Start Recording**, wait ~20–30 s, **Stop**. That file is your loopable background.

**Option B - ffmpeg screen capture (Windows):**
```powershell
# Open bg-loop.html full-screen in a browser first, then:
ffmpeg -f gdigrab -framerate 60 -t 20 -i desktop -pix_fmt yuv420p bg-loop.mp4
```
For a transparent **WebM**, record a scene whose CSS background is `transparent` (the overlay
scenes are) using a tool that preserves alpha, or export a PNG sequence and encode:
```powershell
ffmpeg -framerate 60 -i frame_%04d.png -c:v libvpx-vp9 -pix_fmt yuva420p bg-loop.webm
```

### Banners / icons → PNG
Open the HTML, then screenshot at full resolution, or import the SVG into
Figma/Illustrator/Photoshop and export PNG at the sizes in the table above.

### Banners → layered PSD (if a client requires .psd)
These banners are **vector SVG**, which I can't emit as a binary `.psd` directly. To get a
true layered Photoshop file:
1. Open `social-banner.html`, copy the target `<svg>` block into a `.svg` file.
2. **File → Open** the `.svg` in Photoshop (or place it in Illustrator and export to PSD).
  Each named `<g>` group / `<text>` node imports as an editable layer.
3. Save As `.psd`. Text stays editable; art stays on its own layers.

---

## Cam banner (6:2, above your webcam)

`cam-banner.html` is a transparent 6:2 bar that cross-fades on a loop:
**SOLASHUR -> Sponsored by Razer -> ExitLag -> Amazon -> repeat**, showing each
sponsor's real logo (PNG files in this folder).

- **OBS size:** 900x300 recommended (any 6:2 works: 600x200, 1200x400). Place it
  directly above your webcam source.
- **Per-sponsor tuning** in the `CONFIG.sponsors` block: `logo` (file path),
  `height`/`maxW` (size), `chip` (white plate behind dark logos), `promo`
  (optional code/tagline line under the logo, e.g. `Use code <b>SOLASHUR</b>`).
- **Timing:** `holdMs` (visible time) + `fadeMs` (crossfade). Defaults 4s + 0.7s.
- Missing logo file -> that slide falls back to styled brand-colored text.

> Logos must come from each sponsor's official brand/press kit (you're entitled
> to these as their partner). The current files (`RAZER LOGO.png`, `EXITLAG PNG.png`,
> `AMAZON PNG.png`) are wired in and all read as light logos, so no chip is needed.

## Recommended OBS scene collection

- **Starting Soon** → `scene-starting-soon.html`
- **Live (Just Chatting / cam)** → `webcam-frame.html` over webcam + `bg-loop.html`
- **Live (Gameplay)** → `scene-intermission.html` + game capture + webcam + chat
- **BRB** → `scene-brb.html`
- **Ending** → `scene-ending.html`
- **Offline** (platform banner / holding scene) → `scene-offline.html`

---

## Performance notes

- Overlays target ~60 fps and are lightweight (canvas 2D, capped at 2× DPR).
- If running many browser sources, reduce `PARTICLE_COUNT` / `count` in the reishi setups.
- Keep **"Shutdown source when not visible"** OFF so scenes don't restart their intro
  animation each switch (or ON if you *want* the intro to replay on every switch).
