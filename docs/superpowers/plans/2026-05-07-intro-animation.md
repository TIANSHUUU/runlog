# Intro Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a full-screen splash animation (rotating north-hemisphere globe + pineapple mascot + typewriter title) that auto-fades into the homepage on load.

**Architecture:** Two new files (`intro.css`, `intro.js`) plus small additions to `index.html`. The `topojson-client` library is already loaded by `index.html` so `intro.js` can use the `topojson` global directly. The splash is a `position: fixed` overlay that removes itself from the DOM after fading out.

**Tech Stack:** Vanilla JS (Canvas 2D, requestAnimationFrame), CSS transitions, TopoJSON world-atlas CDN (already in project).

---

## File Map

| File | Action | What it does |
|------|--------|-------------|
| `intro.css` | Create | Splash overlay styles, runner, cursor blink, fade transition |
| `intro.js` | Create | All animation logic — land mask, globe draw, typewriter, pineapple runner |
| `index.html` | Modify | Add `<link>` for intro.css in `<head>`, splash HTML as first `<body>` child, `<script src="intro.js">` before `</body>` |
| `logo-bgremoved.png` | Stage | Transparent-background pineapple mascot — commit alongside code |

---

## Task 1: Splash CSS + HTML structure

**Files:**
- Create: `intro.css`
- Modify: `index.html`

- [ ] **Step 1 — Create `intro.css`**

Create `/Users/tantianshu/Documents/code/running-routes/intro.css` with this exact content:

```css
#splash {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #EDE8DF;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  opacity: 1;
  transition: opacity 1s ease;
}
#splash.fade-out { opacity: 0; }

#splash-text {
  position: relative;
  z-index: 10;
  text-align: center;
  padding-top: 48px;
}

#splash-title {
  font-family: 'Pacifico', cursive;
  font-size: 30px;
  font-weight: 400;
  color: #8A8078;
  min-height: 42px;
  letter-spacing: 0.3px;
}

.splash-cursor {
  display: inline-block;
  width: 2px;
  height: 0.82em;
  background: #A09888;
  vertical-align: text-bottom;
  margin-left: 2px;
  animation: splash-blink 0.85s step-end infinite;
}
@keyframes splash-blink { 50% { opacity: 0; } }

#splash-globe-wrap {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
}

#splash-canvas { display: block; }

#splash-runner {
  position: absolute;
  width: 88px;
  height: 88px;
  object-fit: contain;
  transform-origin: center bottom;
  animation: splash-bob 0.38s ease-in-out infinite;
  pointer-events: none;
  z-index: 20;
}
@keyframes splash-bob {
  0%, 100% { margin-bottom: 0; }
  50%       { margin-bottom: 7px; }
}
```

- [ ] **Step 2 — Add `<link>` for intro.css in `index.html` `<head>`**

In `index.html`, after `<link rel="stylesheet" href="style.css">` (line 10), add:

```html
  <link rel="stylesheet" href="intro.css">
```

- [ ] **Step 3 — Add splash HTML as first `<body>` child in `index.html`**

In `index.html`, immediately after `<body>` (before `<header class="header">`), add:

```html
  <!-- Intro splash -->
  <div id="splash">
    <div id="splash-text">
      <div id="splash-title"><span class="splash-cursor"></span></div>
    </div>
    <div id="splash-globe-wrap">
      <canvas id="splash-canvas"></canvas>
    </div>
    <img id="splash-runner" src="logo-bgremoved.png" alt="">
  </div>

```

- [ ] **Step 4 — Verify in browser**

Open `index.html`. The entire page should be covered by a solid warm beige (`#EDE8DF`) overlay. The blinking cursor should be visible top-center. The homepage content underneath is hidden.

- [ ] **Step 5 — Commit**

```bash
git add intro.css index.html
git commit -m "Add intro splash overlay HTML and CSS"
```

---

## Task 2: Create `intro.js`

**Files:**
- Create: `intro.js`

- [ ] **Step 1 — Create `intro.js`**

Create `/Users/tantianshu/Documents/code/running-routes/intro.js` with this exact content:

