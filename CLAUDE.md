# Tianshu's Runlog — Project Guide for Claude

## What this project is
A personal running routes website for Tianshu, deployed at https://tianshuuu.github.io/runlog/.
Pure static site: HTML + CSS + JS, no framework, no build step. Hosted on GitHub Pages (repo: TIANSHUUU/runlog, branch: main).
Local path: `/Users/tantianshu/Documents/code/running-routes/`

## Aesthetic direction
- "Race Bib / Run the World" editorial sports-magazine look on a warm-paper base (`--bg #F4F2EC`, ink `#16140F`) — bold, athletic, high-impact, still clean
- Typography-forward, generous whitespace
- Accent color: `#E85D3F` (coral red). Used for interactive elements and branding only
- Descriptive body text: dark gray (`#3A3A3C`). Light gray (`var(--muted)`, `#8E8E93`) is reserved for metadata only (date, location, distance) — never for descriptive sentences
- Section titles (HIGHLIGHTS, PHOTOS, NEARBY): blue `#3B70D6` — this was intentionally kept after testing gray; do not change

### Type system (three layers — keep them separate)
- **Display headlines** (`--font-display` = Oswald, condensed, UPPERCASE): homepage `RUN THE WORLD` hero, route titles, section labels. The athletic punch.
- **Reading prose** (`--font-body` = Source Serif 4): English descriptions, highlights, nearby notes — magazine-editorial serif. Chinese prose falls back to system sans (PingFang) via the font stack; **no CJK web font** (perf).
- **Data layer** (`--font-mono` = system monospace): all numbers, stat values, small uppercase labels, kickers, location lines. The "technical log" feel.
- Logo stays Pacifico (brand). The big hero headline carries the energy, not the logo.

## Homepage layout
Order: intro splash → header → hero → world map → route carousel.
- **Intro splash** (`#splash`, `intro.js`/`intro.css`): low-fi dot-globe + typewriter "Tianshu's Runlog" + running-pineapple. **Plays once per browser session** (`sessionStorage` guard); returning from a route page does not replay it. `intro.js` is loaded with `?v=N` — bump N if you need to bust browser cache.
- **Header**: Pacifico logo only (the tagline was removed — "Est. 2026" misread as a running-origin date).
- **Hero**: giant Oswald `RUN THE WORLD.` (coral `O`) + four derived tally numbers, all computed from `ROUTES` in `main.js`: Routes (count), KM logged (sum of `distance`), Cities (distinct second-to-last `location` segment), Countries (distinct `country_iso`). Bottom edge is a 2px ink rule.
- **World map** (decorative, framed with 2px ink top/bottom rules), 44vh:
  - CartoDB `light_nolabels` tiles, `noWrap: true`, `maxBounds`; drag + zoom buttons on, scroll-zoom off; auto `fitBounds` (`maxZoom: 4`)
  - Blue country highlights (TopoJSON, decorative, no interaction); continent labels (non-interactive DivIcons); red dot markers: hover preview card, click → route detail
- **Route carousel** (kept deliberately — NOT a vertical list, which gets too long): horizontal cards, arrows + progress dots, newest-first, **autoplay every 4.5s** (pauses on hover / hidden tab, resets on manual nav). One card per view on mobile. Card: cover photo (16:9) + name + mono uppercase location + bold mono distance + difficulty badge.

## Route detail layout
Order: floating back button → dark poster header → map → content.
- **Dark poster header** (`.route-hero.route-hero--dark`): near-black block with `← All routes`, coral location line, big Oswald uppercase title, date, and a 4-up stat bar (Distance / Elevation / Surface / Difficulty; 2×2 grid on mobile). Colors flow through scoped `--rh-*` local variables. **Reversibility:** delete the `.route-hero--dark` block in `style.css` and drop the class → reverts to the all-light poster baseline. The old sticky `.route-header`, `.route-meta`, `.stats-bar` are gone.
- **Floating back button** (`.route-back-float`, `#route-back-float`): frosted pill, dark-gray text, fixed top-left, fades in after scrolling >240px past the hero (so long pages always have a way back).
- **Content**: speed legend → description → vibe → highlights → photos → nearby. Body English in serif, Chinese in system sans.

