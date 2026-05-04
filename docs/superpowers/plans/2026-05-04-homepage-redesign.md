# Homepage Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat gray world map + 2-column route grid with a compressed dark map + interactive horizontal carousel.

**Architecture:** Three files change in sequence — CSS first (no visual breakage since HTML/JS stay unchanged briefly), then HTML structure, then JS logic. Each task is independently verifiable by opening `index.html` in a browser.

**Tech Stack:** Vanilla JS, Leaflet.js 1.9.4, CSS custom properties, no build step.

---

## File Map

| File | What changes |
|------|-------------|
| `style.css` | `#map` height 44→28vh; remove `.route-grid` grid layout; add `.carousel-section`, `.carousel-header`, `.carousel-wrap`, `.carousel-track`, `.arrow-btn`, `.progress-dots`, `.progress-dot` |
| `index.html` | Replace `<main class="route-list-section">…</main>` with `<section class="carousel-section">…</section>` |
| `main.js` | Map tile URL → dark; replace route grid `forEach` with carousel init + slide logic |

---

## Task 1: Darken and compress the map

**Files:**
- Modify: `style.css` lines 43–48
- Modify: `main.js` line 14

- [ ] **Step 1 — Update map height in CSS**

In `style.css`, replace the `#map` block:

```css
/* was: */
#map {
  width: 100vw; height: 44vh; min-height: 260px;
  background: #c4ced6;
  margin-top: var(--hh);
  cursor: default;
}

/* replace with: */
#map {
  width: 100vw; height: 28vh; min-height: 180px;
  background: #1a2030;
  margin-top: var(--hh);
  cursor: default;
}
```

- [ ] **Step 2 — Switch map tile URL in main.js**

In `main.js`, replace the `L.tileLayer(...)` call (line ~14):

```js
/* was: */
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  subdomains: 'abcd',
  maxZoom: 20,
  noWrap: true
}).addTo(map);

/* replace with: */
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  subdomains: 'abcd',
  maxZoom: 20,
  noWrap: true
}).addTo(map);
```

- [ ] **Step 3 — Update mobile map height in CSS**

In `style.css`, inside the `@media (max-width: 600px)` block, update the map override:

```css
/* was: */
#map { height: 36vh; }

/* replace with: */
#map { height: 22vh; }
```

- [ ] **Step 4 — Verify in browser**

Open `index.html`. Confirm:
- Map is noticeably shorter
- Map tiles are dark (dark gray roads/land, not light beige)
- Red route dots still appear with ripple animation
- Hover card still shows on dot mouseover
- Zoom buttons still work
- Route card grid below still renders (unchanged at this point)

- [ ] **Step 5 — Commit**

```bash
git add style.css main.js
git commit -m "Compress map height and switch to dark tile style"
```

---

## Task 2: Carousel CSS

**Files:**
- Modify: `style.css` — replace route list/grid section, add carousel styles

- [ ] **Step 1 — Replace route list section styles**

In `style.css`, find and replace ONLY the two blocks `.route-list-section` and `.route-grid` (leave `.route-card` and all its children untouched — they are reused by the carousel):

```css
/* was: */
/* ─── Route list section ─────────────────────────────── */
.route-list-section {
  max-width: 900px;
  margin: 0 auto;
  padding: 36px 24px 80px;
}

.route-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

/* replace with: */
/* ─── Carousel section ───────────────────────────────── */
.carousel-section {
  max-width: 900px;
  margin: 0 auto;
  padding: 28px 24px 80px;
}

.carousel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.carousel-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--muted);
}

.carousel-arrows {
  display: flex;
  gap: 8px;
}

.arrow-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1.5px solid var(--border);
  background: var(--white);
  color: var(--text);
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: background 0.18s ease, border-color 0.18s ease,
              color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
  user-select: none;
  line-height: 1;
}
.arrow-btn:hover {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--white);
  box-shadow: 0 4px 16px rgba(232,93,63,0.35);
  transform: scale(1.08);
}
.arrow-btn:disabled,
.arrow-btn[disabled] {
  opacity: 0.25;
  pointer-events: none;
  box-shadow: none;
  transform: none;
}

.carousel-wrap {
  overflow: hidden;
}

.carousel-track {
  display: flex;
  gap: 16px;
  transition: transform 0.38s cubic-bezier(0.4, 0, 0.2, 1);
  padding-bottom: 4px; /* prevent card shadow clipping */
}

.carousel-track .route-card {
  flex: 0 0 calc((100% - 32px) / 3); /* 3 visible, 2 gaps of 16px */
  min-width: 0;
}

.progress-dots {
  display: flex;
  gap: 6px;
  justify-content: center;
  margin-top: 14px;
}

.progress-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--border);
  transition: background 0.2s ease, width 0.2s ease, border-radius 0.2s ease;
}
.progress-dot.active {
  background: var(--accent);
  width: 18px;
  border-radius: 3px;
}
```

- [ ] **Step 2 — Update mobile media query**

In `style.css`, inside `@media (max-width: 600px)`, replace:

```css
/* was: */
.route-list-section { padding: 24px 16px 60px; }
.route-grid { grid-template-columns: 1fr; gap: 14px; }

/* replace with: */
.carousel-section { padding: 20px 16px 60px; }
.carousel-track .route-card { flex: 0 0 100%; }
```

- [ ] **Step 3 — No browser check needed yet**

CSS changes won't break anything visible — the old HTML IDs (`route-grid`) still render in a grid since the new CSS targets `.carousel-track .route-card`. Proceed directly to Task 3.

---

## Task 3: Update index.html structure

**Files:**
- Modify: `index.html`