```js
(function () {
  'use strict';

  // ── Sizing ────────────────────────────────────────────────
  const VW = window.innerWidth;
  const A  = Math.round(VW * 0.30);   // horizontal semi-axis
  const B  = Math.round(A  * 0.72);   // vertical semi-axis
  const CW = A * 2 + 40;
  const CH = B + 6;
  const cx = CW / 2;
  const cy = CH - 2;

  // ── Canvas ────────────────────────────────────────────────
  const canvas = document.getElementById('splash-canvas');
  canvas.width  = CW;
  canvas.height = CH;
  const ctx = canvas.getContext('2d');

  function toRad(d) { return d * Math.PI / 180; }

  function project(lat, lng, rotLng) {
    const phi = toRad(lat);
    const lam = toRad(lng + rotLng);
    return {
      x: A * Math.cos(phi) * Math.sin(lam),
      y: -B * Math.sin(phi),
      z: Math.cos(phi) * Math.cos(lam)
    };
  }

  // ── Land mask (offscreen 720×360 equirectangular canvas) ──
  const MASK_W = 720, MASK_H = 360;
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = MASK_W; maskCanvas.height = MASK_H;
  const mCtx = maskCanvas.getContext('2d');
  let landPixels = null;

  function drawRing(ring) {
    ring.forEach(([lng, lat], i) => {
      const x = (lng + 180) * 2;
      const y = (90 - lat) * 2;
      i === 0 ? mCtx.moveTo(x, y) : mCtx.lineTo(x, y);
    });
    mCtx.closePath();
  }

  function buildLandMask(world) {
    const geo = topojson.feature(world, world.objects.countries);
    mCtx.fillStyle = 'white';
    geo.features.forEach(f => {
      const { type, coordinates } = f.geometry;
      mCtx.beginPath();
      if (type === 'Polygon') {
        coordinates.forEach(ring => drawRing(ring));
      } else if (type === 'MultiPolygon') {
        coordinates.forEach(poly => poly.forEach(ring => drawRing(ring)));
      }
      mCtx.fill('evenodd');
    });
    const img = mCtx.getImageData(0, 0, MASK_W, MASK_H);
    landPixels = new Uint8Array(MASK_W * MASK_H);
    for (let i = 0; i < MASK_W * MASK_H; i++) {
      landPixels[i] = img.data[i * 4];
    }
  }

  function isLand(lat, lng) {
    let norm = ((lng % 360) + 360) % 360;
    if (norm > 180) norm -= 360;
    const x = Math.min(MASK_W - 1, Math.max(0, Math.round((norm + 180) * 2)));
    const y = Math.min(MASK_H - 1, Math.max(0, Math.round((90 - lat) * 2)));
    return landPixels[y * MASK_W + x] > 128;
  }

  // ── Pre-compute north-hemisphere land dots ────────────────
  let LAND_DOTS = [];

  function buildDots() {
    for (let lat = 1; lat <= 88; lat += 1.6) {
      for (let lng = -180; lng < 180; lng += 1.8) {
        if (isLand(lat, lng)) LAND_DOTS.push([lat, lng]);
      }
    }
  }

  // ── Draw globe frame ──────────────────────────────────────
  function drawGlobe(rotLng) {
    ctx.clearRect(0, 0, CW, CH);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, A + 10, B + 10, 0, Math.PI, Math.PI * 2);
    ctx.clip();
    LAND_DOTS.forEach(([lat, lng]) => {
      const p = project(lat, lng, rotLng);
      if (p.z <= 0.02) return;
      const px = cx + p.x, py = cy + p.y;
      if (py > cy + 2) return;
      const r     = 0.7 + 1.1 * p.z;
      const alpha = 0.25 + 0.55 * p.z;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(88, 80, 70, ${alpha})`;
      ctx.fill();
    });
    ctx.restore();
    ctx.beginPath();
    ctx.ellipse(cx, cy, A, B, 0, Math.PI, Math.PI * 2);
    ctx.strokeStyle = 'rgba(88,80,70,0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // ── Pineapple runner ──────────────────────────────────────
  const screenCX   = window.innerWidth / 2;
  const leftBound  = screenCX - A * (Math.SQRT2 / 2);
  const rightBound = screenCX + A * (Math.SQRT2 / 2);
  let runX = leftBound, runDir = 1;

  function updateRunner() {
    runX += 1.4 * runDir;
    if (runX >= rightBound) runDir = -1;
    else if (runX <= leftBound) runDir = 1;
    const el = document.getElementById('splash-runner');
    if (!el) return;
    const relX  = runX - screenCX;
    const surfY = B * Math.sqrt(1 - (relX / A) ** 2);
    el.style.left      = (runX - 44) + 'px';
    el.style.bottom    = (surfY + 2) + 'px';
    el.style.transform = `scaleX(${runDir})`;
  }

  // ── Animation sequence ────────────────────────────────────
  // Split MAIN_TEXT into Unicode grapheme clusters so emoji don't break
  const CHARS = Array.from("Tianshu's Runlog 🏃‍♀️");
  let rotAngle = -40, phase = 'globe';
  let typeIndex = 0, lastType = 0, globeStart = null, animFrame;

  function animate(ts) {
    if (!globeStart) globeStart = ts;
    const elapsed = ts - globeStart;

    rotAngle += 0.15;
    drawGlobe(rotAngle);
    updateRunner();

    // Phase: globe (2.2s) → typewriter → pause (1.8s) → fadeout
    if (phase === 'globe' && elapsed > 2200) {
      phase = 'typewriter'; lastType = ts;
    }

    if (phase === 'typewriter' && ts - lastType > 68) {
      const el = document.getElementById('splash-title');
      if (typeIndex < CHARS.length) {
        el.innerHTML = CHARS.slice(0, typeIndex + 1).join('') +
                       '<span class="splash-cursor"></span>';
        typeIndex++; lastType = ts;
      } else {
        el.textContent = CHARS.join('');
        phase = 'pause'; lastType = ts;
      }
    }

    if (phase === 'pause' && ts - lastType > 1800) {
      phase = 'done';
      const splash = document.getElementById('splash');
      splash.classList.add('fade-out');
      setTimeout(() => splash.remove(), 1000);
      return; // stop rAF loop
    }

    animFrame = requestAnimationFrame(animate);
  }

  // ── Boot: fetch TopoJSON, build land mask, start loop ─────
  fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
    .then(r => r.json())
    .then(world => {
      buildLandMask(world);
      buildDots();
      animFrame = requestAnimationFrame(animate);
    });

})();
```

- [ ] **Step 2 — Add `<script src="intro.js">` to `index.html`**

In `index.html`, add `intro.js` as the last script before `</body>`. The final script block should read:

```html
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js"></script>
  <script src="data.js"></script>
  <script src="main.js"></script>
  <script src="intro.js"></script>
</body>
```

- [ ] **Step 3 — Verify in browser**

Open `index.html`. Confirm:
- Warm beige splash covers the page
- Globe (north hemisphere semi-ellipse, ~60% screen width) appears at bottom after ~0.5s data load
- Dots form recognisable continent shapes (North America, Europe, Asia visible as globe rotates)
- Pineapple (`logo-bgremoved.png`) runs left↔right along the arc with a bob bounce
- After ~2.2s, "Tianshu's Runlog 🏃‍♀️" types out character by character in Pacifico
- After typing completes + 1.8s, splash fades to transparent over 1s
- Homepage (map + carousel) is fully visible and interactive after fade

- [ ] **Step 4 — Commit all files**

```bash
git add intro.css intro.js index.html logo-bgremoved.png
git commit -m "Add intro animation: globe, pineapple runner, typewriter"
```

---

## Task 3: Push and verify on live site

- [ ] **Step 1 — Push**

```bash
git push origin main
```

- [ ] **Step 2 — Verify on GitHub Pages**

Open `https://tianshuuu.github.io/runlog/` (~60s for deploy). Confirm splash animation plays and fades into the homepage correctly.
