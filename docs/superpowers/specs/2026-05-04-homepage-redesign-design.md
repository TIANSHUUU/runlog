# Homepage Redesign — Design Spec

**Date:** 2026-05-04
**Status:** Approved

## Summary

Two focused changes to the homepage:
1. Compress the world map and switch to a dark tile style
2. Replace the static 2-column route grid with a horizontal carousel

No changes to route detail pages, data schema, or any other files.

---

## 1. Map

**Current:** CartoDB `light_nolabels`, 44vh height, gray/flat appearance.

**New:**
- Tile URL: `https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png`
- Height: `28vh` (min-height `180px`)
- All existing behaviour preserved: zoom buttons, scroll-wheel-off, auto `fitBounds`, red dot markers, hover card, country highlights (TopoJSON), continent labels

The map remains fully interactive so future routes in other countries/continents render correctly.

---

## 2. Route Carousel

**Current:** A static 2-column CSS grid rendered by `ROUTES.forEach` in `main.js`. Leaves horizontal whitespace, creates an empty cell when route count is odd.

**New:** Horizontal carousel showing 3 cards at a time with prev/next arrow navigation.

### Behaviour
- Displays 3 cards simultaneously at desktop width
- Prev/Next arrow buttons (42px circular, white with border, hover → accent red)
- Prev arrow disabled on first position; Next arrow disabled on last position
- Progress dots below carousel (one dot per "page", active dot stretches to pill shape)
- Cards are clickable, navigate to `route.html?id=`
- On mobile (≤ 640px): show 1 card at a time, arrows still visible

### Cards
- Same visual design as current route cards (photo + name + location + distance + badge)
- Image ratio: keep current 16:9 (`aspect-ratio: 16/9`)
- `thumbnail_position` inline style preserved

### Future-proofing
When routes from multiple cities/countries are added, a city/region tab row can be inserted above the carousel to filter the visible set. No structural change needed — the carousel just renders a filtered `ROUTES` subset.

---

## 3. Files Changed

| File | Change |
|------|--------|
| `style.css` | `#map` height → 28vh; remove `.route-list-section` / `.route-grid` styles; add `.carousel-section`, `.carousel-track`, `.rcard`, `.arrow-btn`, `.progress-dots` styles |
| `main.js` | Tile URL → dark_nolabels; replace route grid generation with carousel initialisation (track, arrows, dots, slide logic) |
| `index.html` | Replace `<main class="route-list-section">` with carousel markup (`section.carousel-section > header + .carousel-wrap + .progress-dots`) |

No changes to `data.js`, `route.html`, `route.js`.

---

## 4. Out of Scope

- City/region filter tabs (deferred until routes span multiple regions)
- Mobile swipe gesture (arrows sufficient for now; can add later)
- Any changes to route detail pages