- [ ] **Step 1 — Replace route list section HTML**

In `index.html`, replace:

```html
  <!-- Route card list -->
  <main class="route-list-section">
    <div class="route-grid" id="route-grid"></div>
  </main>
```

With:

```html
  <!-- Route carousel -->
  <section class="carousel-section">
    <div class="carousel-header">
      <span class="carousel-label">Routes</span>
      <div class="carousel-arrows">
        <button class="arrow-btn" id="carousel-prev" disabled aria-label="Previous">←</button>
        <button class="arrow-btn" id="carousel-next" aria-label="Next">→</button>
      </div>
    </div>
    <div class="carousel-wrap">
      <div class="carousel-track" id="carousel-track"></div>
    </div>
    <div class="progress-dots" id="progress-dots"></div>
  </section>
```

- [ ] **Step 2 — Verify in browser**

Open `index.html`. Confirm:
- "Routes" label and two arrow buttons appear below the map
- Arrows are 42px circles, left arrow is grayed out (disabled)
- No route cards yet (JS not updated) — that's expected

---

## Task 4: Carousel JS

**Files:**
- Modify: `main.js` — replace the route grid block with carousel init

- [ ] **Step 1 — Replace route grid generation with carousel init**

In `main.js`, find and replace the entire `// ── Route card list ──` section (currently ~lines 129–146):

```js
/* was: */
  // ── Route card list ───────────────────────────────────
  const grid = document.getElementById('route-grid');
  ROUTES.forEach(route => {
    const a = document.createElement('a');
    a.href      = `route.html?id=${route.id}`;
    a.className = 'route-card';
    a.innerHTML = `
      <img class="route-card-img" src="${route.thumbnail}" alt="${route.name}" loading="lazy" style="object-position:${route.thumbnail_position || 'center'}">
      <div class="route-card-body">
        <div class="route-card-name">${route.name}</div>
        <div class="route-card-location">${route.location}</div>
        <div class="route-card-stats">
          <span class="route-card-distance">${route.distance}</span>
          <span class="badge" data-difficulty="${route.difficulty}">${route.difficulty}</span>
        </div>
      </div>`;
    grid.appendChild(a);
  });

/* replace with: */
  // ── Route carousel ────────────────────────────────────
  const track   = document.getElementById('carousel-track');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  const dotsEl  = document.getElementById('progress-dots');

  // Build cards
  ROUTES.forEach(route => {
    const a = document.createElement('a');
    a.href      = `route.html?id=${route.id}`;
    a.className = 'route-card';
    a.innerHTML = `
      <img class="route-card-img" src="${route.thumbnail}" alt="${route.name}" loading="lazy" style="object-position:${route.thumbnail_position || 'center'}">
      <div class="route-card-body">
        <div class="route-card-name">${route.name}</div>
        <div class="route-card-location">${route.location}</div>
        <div class="route-card-stats">
          <span class="route-card-distance">${route.distance}</span>
          <span class="badge" data-difficulty="${route.difficulty}">${route.difficulty}</span>
        </div>
      </div>`;
    track.appendChild(a);
  });

  // Carousel logic
  let currentSlide = 0;

  function getVisibleCount() {
    return window.innerWidth <= 600 ? 1 : 3;
  }

  function buildDots() {
    const max = ROUTES.length - getVisibleCount();
    dotsEl.innerHTML = '';
    for (let i = 0; i <= max; i++) {
      const d = document.createElement('div');
      d.className = 'progress-dot' + (i === currentSlide ? ' active' : '');
      dotsEl.appendChild(d);
    }
  }

  function slideTo(index) {
    const max = ROUTES.length - getVisibleCount();
    currentSlide = Math.max(0, Math.min(max, index));
    const cardEl  = track.children[0];
    const cardW   = cardEl.offsetWidth + 16; // card width + gap
    track.style.transform = `translateX(-${currentSlide * cardW}px)`;
    prevBtn.disabled = currentSlide === 0;
    nextBtn.disabled = currentSlide >= max;
    dotsEl.querySelectorAll('.progress-dot').forEach((d, i) => {
      d.classList.toggle('active', i === currentSlide);
    });
  }

  prevBtn.addEventListener('click', () => slideTo(currentSlide - 1));
  nextBtn.addEventListener('click', () => slideTo(currentSlide + 1));

  // Rebuild dots and reset on resize (debounced)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      buildDots();
      slideTo(0);
    }, 150);
  });

  buildDots();
  slideTo(0);
```

- [ ] **Step 2 — Verify in browser**

Open `index.html`. Confirm:
- All 5 route cards appear in a horizontal row, 3 visible at once
- Left arrow is grayed out (at position 0)
- Right arrow is active (red on hover)
- Clicking right arrow slides cards left, left arrow appears
- Clicking right arrow twice reaches last position, right arrow grays out
- Progress dots update as you slide
- Clicking a card navigates to the route detail page
- `thumbnail_position` is respected (Royal Park grass visible, not just sky)

On mobile (≤ 600px):
- Only 1 card visible
- Arrows still work, step through all 5 routes

- [ ] **Step 3 — Commit**

```bash
git add style.css index.html main.js
git commit -m "Replace route grid with horizontal carousel"
```

---

## Task 5: Push and verify on live site

- [ ] **Step 1 — Push to GitHub**

```bash
git push origin main
```

- [ ] **Step 2 — Verify on live site**

Open `https://tianshuuu.github.io/runlog/` (allow ~60s for GitHub Pages to deploy).

Confirm:
- Dark map renders correctly (not a blank gray box)
- Map dots visible with ripple animation
- Carousel shows 3 cards, arrows work
- No console errors in browser devtools
