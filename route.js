document.addEventListener('DOMContentLoaded', () => {

  // ── Load route data ───────────────────────────────────
  const id    = new URLSearchParams(location.search).get('id');
  const route = ROUTES.find(r => r.id === id);

  if (!route) {
    document.body.innerHTML = `
      <div style="padding:3rem;font-family:sans-serif;color:#666">
        <p>线路未找到。<a href="index.html" style="color:#E85D3F">返回地图</a></p>
      </div>`;
    return;
  }

  // ── Populate text ─────────────────────────────────────
  document.title = `${route.name} · runlog`;

  document.getElementById('header-route-name').textContent = route.name;
  document.getElementById('route-title').textContent       = route.name;
  document.getElementById('route-location').textContent    = route.location;
  document.getElementById('route-date').textContent        = route.date;
  document.getElementById('stat-distance').textContent     = route.distance;
  document.getElementById('stat-elevation').textContent    = route.elevation;
  document.getElementById('stat-surface').textContent      = route.surface;
  const diffEl = document.getElementById('stat-difficulty');
  diffEl.textContent        = route.difficulty;
  diffEl.dataset.difficulty = route.difficulty;
  // ── Start / Finish Google Maps links ─────────────────
  const pointsEl = document.getElementById('route-points');
  if (route.start || route.end) {
    const mapsLink = (latlng, label) => {
      const url = `https://www.google.com/maps?q=${latlng[0]},${latlng[1]}`;
      return `<a class="route-point-link" href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    };
    const parts = [];
    if (route.start) parts.push(mapsLink(route.start, 'Start point'));
    if (route.end)   parts.push(mapsLink(route.end,   'Finish point'));
    pointsEl.innerHTML = parts.join('<span class="route-point-sep">·</span>');
  }

  // Description: support legacy single-language or bilingual fields
  const descEn = route.description_en || route.description || '';
  const descZh = route.description_zh || '';
  const vibeEn = route.vibe_en || route.vibe || '';
  const vibeZh = route.vibe_zh || '';

  const descEl = document.getElementById('route-description');
  descEl.innerHTML = descEn
    + (descZh ? `<span class="desc-zh">${descZh}</span>` : '');

  document.getElementById('route-vibe').innerHTML =
    `<span class="vibe-label">Feel</span>${vibeEn}`
    + (vibeZh ? `<span class="vibe-zh">${vibeZh}</span>` : '');

  // ── Highlights ────────────────────────────────────────
  const hlEl = document.getElementById('route-highlights');
  if (route.highlights && route.highlights.length) {
    route.highlights.forEach((h, i) => {
      const noteEn = h.note_en || h.note || '';
      const noteZh = h.note_zh || '';
      const item = document.createElement('div');
      item.className = 'highlight-item';
      item.innerHTML = `
        <div class="highlight-num">${i + 1}</div>
        <div>
          <div class="highlight-name">${h.name}</div>
          <div class="highlight-note">${noteEn}${noteZh ? `<span class="note-zh">${noteZh}</span>` : ''}</div>
        </div>`;
      hlEl.appendChild(item);
    });
  } else {
    document.querySelector('.highlights-section').style.display = 'none';
  }

  // ── Photos ────────────────────────────────────────────
  const photosEl = document.getElementById('route-photos');
  if (route.photos && route.photos.length) {
    route.photos.forEach(url => {
      const img = document.createElement('img');
      img.src       = url;
      img.alt       = route.name;
      img.className = 'route-photo';
      img.loading   = 'lazy';
      photosEl.appendChild(img);
    });
  } else {
    document.getElementById('photos-section').style.display = 'none';
  }

  // ── Map ───────────────────────────────────────────────
  const map = L.map('route-map', { zoomControl: false, scrollWheelZoom: false })
    .setView([route.lat, route.lng], 14);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  const coords = route.coordinates;
  const hasSpeed = coords.length && coords[0].length === 3;
  let bounds;

  if (hasSpeed) {
    document.getElementById('speed-legend').classList.remove('hidden');
    // Draw speed-colored segments: red (slow) → yellow → green (fast)
    const renderer = L.canvas();
    for (let i = 0; i < coords.length - 1; i++) {
      const spd = (coords[i][2] + coords[i+1][2]) / 2;
      const hue = Math.round(spd * 120); // 0=red, 60=yellow, 120=green
      L.polyline(
        [[coords[i][0], coords[i][1]], [coords[i+1][0], coords[i+1][1]]],
        { color: `hsl(${hue},88%,42%)`, weight: 4, opacity: 0.92,
          smoothFactor: 0, renderer }
      ).addTo(map);
    }
    bounds = L.latLngBounds(coords.map(c => [c[0], c[1]]));
  } else {
    const polyline = L.polyline(coords, {
      color: '#E85D3F', weight: 4.5, opacity: 0.88,
      lineJoin: 'round', lineCap: 'round'
    }).addTo(map);
    bounds = polyline.getBounds();
  }

  map.fitBounds(bounds, { padding: [48, 48] });

  // ── Start / Finish markers ─────────────────────────────
  function makeMarker(latlng, type, label) {
    const icon = L.divIcon({
      className: '',
      html: `<div class="map-pin map-pin--${type}">${type === 'start' ? 'S' : 'F'}</div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });
    L.marker(latlng, { icon, interactive: false }).addTo(map);
  }
  if (route.start) makeMarker(route.start, 'start');
  if (route.end)   makeMarker(route.end,   'finish');

  // ── Lightbox ──────────────────────────────────────────
  const lightbox    = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');

  function openLightbox(src, alt) {
    lightboxImg.src = src;
    lightboxImg.alt = alt;
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

  // Attach to photos after they're appended (delegated on container)
  document.getElementById('route-photos').addEventListener('click', e => {
    if (e.target.classList.contains('route-photo')) {
      openLightbox(e.target.src, e.target.alt);
    }
  });

  // Tap to enable scroll zoom (prevents accidental zoom while reading)
  document.getElementById('route-map').addEventListener('click', () => {
    map.scrollWheelZoom.enable();
  });

  // ── Nearby places ─────────────────────────────────────
  const nearbyEl = document.getElementById('route-nearby');
  if (route.nearby && route.nearby.length) {
    route.nearby.forEach(place => {
      const a = document.createElement('a');
      a.className  = 'nearby-item';
      a.href       = place.maps_url;
      a.target     = '_blank';
      a.rel        = 'noopener noreferrer';
      a.innerHTML  = `
        <div class="nearby-info">
          <div class="nearby-name">${place.name}</div>
          <div class="nearby-note">${place.note_en}</div>
          ${place.note_zh ? `<div class="nearby-note-zh">${place.note_zh}</div>` : ''}
        </div>
        <svg class="nearby-arrow" width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M4 9h10M9 4l5 5-5 5" stroke="currentColor" stroke-width="1.6"
                stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
      nearbyEl.appendChild(a);
    });
  } else {
    document.getElementById('nearby-section').style.display = 'none';
  }

});
