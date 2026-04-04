#!/usr/bin/env node
/**
 * GPX → data.js route entry converter
 * Usage: node tools/gpx-to-route.js your-run.gpx
 *
 * Outputs a route object you can copy-paste into data.js
 */

const fs   = require('fs');
const path = require('path');

const file = process.argv[2];
if (!file) {
  console.error('Usage: node tools/gpx-to-route.js <file.gpx>');
  process.exit(1);
}

const xml = fs.readFileSync(file, 'utf8');

// ── Extract track points ──────────────────────────────
const trkptRe = /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"/g;
const points = [];
let m;
while ((m = trkptRe.exec(xml)) !== null) {
  points.push([parseFloat(m[1]), parseFloat(m[2])]);
}

if (points.length === 0) {
  // Try alternate attribute order
  const altRe = /<trkpt\s+lon="([^"]+)"\s+lat="([^"]+)"/g;
  while ((m = altRe.exec(xml)) !== null) {
    points.push([parseFloat(m[2]), parseFloat(m[1])]);
  }
}

if (points.length === 0) {
  console.error('❌  No track points found. Is this a valid GPX file?');
  process.exit(1);
}

// ── Compute stats ─────────────────────────────────────
function haversine([lat1, lon1], [lat2, lon2]) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

let totalDist = 0;
for (let i = 1; i < points.length; i++) {
  totalDist += haversine(points[i-1], points[i]);
}

const distKm    = (totalDist / 1000).toFixed(1);
const centerLat = points.reduce((s, p) => s + p[0], 0) / points.length;
const centerLng = points.reduce((s, p) => s + p[1], 0) / points.length;

// ── Downsample coordinates (keep ≤ 120 points) ───────
function downsample(pts, target) {
  if (pts.length <= target) return pts;
  const step = (pts.length - 1) / (target - 1);
  const out = [];
  for (let i = 0; i < target; i++) {
    out.push(pts[Math.round(i * step)]);
  }
  return out;
}

const coords = downsample(points, 120)
  .map(([lat, lng]) => `      [${lat.toFixed(6)}, ${lng.toFixed(6)}]`)
  .join(',\n');

// ── Try to extract name/date from GPX metadata ────────
const nameMatch = xml.match(/<name>([^<]+)<\/name>/);
const timeMatch = xml.match(/<time>(\d{4}-\d{2})/);
const gpxName   = nameMatch ? nameMatch[1].trim() : 'My Run';
const gpxDate   = timeMatch ? timeMatch[1] : '2024-01';

// ── Generate slug ─────────────────────────────────────
const slug = path.basename(file, '.gpx')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ── Output ────────────────────────────────────────────
const output = `  {
    id: "${slug}",
    name: "${gpxName}",
    location: "City, Country",          // ← 填写城市和国家
    lat: ${centerLat.toFixed(6)},
    lng: ${centerLng.toFixed(6)},
    distance: "${distKm} km",
    duration: "约 XX 分钟",             // ← 填写时长
    difficulty: "轻松",                 // ← 轻松 / 适中 / 有挑战
    surface: "沥青路",                  // ← 路面类型
    elevation: "+XX m",                // ← 爬升高度
    date: "${gpxDate}",
    thumbnail: "images/${slug}/thumb.jpg",  // ← 封面图路径
    description: "在这里写线路描述...",
    vibe: "在这里写体感...",
    highlights: [
      { name: "地标名称", note: "一句话描述亮点" },
      { name: "地标名称", note: "一句话描述亮点" },
      { name: "地标名称", note: "一句话描述亮点" }
    ],
    photos: [
      "images/${slug}/01.jpg",
      "images/${slug}/02.jpg"
    ],
    coordinates: [
${coords}
    ]
  },`;

console.log('\n✅  解析完成：');
console.log(`   原始坐标点：${points.length} 个  →  精简后：${Math.min(points.length, 120)} 个`);
console.log(`   距离估算：${distKm} km`);
console.log(`   中心坐标：${centerLat.toFixed(5)}, ${centerLng.toFixed(5)}`);
console.log('\n── 复制以下内容，粘贴进 data.js 的 ROUTES 数组 ──────────────\n');
console.log(output);
console.log('\n────────────────────────────────────────────────────────────\n');
console.log('📁  图片放到 running-routes/images/' + slug + '/ 目录下');
console.log('    命名：thumb.jpg（封面）、01.jpg、02.jpg...（正文图）\n');
