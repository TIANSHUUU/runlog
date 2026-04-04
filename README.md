# Tianshu's Runlog

A personal running route journal — scenic routes I've actually run, plotted on a world map.

**Live site:** https://tianshuuu.github.io/runlog/

## What it is

Each route has a detail page with an interactive map (GPS trace), stats, highlights worth stopping for, photos, and nearby places to visit after the run. Content is bilingual (English + Chinese).

## Stack

Pure static site — no framework, no backend, no build step.

- [Leaflet.js](https://leafletjs.com/) + CartoDB Voyager tiles for maps
- GPS traces exported from Strava as GPX, parsed with a local Node.js script
- All route data lives in `data.js`

## Adding a new route

**1. Export GPX from Strava**
Go to the activity → `...` menu → Export GPX.

**2. Parse the GPX**
```bash
node tools/gpx-to-route.js path/to/file.gpx
```
This outputs a route object (with downsampled coordinates) ready to paste into `data.js`.

**3. Add to `data.js`**

Paste the output into the `ROUTES` array and fill in the fields:

```js
{
  id: "route-slug",
  name: "Route Name",
  location: "City, Country",
  country_iso: 36,          // ISO 3166-1 numeric — highlights country on world map
  lat: 0.0, lng: 0.0,       // approximate center for the map dot
  distance: "10 km",
  elevation: "+120 m",
  surface: "Trail",
  difficulty: "Moderate",
  date: "2026-04",
  thumbnail: "images/route-slug/thumb.jpg",
  description_en: "...",
  description_zh: "...",
  vibe_en: "...",
  vibe_zh: "...",
  highlights: [
    { name: "...", note_en: "...", note_zh: "..." }
  ],
  photos: ["images/route-slug/01.jpg"],
  nearby: [
    { name: "...", note_en: "...", note_zh: "...", maps_url: "https://..." }
  ],
  coordinates: [ /* from gpx-to-route.js */ ]
}
```

**4. Add photos**

Place images in `images/route-slug/`. Compress before committing:
```bash
sips -Z 1400 images/route-slug/*.jpg
```

**5. Push**
```bash
git add -A && git commit -m "Add [Route Name]" && git push
```

GitHub Pages deploys automatically.

## Country ISO codes (common)

| Country | `country_iso` |
|---|---|
| Australia | 36 |
| China | 156 |
| Japan | 392 |
| France | 250 |
| UK | 826 |
| USA | 840 |

Full list: [ISO 3166-1 numeric codes](https://en.wikipedia.org/wiki/ISO_3166-1_numeric)
