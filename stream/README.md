# Solashur — Stream Overlays (OBS Browser Sources)

Code-based OBS overlays that match **solashur.com**: Akatsuki crimson (`#d61e2c`),
the Hueco Mundo crescent moon, pale reishi particles, black night. No image files
required — everything is drawn live in the browser, so nothing can go stale or
break a copyright rule.

## Files

- **`webcam-moon.html`** — a glowing circular "Hueco Mundo moon" frame for your
  webcam. The center is transparent so your camera shows through the moon-shaped
  hole, ringed by a pulsing crimson glow, an orbiting reishi particle field, a
  slow rune ring, a crescent-moon accent, and a `SOLASHUR` nameplate.

## How to add the webcam frame in OBS

1. In **Sources**, click **+ → Browser**. Name it `Webcam Moon Frame`.
2. Check **Local file** and select `stream/webcam-moon.html`
   *(or* **URL** *and paste* `https://solashur.com/stream/webcam-moon.html` *once
   it's live).*
3. Set **Width `600`**, **Height `600`** (any square works; it scales to fit).
4. Uncheck **"Shutdown source when not visible"** so the animation keeps running.
5. Add your **Video Capture Device** (webcam) as a separate source.
6. In the source list, drag the **webcam BELOW** the `Webcam Moon Frame` so the
   frame renders on top. Size/position the webcam so your face fills the circle.
   *(Optional: right-click the webcam → **Filters** → add a **Circular Mask/Crop**
   or an Image Mask so the corners are hidden if your camera is 16:9.)*

## Customizing

Open `webcam-moon.html` and edit:

- **Nameplate text** — the `NAME` and `SUBTITLE` variables in the `CONFIG` block.
- **Colors** — the `:root` CSS variables at the top (`--accent`, `--accent-2`,
  `--moon`, `--ink`, `--ring` thickness).
- **Particle density** — the `PARTICLE_COUNT` variable.

## Notes

- The overlay background is transparent; OBS composites it over your other
  sources. Do not add a solid background behind it if you want the glow to blend.
- Everything is original CSS/canvas art (no NCSoft / Bleach / Naruto image
  assets), so it's safe to stream and record.
