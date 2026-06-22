# Race Bib / Run the World Visual Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin Tianshu's Runlog into a bold "Race Bib" editorial look — monospace data typography, a `RUN THE WORLD` hero with four derived tally numbers, the existing carousel restyled (logic untouched), and a dark poster header on route detail pages.

**Architecture:** Pure static site (HTML + CSS + vanilla JS, no build step). All color/typography flows through CSS custom properties in `style.css :root`. The dark detail header is a self-contained scoped CSS layer (`.route-hero--dark`) that flips a handful of local variables, so reverting to an all-light site is "delete one CSS block + remove one class". Light baseline is built and committed first; the dark layer is the last task.

**Tech Stack:** HTML5, CSS custom properties, vanilla JS, Leaflet 1.9.4 (unchanged). System monospace stack — no font files.

**Spec:** `docs/superpowers/specs/2026-06-22-visual-overhaul-race-bib-design.md`

---

## Verification approach (read first)

This project has **no test framework**. Verification uses two tools, matching the project's existing idiom (CLAUDE.md verifies via `node -e`):

1. **Logic** (tally numbers, city derivation) → `node` sanity assertions against `data.js`.
2. **Visual** → run a local server and eyeball in a browser:
   ```bash
   # from repo root, in a background terminal
   python3 -m http.server 8000
   # then open http://localhost:8000  (index.html) and a detail page
   ```
   Use `http://localhost:8000/route.html?id=albert-park` for the detail page.

**Branch:** All work happens on `feature/visual-overhaul` (already checked out). `main` is never touched. Confirm before starting:
```bash
git branch --show-current   # must print: feature/visual-overhaul
```

## File structure

| File | Responsibility after this plan |
|------|-------------------------------|
| `style.css` | All design tokens + every restyled component. The only file carrying visual rules. |
| `index.html` | Homepage markup: header tagline, new `.hero` block, untouched carousel markup. |
| `main.js` | Compute & inject 4 tally numbers; carousel + map JS unchanged. |
| `route.html` | Detail markup: dark `.route-hero` replaces old `.route-header` + `.route-meta` + `.stats-bar`. |
| `route.js` | One deletion (the now-absent `header-route-name`); everything else unchanged. |
| `CLAUDE.md` | "Homepage layout" + "Current routes" docs updated to match new reality. |

---

## Task 1: Design tokens

Establishes the editorial palette and the monospace data font. Nothing should visibly break — this only repoints `--bg` to a warmer paper and adds new variables consumed by later tasks.

**Files:**
- Modify: `style.css:3-17` (the `:root` block)

- [ ] **Step 1: Replace the `:root` block**

Replace the existing `:root { … }` (lines 3-17) with:

```css
:root {
  --accent:     #E85D3F;
  --accent-bg:  #FFF2EF;
  --text:       #1C1C1E;
  --muted:      #8E8E93;
  --bg:         #F4F2EC;   /* was #F9F9F7 — warmer paper */
  --white:      #FFFFFF;
  --border:     #EBEBEB;
  --shadow-sm:  0 2px 8px rgba(0,0,0,0.07);
  --shadow-md:  0 8px 32px rgba(0,0,0,0.13);
  --r:          12px;
  --hh:         58px;

  /* editorial overhaul */
  --ink:        #16140F;   /* near-black: titles, borders, dark header bg */
  --paper-2:    #EDEAE0;   /* secondary paper: hover/dividers */
  --line:       #D6D0C2;   /* divider line on paper */

  --font: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
          "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  --font-mono: ui-monospace, "SF Mono", "JetBrains Mono", "Roboto Mono",
               "PingFang SC", monospace;
}
```

- [ ] **Step 2: Verify nothing breaks**

