#!/usr/bin/env node
/**
 * GPX → data.js route entry converter
 * Usage: node tools/gpx-to-route.js your-run.gpx
 *
 * Outputs a route object you can copy-paste into data.js
 * Coordinates include relative speed [lat, lng, speed] (0=slow, 1=fast)
 */

const fs   = require('fs');
const path = require('path');

const file = process.argv[2];
if (!file) {
  console.error('Usage: node tools/gpx-to-route.js <file.gpx>');
  process.exit(1);
}

const xml = fs.readFileSync(file, 'utf8');

// ── Extract track points with timestamps ──────────────
const trkptRe = /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"[^>]*>([\s\S]*?)<\/trkpt>/g;
const points = [];
let m;
while ((m = trkptRe.exec(xml)) !== null) {
  const lat  = parseFloat(m[1]);
  const lng  = parseFloat(m[2]);
  const body = m[3];
  const tMatch = body.match(/<time>([^<]+)<\/time>/);
  const t = tMatch ? new Date(tMatch[1]).getTime() : null;
  points.push({ lat, lng, t });
}

if (points.length === 0) {
  console.error('❌  No track points found. Is this a valid GPX file?');
  process.exit(1);
}

// ── Haversine distance (meters) ───────────────────────
function haversine(a, b) {
  const R = 6371e3;
  const φ1 = a.lat * Math.PI / 180, φ2 = b.lat * Math.PI / 180;
  const Δφ = (b.lat - a.lat) * Math.PI / 180;
  const Δλ = (b.lng - a.lng) * Math.PI / 180;
  const s  = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1-s));
}

// ── Total distance ────────────────────────────────────
let totalDist = 0;
for (let i = 1; i < points.length; i++) totalDist += haversine(points[i-1], points[i]);
const distKm    = (totalDist / 1000).toFixed(1);
const centerLat = points.reduce((s, p) => s + p.lat, 0) / points.length;
const centerLng = points.reduce((s, p) => s + p.lng, 0) / points.length;

// ── Per-point speeds (m/s) ────────────────────────────
const hasTime = points.every(p => p.t !== null);
let speeds = new Array(points.length).fill(0);

if (hasTime) {
  // Speed at each point = avg of segment before + after
  const segSpeeds = [];
  for (let i = 1; i < points.length; i++) {
    const dt = (points[i].t - points[i-1].t) / 1000; // seconds
    const d  = haversine(points[i-1], points[i]);
    segSpeeds.push(dt > 0 ? d / dt : 0);
  }
  for (let i = 0; i < points.length; i++) {
    const prev = i > 0                  ? segSpeeds[i-1] : segSpeeds[0];
    const next = i < segSpeeds.length   ? segSpeeds[i]   : segSpeeds[segSpeeds.length-1];
    speeds[i] = (prev + next) / 2;
  }

  // Rolling average (window=9) to smooth GPS noise
  const win = 9, half = Math.floor(win/2);
  const smoothed = speeds.map((_, i) => {
    const lo = Math.max(0, i - half), hi = Math.min(speeds.length - 1, i + half);
    let s = 0; for (let j = lo; j <= hi; j++) s += speeds[j];
    return s / (hi - lo + 1);
  });
  speeds = smoothed;

  // Normalize to 0–1 (clamp outliers at 5th/95th percentile)
  const sorted = [...speeds].sort((a, b) => a - b);
  const lo = sorted[Math.floor(sorted.length * 0.05)];
  const hi = sorted[Math.floor(sorted.length * 0.95)];
  const range = hi - lo || 1;
  speeds = speeds.map(v => Math.max(0, Math.min(1, (v - lo) / range)));
}

// ── Downsample (keep ≤ 120 points) ───────────────────
function downsample(pts, target) {
  if (pts.length <= target) return pts.map((_, i) => i);
  const step = (pts.length - 1) / (target - 1);
  return Array.from({ length: target }, (_, i) => Math.round(i * step));
}

const indices = downsample(points, 120);
const coords  = indices
  .map(i => {
    const p = points[i];
    const s = hasTime ? speeds[i].toFixed(2) : null;
    return s !== null
      ? `      [${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}, ${s}]`
      : `      [${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}]`;
  })
  .join(',\n');

// ── Try to extract name/date from GPX metadata ────────
const nameMatch = xml.match(/<name>([^<]+)<\/name>/);
const timeMatch = xml.match(/<time>(\d{4}-\d{2})/);
const gpxName   = nameMatch ? nameMatch[1].trim() : 'My Run';
const gpxDate   = timeMatch ? timeMatch[1] : '2024-01';
const slug      = path.basename(file, '.gpx')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ── Output ────────────────────────────────────────────
const output = `  {
    id: "${slug}",
    name: "${gpxName}",
    location: "City, Country",
    country_iso: 0,                       // ← ISO 3166-1 numeric
    lat: ${centerLat.toFixed(6)},
    lng: ${centerLng.toFixed(6)},
    distance: "${distKm} km",
    difficulty: "Easy",                   // ← Easy / Moderate / Challenging
    surface: "Paved path",                // ← surface type
    elevation: "< XX m",                  // ← elevation gain
    date: "${gpxDate}",
    thumbnail: "images/${slug}/thumb.jpg",
    description_en: "",
    description_zh: "",
    vibe_en: "",
    vibe_zh: "",
    highlights: [],
    photos: ["images/${slug}/thumb.jpg"],
    nearby: [],
    coordinates: [
${coords}
    ]
  },`;

console.log('\n✅  解析完成：');
console.log(`   原始坐标点：${points.length} 个  →  精简后：${indices.length} 个`);
console.log(`   距离估算：${distKm} km`);
console.log(`   速度数据：${hasTime ? '✓ 已提取相对速度' : '✗ 无时间戳，仅坐标'}`);
console.log(`   中心坐标：${centerLat.toFixed(5)}, ${centerLng.toFixed(5)}`);
console.log('\n── 复制以下内容，粘贴进 data.js 的 ROUTES 数组 ──────────────\n');
console.log(output);
console.log('\n────────────────────────────────────────────────────────────\n');
console.log('📁  图片放到 running-routes/images/' + slug + '/ 目录下');
console.log('    命名：thumb.jpg（封面）、01.jpg、02.jpg...（正文图）\n');
