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
  let runX = rightBound, runDir = -1;

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
    el.style.transform = `scaleX(${-runDir})`;
  }

  // ── Animation sequence ────────────────────────────────────
  // Split into Unicode grapheme clusters so emoji don't break
  const CHARS = Array.from("Tianshu's Runlog 🏃‍♀️");
  let rotAngle = -40, phase = 'globe';
  let typeIndex = 0, lastType = 0, globeStart = null, animFrame;

  function animate(ts) {
    if (!globeStart) globeStart = ts;
    const elapsed = ts - globeStart;

    rotAngle += 0.15;
    drawGlobe(rotAngle);
    updateRunner();

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
      return;
    }

    animFrame = requestAnimationFrame(animate);
  }

  // ── Boot ──────────────────────────────────────────────────
  fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
    .then(r => r.json())
    .then(world => {
      buildLandMask(world);
      buildDots();
      animFrame = requestAnimationFrame(animate);
    });

})();