Run the local server (see Verification approach) and open `http://localhost:8000`. Expected: page loads, background is now a slightly warmer off-white. No layout shifts, no console errors.

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "Add editorial design tokens (ink/paper/line + mono font)"
```

---

## Task 2: Homepage header tagline + RUN THE WORLD hero + tally

Adds the hero between header and map, and computes the four derived numbers. The `.logo` keeps its Pacifico script (brand asset, fixed rule in CLAUDE.md) — the editorial energy comes from the giant hero title, not the logo.

**Files:**
- Modify: `index.html:27-33` (header + before `#map`)
- Modify: `main.js:127` (replace route-count fill with tally fill)

- [ ] **Step 1: Write the tally logic sanity test**

Create a throwaway assertion (run it, don't commit it):

```bash
node -e '
'"$(cat data.js)"'
const cityOf = loc => { const p = loc.split(",").map(s=>s.trim()); return p.length>=2 ? p[p.length-2] : p[0]; };
const routes    = ROUTES.length;
const km        = ROUTES.reduce((s,r)=>s+parseFloat(r.distance),0).toFixed(1);
const cities    = new Set(ROUTES.map(r=>cityOf(r.location))).size;
const countries = new Set(ROUTES.map(r=>r.country_iso)).size;
console.log({routes, km, cities, countries});
const ok = routes===6 && km==="57.5" && cities===1 && countries===1;
console.log(ok ? "PASS" : "FAIL");
'
```

- [ ] **Step 2: Run it to confirm expected values**

Expected output:
```
{ routes: 6, km: '57.5', cities: 1, countries: 1 }
PASS
```
If it prints FAIL, stop and reconcile the expressions before continuing — main.js will use these exact expressions.

- [ ] **Step 3: Update the header + add hero markup**

In `index.html`, replace the header (lines 27-30) and add the hero before `<!-- Overview map -->`. The block from `<header class="header">` through the `route-count` span becomes:

```html
  <header class="header">
    <span class="logo"><img src="logo.jpg" alt="Runlog" class="logo-icon"> Tianshu's Runlog</span>
    <span class="header-tagline">Running the world · Est. 2026</span>
  </header>

  <!-- Hero -->
  <section class="hero">
    <div class="hero-lede">
      <div class="hero-kicker">↳ Beautiful routes, logged worldwide</div>
      <h1 class="hero-title">RUN THE<br>W<span class="hero-o">O</span>RLD.</h1>
    </div>
    <div class="hero-tally">
      <div class="hero-stat"><div class="hero-stat-v" id="tally-routes"></div><div class="hero-stat-l">Routes</div></div>
      <div class="hero-stat"><div class="hero-stat-v" id="tally-km"></div><div class="hero-stat-l">KM logged</div></div>
      <div class="hero-stat"><div class="hero-stat-v" id="tally-cities"></div><div class="hero-stat-l">Cities</div></div>
      <div class="hero-stat"><div class="hero-stat-v" id="tally-countries"></div><div class="hero-stat-l">Countries</div></div>
    </div>
  </section>
```

- [ ] **Step 4: Replace the route-count fill in main.js with tally fill**

In `main.js`, replace line 127:

```js
  document.getElementById('route-count').textContent = `${ROUTES.length} routes`;
```

with:

```js
  // ── Hero tally (derived from ROUTES) ──────────────────
  const cityOf = loc => {
    const p = loc.split(',').map(s => s.trim());
    return p.length >= 2 ? p[p.length - 2] : p[0];
  };
  const pad = n => String(n).padStart(2, '0');
  document.getElementById('tally-routes').textContent    = pad(ROUTES.length);
  document.getElementById('tally-km').textContent        = ROUTES.reduce((s, r) => s + parseFloat(r.distance), 0).toFixed(1);
  document.getElementById('tally-cities').textContent    = pad(new Set(ROUTES.map(r => cityOf(r.location))).size);
  document.getElementById('tally-countries').textContent = pad(new Set(ROUTES.map(r => r.country_iso)).size);
```

- [ ] **Step 5: Add hero + header CSS**

In `style.css`, find the `.route-count` rule (line 40) and replace it with:

```css
.header-tagline {
  font-family: var(--font-mono);
  font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--muted);
}

/* ─── Hero ───────────────────────────────────────────── */
.hero {
  display: flex; align-items: flex-end; justify-content: space-between;
  gap: 32px; flex-wrap: wrap;
  padding: 36px 28px 26px;
  margin-top: var(--hh);
  border-bottom: 2px solid var(--ink);
}
.hero-kicker {
  font-family: var(--font-mono);
  font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--accent);
}
.hero-title {
  font-family: var(--font-mono);
  font-size: clamp(44px, 8vw, 84px); line-height: 0.84;
  letter-spacing: -0.04em; font-weight: 800; color: var(--ink);
  margin-top: 14px;
}
.hero-o { color: var(--accent); }
.hero-tally { display: flex; gap: 26px; }
.hero-stat-v {
  font-family: var(--font-mono);
  font-size: clamp(28px, 4vw, 44px); line-height: 0.85;
  letter-spacing: -0.03em; font-weight: 800; color: var(--ink);
}
.hero-stat-l {
  font-family: var(--font-mono);
  font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--muted); margin-top: 6px;
}
```

Then, because the hero now owns the `margin-top: var(--hh)` spacer, remove that property from the `#map` rule (it currently sits directly under the fixed header). In the `#map` block (around line 43-48) delete the line `margin-top: var(--hh);`.

- [ ] **Step 6: Add mobile hero rule**

In `style.css`, inside the existing `@media (max-width: 600px)` block, add:

```css
  .hero { padding: 26px 16px 20px; }
  .hero-tally { gap: 18px; }
```

- [ ] **Step 7: Verify in browser**

Reload `http://localhost:8000`. Expected: a `RUN THE WORLD.` hero with coral `O`, four numbers reading **06 / 57.5 / 01 / 01**, header right shows the tagline, map sits directly below the hero's black rule. Narrow the window to confirm the hero wraps cleanly.

- [ ] **Step 8: Commit**

```bash
git add index.html main.js style.css
git commit -m "Add RUN THE WORLD hero with derived Routes/KM/Cities/Countries tally"
```

---

## Task 3: Carousel + map re-skin (CSS only)

Carousel JS and markup are untouched (per spec: keep the carousel). Only the look changes. The card template in `main.js` already emits the classes we target, so no JS edits here.

**Files:**
- Modify: `style.css` (carousel + card + map rules)

- [ ] **Step 1: Give the overview map an editorial frame**

In `style.css`, in the `#map` rule (around line 43), add a border so it reads as a framed plate:

```css
  border-top: 2px solid var(--ink);
  border-bottom: 2px solid var(--ink);
```

- [ ] **Step 2: Re-skin the carousel label and cards**

Replace the `.carousel-label` rule with:

```css
.carousel-label {
  font-family: var(--font-mono);
  font-size: 11px; font-weight: 700; letter-spacing: 0.18em;
  text-transform: uppercase; color: var(--ink);
}
```

Replace the `.route-card-name`, `.route-card-location`, and `.route-card-distance` rules with:

```css
.route-card-name {
  font-size: 15px; font-weight: 700; letter-spacing: -0.01em;
  margin-bottom: 4px;
}
.route-card-location {
  font-family: var(--font-mono);
  font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--muted); margin-bottom: 10px;
}
.route-card-distance {
  font-family: var(--font-mono);
  font-size: 15px; font-weight: 800; letter-spacing: -0.02em;
  color: var(--ink);
}
```

Replace the card border token in `.route-card` (around line 487) — change `border: 1px solid var(--border);` to `border: 1px solid var(--line);`.

- [ ] **Step 3: Verify in browser**

Reload `http://localhost:8000`. Expected: map has crisp black top/bottom rules; carousel "Routes" label is mono uppercase; each card shows mono uppercase location and a bold mono distance; arrows and progress dots still work (click through). Resize to mobile width — one card per view still works.

- [ ] **Step 4: Commit**

```bash
git add style.css
git commit -m "Re-skin overview map frame and carousel cards in editorial style"
```

---

## Task 4: Route detail — light baseline poster header

This is the **reversible light baseline**: a full poster header in the light palette, replacing the old sticky bar + meta + stats. It is complete and committable on its own. The dark layer comes in Task 5.

**Files:**
- Modify: `route.html:15-59` (header + meta + stats → one `.route-hero`)
- Modify: `route.js:18` (delete the `header-route-name` line)
- Modify: `style.css` (add `.route-hero*` rules; remove obsolete `.route-header`, `.route-meta*`, `.stats-bar`, `.stat*` rules)

- [ ] **Step 1: Replace the detail header markup**

In `route.html`, replace everything from `<header class="route-header">` (line 15) through the closing `</div>` of `.stats-bar` (line 59) with:

```html
  <section class="route-hero">
    <a href="index.html" class="route-hero-back">← All routes</a>
    <div class="route-hero-loc" id="route-location"></div>
    <h1 class="route-hero-title" id="route-title"></h1>
    <div class="route-hero-points" id="route-points"></div>
    <div class="route-hero-meta"><span id="route-date"></span></div>
    <div class="route-hero-stats">
      <div class="route-hero-stat">
        <span class="route-hero-stat-v" id="stat-distance"></span>
        <span class="route-hero-stat-l">Distance</span>
      </div>
      <div class="route-hero-stat">
        <span class="route-hero-stat-v" id="stat-elevation"></span>
        <span class="route-hero-stat-l">Elevation</span>
      </div>
      <div class="route-hero-stat">
        <span class="route-hero-stat-v" id="stat-surface"></span>
        <span class="route-hero-stat-l">Surface</span>
      </div>
      <div class="route-hero-stat">
        <span class="route-hero-stat-v" id="stat-difficulty"></span>
        <span class="route-hero-stat-l">Difficulty</span>
      </div>
    </div>
  </section>
```

Note: every `id` route.js writes to (`route-location`, `route-title`, `route-points`, `route-date`, `stat-distance`, `stat-elevation`, `stat-surface`, `stat-difficulty`) is preserved. Only `header-route-name` is gone.

- [ ] **Step 2: Remove the dead reference in route.js**

In `route.js`, delete line 18:

```js
  document.getElementById('header-route-name').textContent = route.name;
```

- [ ] **Step 3: Add `.route-hero` light CSS**

In `style.css`, replace the entire `/* ─── Route page header ─── */` block (`.route-header`, `.back-btn`, `.back-btn svg`, `.back-btn:hover`, `.header-route-name` — lines 118-140) with the new hero rules. Base `.route-hero` carries the **light** palette via local variables; Task 5 only flips those variables.

```css
/* ─── Route detail poster header ─────────────────────── */
.route-hero {
  --rh-bg:   var(--bg);
  --rh-fg:   var(--ink);
  --rh-back: var(--muted);
  --rh-loc:  var(--accent);
  --rh-line: var(--line);
  --rh-easy: #1A7F4B;
  --rh-mod:  #2B5FC4;
  --rh-chal: var(--accent);

  background: var(--rh-bg); color: var(--rh-fg);
  padding: 26px 28px 0;
}
.route-hero-back {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--rh-back); text-decoration: none;
}
.route-hero-back:hover { color: var(--accent); }
.route-hero-loc {
  font-family: var(--font-mono);
  font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--rh-loc); margin-top: 16px;
}
.route-hero-title {
  font-family: var(--font-mono);
  font-size: clamp(34px, 6vw, 60px); line-height: 0.88;
  letter-spacing: -0.035em; font-weight: 800;
  margin-top: 8px;
}
.route-hero-points {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  font-size: 13px; margin-top: 14px;
}
.route-hero-meta {
  font-family: var(--font-mono);
  font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--rh-back); margin-top: 10px;
}
.route-hero-stats {
  display: flex; margin-top: 22px;
  border-top: 1px solid var(--rh-line);
}
.route-hero-stat {
  flex: 1; min-width: 0; padding: 16px 0;
  border-right: 1px solid var(--rh-line);
}
.route-hero-stat:last-child { border-right: none; }
.route-hero-stat-v {
  display: block;
  font-family: var(--font-mono);
  font-size: clamp(20px, 3vw, 30px); line-height: 0.9;
  letter-spacing: -0.03em; font-weight: 800;
}
.route-hero-stat-v[data-difficulty="Easy"]        { color: var(--rh-easy); }
.route-hero-stat-v[data-difficulty="Moderate"]    { color: var(--rh-mod); }
.route-hero-stat-v[data-difficulty="Challenging"] { color: var(--rh-chal); }
.route-hero-stat-l {
  display: block;
  font-family: var(--font-mono);
  font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--rh-back); margin-top: 8px;
}
```

- [ ] **Step 4: Re-point the Start/Finish link color and remove obsolete rules**

The old `.route-points`/`.route-point-link` rules styled links inside the now-removed `.route-meta`. The links now live in `.route-hero-points`. In `style.css`, update the `.route-point-link` selectors to target the new container — replace the `/* ─── Route points ─── */` block (lines 157-172) with:

```css
/* ─── Route points (Start / Finish links) ────────────── */
.route-hero-points .route-point-link {
  color: var(--rh-fg);
  text-decoration: underline; text-underline-offset: 2px;
}
.route-hero-points .route-point-link:hover { color: var(--accent); }
.route-hero-points .route-point-sep { color: var(--rh-back); }
```

Then delete the now-unused blocks entirely:
- `.route-meta`, `.route-meta h1`, `.route-meta-sub`, `.route-meta-sub span::before`, `.route-meta-sub span:first-child::before` (lines ~177-186)
- `.stats-bar`, `.stats-bar::-webkit-scrollbar`, `.stat`, `.stat:last-child`, `.stat-label`, `.stat-value`, `.stat-value[data-difficulty=...]` (lines ~189-208)
- the old `.route-title-row` / `.route-title-row h1` rules (lines 158-161)

In the `@media (max-width: 600px)` block, delete the now-dead `.route-meta h1 { font-size: 22px; }` line and replace the `.route-header { padding: 0 16px; }` portion — change `.header, .route-header { padding: 0 16px; }` to `.header { padding: 0 16px; }`, and add:

```css
  .route-hero { padding: 22px 16px 0; }
```

- [ ] **Step 5: Verify the light baseline**

Open `http://localhost:8000/route.html?id=albert-park`. Expected: a light poster header — small "← All routes", coral uppercase location, big mono title, a date line, and a four-column stat row (Distance / Elevation / Surface / Difficulty) with "Easy" in green. Below it the speed-colored map and the body (description, highlights, photos, nearby) render unchanged. Click a photo → lightbox still opens. Click "← All routes" → returns to homepage. Check a route with Start/Finish points (`?id=black-rock-bay-trail`) — the underlined links appear under the title.

- [ ] **Step 6: Commit the reversible light baseline**

```bash
git add route.html route.js style.css
git commit -m "Replace detail header/meta/stats with light poster hero (reversible baseline)"
```

---

## Task 5: Route detail — dark poster header layer

The final layer. A single scoped CSS block flips the hero's local variables to the dark palette, plus one class added in markup. **Reverting = delete this block + remove the class.**

**Files:**
- Modify: `route.html` (add `route-hero--dark` to the hero's class)
- Modify: `style.css` (append the scoped dark block)

- [ ] **Step 1: Append the dark variable block**

In `style.css`, immediately after the `.route-hero-stat-l { … }` rule added in Task 4, append:

```css
/* ─── Dark poster header (scoped layer — remove this block + the
       `route-hero--dark` class to revert to the all-light baseline) ─── */
.route-hero--dark {
  --rh-bg:   var(--ink);
  --rh-fg:   var(--paper-light, #F4F2EC);
  --rh-back: #8A8478;
  --rh-loc:  #FFB9A6;
  --rh-line: #3A362C;
  --rh-easy: #5BD18E;
  --rh-mod:  #5B9BFF;
  --rh-chal: var(--accent);
  padding-bottom: 4px;
}
```

- [ ] **Step 2: Add the modifier class in markup**

In `route.html`, change the hero opening tag:

```html
  <section class="route-hero route-hero--dark">
```

- [ ] **Step 3: Verify the dark poster header**

Reload `http://localhost:8000/route.html?id=albert-park`. Expected: the header block is now near-black with paper-colored text, a warm-coral location line, bright-green "Easy", and divider lines in dark brown — while the body below stays light. Confirm contrast is comfortable. Switch to `?id=ruffey-lake-run` and confirm "Moderate" shows the bright blue.

- [ ] **Step 4: Confirm reversibility (do, then undo)**

Temporarily remove ` route-hero--dark` from the class in `route.html` and reload — the header should fall back to the Task 4 light poster with no breakage. Re-add the class. This proves the revert path works. (No commit for this step.)

- [ ] **Step 5: Commit**

```bash
git add route.html style.css
git commit -m "Add dark poster header as scoped, reversible CSS layer"
```

---

## Task 6: Update CLAUDE.md docs

Bring the project guide in line with the new homepage/detail reality so future sessions aren't misled.

**Files:**
- Modify: `CLAUDE.md` ("Homepage layout" section)

- [ ] **Step 1: Rewrite the "Homepage layout" section**

In `CLAUDE.md`, replace the "## Homepage layout" section's body with a description matching reality: intro splash (unchanged) → header with tagline → `RUN THE WORLD` hero with four derived tally numbers (Routes / KM logged / Cities / Countries, all derived from `ROUTES`) → framed decorative world map → restyled route carousel (newest-first). Note that detail pages open with a dark poster header (`.route-hero--dark`) whose colors flip via scoped local CSS variables, and that removing that one block + class reverts to an all-light site.

- [ ] **Step 2: Add an aesthetic note**

Under "## Aesthetic direction", add a bullet: monospace stack (`--font-mono`) is used for all data/labels/numbers (tally, distances, stat labels, kickers); the Pacifico logo and system-sans body prose are unchanged.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "Update CLAUDE.md homepage/detail docs for editorial overhaul"
```

---

## Self-review notes (already reconciled)

- **Spec coverage:** §2 tokens → Task 1; §3.1 header → Task 2; §3.2 hero + four tallies → Task 2; §3.3 map cosmetic → Task 3; §3.4 carousel kept + re-skinned → Task 3; §4.1 dark poster header + back-link-in-hero (option A) → Tasks 4-5; §4.2 scoped dark vars → Task 5; §4.3 body unchanged → preserved in Task 4; §5 unchanged parts → never touched (intro, leaflet logic, lightbox, photos); §6 maintainability → derived tallies (Task 2), central tokens (Task 1); §7 reversibility → light baseline committed (Task 4) before dark layer (Task 5), branch-only; §8 file list → matches tasks; CLAUDE.md → Task 6.
- **Deliberate deviation from spec §4.1 stat list:** spec listed "Distance / Elevation / Difficulty / Logged"; the plan keeps the existing four stats (Distance / Elevation / **Surface** / Difficulty) to avoid dropping the `surface` data, and shows the date as a small `.route-hero-meta` line instead. Same information, nothing lost.
- **Deliberate deviation from mockup:** the `.logo` keeps its Pacifico script (CLAUDE.md fixed rule: "Pacifico — logo only"). The monospace brand seen in mockups was illustrative; switching the logo font is a trivial later tweak if wanted.
- **ID continuity:** all element IDs route.js writes to are preserved in the new hero markup; only `header-route-name` is removed, and its sole writer (route.js:18) is deleted in the same task.
- **No placeholders / type consistency:** local CSS vars are named `--rh-*` consistently across `.route-hero` (Task 4) and `.route-hero--dark` (Task 5); tally expressions in the Step-1 node test match the main.js code in Step 4.
