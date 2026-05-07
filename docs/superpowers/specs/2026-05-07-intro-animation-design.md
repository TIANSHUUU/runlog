# Intro Animation — Design Spec

**Date:** 2026-05-07
**Status:** Approved

## Summary

A full-screen splash animation shown when the homepage loads. Displays a rotating north-hemisphere dot globe with a running pineapple mascot, followed by a typewriter title. Auto-fades into the homepage after ~6s total. No user interaction required.

---

## Visual Design

| Element | Detail |
|---------|--------|
| Background | `#EDE8DF` warm beige (matches site feel) |
| Globe shape | North hemisphere only, wide semi-ellipse: A = 30% viewport width, B = A × 0.72 |
| Globe dots | Land areas only (from TopoJSON world-atlas), gray `rgba(88,80,70,α)`, depth-shaded |
| Rotation speed | 0.15°/frame (~9°/s at 60fps), starts showing Americas/Atlantic |
| Pineapple | `logo-bgremoved.png`, 88px, runs along globe arc from NW-45° to NE-45° with CSS bob bounce |
| Typewriter text | Pacifico font, 30px, color `#8A8078`, "Tianshu's Runlog 🏃‍♀️" |
| Fade out | opacity 0 over 1s after typewriter + 1.8s pause |

## Timing Sequence

1. **0s** — Globe starts rotating, pineapple starts running
2. **2.2s** — Typewriter text begins (68ms per character)
3. **~5s** — Typewriter complete, 1.8s pause
4. **~6.8s** — Splash fades out (1s), homepage visible

---

## Files

| File | Purpose |
|------|---------|
| `intro.js` | All animation logic (globe canvas, typewriter, pineapple runner) |
| `intro.css` | Splash overlay styles |
| `logo-bgremoved.png` | Transparent-background pineapple mascot |

`index.html` gets the splash overlay HTML + `<link>`/`<script>` tags for the new files.  
No changes to `main.js`, `style.css`, `data.js`, or route pages.

---

## Architecture

**`intro.css`** — One rule block: `#splash` full-screen fixed overlay, text positioning, runner img, fade transition.

**`intro.js`** — Single IIFE, runs on `DOMContentLoaded`:
1. Fetch `world-atlas countries-110m.json` → build offscreen land-mask canvas (720×360 equirectangular) → extract `Uint8Array` for fast `isLand(lat,lng)` lookup
2. Pre-compute `LAND_DOTS[]` — all (lat, lng) grid points on land in north hemisphere (1.6° × 1.8° grid)
3. `drawGlobe(rotLng)` — orthographic projection onto semi-ellipse, clip, depth-shade dots
4. `updateRunner()` — moves pineapple img horizontally between NW/NE-45° bounds, computes Y from ellipse surface formula
5. `animate(ts)` — rAF loop: rotate globe, move runner, advance typewriter phases, trigger fade-out
6. On fade-out complete: `document.getElementById('splash').remove()` (clean DOM)

**Land mask approach** (same as project's existing TopoJSON usage):
```js
fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
  .then(r => r.json()).then(world => { buildLandMask(world); buildDots(); startAnimation(); })
```

---

## Out of Scope

- "Skip" button (not needed per user decision)
- Mobile-specific layout changes (globe scales naturally with VW)
- Second pineapple running frame / sprite animation (deferred)
- localStorage "show once" flag (deferred — add later if desired)
