# Tianshu's Runlog — Project Guide for Claude

## What this project is
A personal running routes website for Tianshu, deployed at https://tianshuuu.github.io/runlog/.
Pure static site: HTML + CSS + JS, no framework, no build step. Hosted on GitHub Pages (repo: TIANSHUUU/runlog, branch: main).

## Aesthetic direction
- Clean and modern — think Monocle magazine or a well-designed travel guide
- Typography-forward, generous whitespace
- Accent color: `#E85D3F` (coral red). Used for interactive elements and branding only
- Descriptive body text: dark gray (`#3A3A3C`). Light gray (`var(--muted)`, `#8E8E93`) is reserved for metadata only (date, location, distance) — never for descriptive sentences

## File structure
```
index.html      — Homepage: decorative map + route card grid
route.html      — Route detail page (single template, loaded via ?id=)
style.css       — All styles
main.js         — Homepage map + route card logic
route.js        — Route detail page logic
data.js         — ROUTES array (single source of truth for all route data)
tools/
  gpx-to-route.js  — Node script: parses GPX → outputs data.js snippet with speed coords
images/
  [route-id]/
    thumb.jpg   — Cover photo (also used as first photo in detail page)
    01.jpg, 02.jpg, ...  — Additional detail photos
```

## Adding a new route — standard workflow
1. **GPX → coordinates**: Run `node tools/gpx-to-route.js ~/Downloads/[file].gpx`
   - Outputs 120 simplified `[lat, lng, speed]` triples (speed = 0–1 normalized relative pace)
   - Also prints distance, center lat/lng
2. **Elevation**: Extract from GPX with Python: `python3 -c "import xml.etree.ElementTree as ET; ..."`
3. **Images**: Compress with `sips -Z 1400 source.jpg --out dest.jpg`, target ~400–900 KB
   - Place in `images/[route-id]/thumb.jpg` (cover), `01.jpg`, `02.jpg`...
4. **data.js**: Append new route object to ROUTES array (see schema below)
5. **Verify**: `node -e "$(cat data.js); console.log(ROUTES.length, ROUTES.at(-1).id)"`
6. **Deploy**: `git add -A && git commit && git push origin main`

## data.js route schema
```js
{
  id: "kebab-case-name",           // matches image folder name
  name: "Route Display Name",
  location: "Suburb, City, Country",
  country_iso: 36,                 // ISO 3166-1 numeric (Australia = 36, USA = 840, etc.)
  lat: -37.123,                    // route center, from GPX tool output
  lng: 145.123,
  distance: "10.1 km",
  difficulty: "Easy",              // Easy | Moderate | Challenging
  surface: "Trail / Paved",
  elevation: "166 m",              // total gain in metres, from GPX
  date: "Feb 2026",                // human-readable month + year
  thumbnail: "images/[id]/thumb.jpg",
  description_en: "",              // 2–4 sentences, dark descriptive prose
  description_zh: "",              // Chinese translation, same length
  vibe_en: "",                     // 1–2 sentences, subjective feel of the run
  vibe_zh: "",
  highlights: [
    { name: "...", note_en: "...", note_zh: "..." }
  ],
  photos: [
    "images/[id]/thumb.jpg",       // cover always first
    "images/[id]/01.jpg"
  ],
  nearby: [
    { name: "...", note_en: "...", note_zh: "...", maps_url: "..." }
  ],
  coordinates: [
    [-37.123, 145.123, 0.72],      // [lat, lng, speed 0–1]
    // 120 points total
  ]
}
```

## Fixed rules (never deviate without being asked)
- **No `duration` field** — never add it, Tianshu explicitly removed it
- **Difficulty colors**: Easy = green (`#1A7F4B`), Moderate = blue (`#2B5FC4`), Challenging = red (accent)
- **Speed coloring**: `hsl(speed * 120, 88%, 42%)` — red=slow, yellow=mid, green=fast. Always use Leaflet Canvas renderer for performance
- **Photos**: compress to 1400px max dimension with `sips`. Cover photo = `thumb.jpg`, also appears as first item in `photos[]`
- **Bilingual content**: all user-facing text has `_en` and `_zh` variants. Body text is written in natural prose, not translated robotically
- **country_iso**: always set — needed for the blue country highlight on the world map

## Tech stack details
- **Map**: Leaflet.js 1.9.4 + CartoDB `light_nolabels` tiles (`noWrap: true`, `maxBounds` to prevent world repeat)
- **Country highlights**: TopoJSON world-atlas@2, filtered to only highlighted ISOs, no interaction (decorative)
- **Continent labels**: custom Leaflet DivIcon markers, non-interactive, hardcoded English
- **Route detail map**: `light_all` tiles (with labels), speed-colored polyline, Canvas renderer
- **Lightbox**: CSS opacity transition on `.lightbox.open`, ESC + click-outside to close
- **Photo grid**: CSS `:has()` for adaptive layout (1/2/3/4/5 photos)
- **Fonts**: Pacifico (logo only) + system font stack

## Current routes (as of Apr 2026)
| id | Name | Distance | Difficulty | Location |
|----|------|----------|------------|----------|
| black-rock-bay-trail | Black Rock Bay Trail | 10.9 km | Easy | Melbourne |
| gardiners-creek-trail | Gardiners Creek Trail | 5.0 km | Easy | Melbourne |
| ruffey-lake-run | Ruffey Lake Run | 10.1 km | Moderate | Melbourne |