## File structure
```
index.html      — Homepage: splash + header + hero + map + carousel
route.html      — Route detail page (single template, loaded via ?id=)
style.css       — All styles (design tokens in :root)
main.js         — Homepage map, hero tally, carousel (+ autoplay)
route.js        — Route detail page logic
intro.js        — Intro splash animation (once-per-session)
intro.css       — Intro splash styles
data.js         — ROUTES array (single source of truth for all route data)
CLAUDE.md       — This file
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
   - Also prints distance and center lat/lng
2. **Elevation**: Extract from GPX with Python:
   ```
   python3 -c "import xml.etree.ElementTree as ET; tree=ET.parse('file.gpx'); ns={'g':'http://www.topografix.com/GPX/1/1'}; eles=[float(e.text) for e in tree.findall('.//g:ele',ns)]; print(sum(max(0,eles[i+1]-eles[i]) for i in range(len(eles)-1)))"
   ```
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
- **Difficulty colors**: Easy = green (`#1A7F4B`), Moderate = blue (`#2B5FC4`), Challenging = red (accent). Applied via `data-difficulty` attribute on `.badge` and `.route-hero-stat-v` (on the dark header these flip to brighter variants via `--rh-easy/-mod/-chal`)
- **Type system**: headlines = Oswald (`--font-display`), reading prose = Source Serif 4 (`--font-body`), data/labels = monospace (`--font-mono`); never a CJK web font (Chinese falls back to system sans). See "Type system" above
- **Speed coloring**: `hsl(speed * 120, 88%, 42%)` — red=slow, yellow=mid, green=fast. Always use Leaflet Canvas renderer for performance
- **Photos**: compress to 1400px max with `sips`. Cover = `thumb.jpg`, always first in `photos[]`
- **Bilingual content**: all user-facing text has `_en` and `_zh` variants. Written as natural prose, not robotic translation
- **country_iso**: always set — needed for blue country highlight on world map
- **Section titles**: keep blue `#3B70D6` — gray was tested and rejected
- **Photo thumbnails**: all `object-fit: cover` images must use `object-position: center` — show the center of the image, not the top
- **Avoid orphan characters**: if a line of text leaves only 1–2 characters on the next line, shorten or rephrase to eliminate the widow. Applies to both EN and ZH

## Tech stack details
- **Homepage map**: Leaflet.js 1.9.4, CartoDB `light_nolabels`, decorative only
- **Country highlights**: TopoJSON world-atlas@2, `filter` to highlighted ISOs only (prevents invisible polygons intercepting clicks)
- **Route detail map**: CartoDB `light_all` (with labels), speed-colored polyline, Canvas renderer, scroll wheel zoom disabled until clicked
- **Lightbox**: CSS opacity transition on `.lightbox.open`, ESC + click-outside to close
- **Photo grid**: CSS `:has()` adaptive layout (1/2/3/4/5 photos)
- **Fonts**: Pacifico (logo only) + Oswald (`--font-display`, headlines) + Source Serif 4 (`--font-body`, English prose) + system monospace (`--font-mono`, data). Oswald & Source Serif 4 loaded from Google Fonts (Latin only, light); Chinese always uses the system sans stack — no CJK web font. Font `<link>`s live in both `index.html` and `route.html` heads

## Current routes (as of May 2026)
| id | Name | Distance | Difficulty | Location |
|----|------|----------|------------|----------|
| black-rock-bay-trail | Black Rock Bay Trail | 10.9 km | Easy | Melbourne, Bayside |
| gardiners-creek-trail | Gardiners Creek Trail | 5.0 km | Easy | Melbourne, Deakin area |
| ruffey-lake-run | Ruffey Lake Run | 10.1 km | Moderate | Doncaster, Melbourne |
| st-kilda-brighton-beach | St Kilda Coastal Run | 11.3 km | Easy | Melbourne, Bayside |
| royal-park | Royal Park Run | 10.2 km | Easy | Parkville, Melbourne |
| albert-park | Albert Park Lake Run | 10.0 km | Easy | Albert Park, Melbourne |
