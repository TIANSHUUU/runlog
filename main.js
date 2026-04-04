document.addEventListener('DOMContentLoaded', () => {

  // ── Map init ──────────────────────────────────────────
  const map = L.map('map', { zoomControl: false })
    .setView([28, 15], 2);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  // ── Country highlights ────────────────────────────────
  const highlightISOs = new Set(ROUTES.map(r => r.country_iso).filter(Boolean));
  if (highlightISOs.size > 0) {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(r => r.json())
      .then(world => {
        const geojson = topojson.feature(world, world.objects.countries);
        L.geoJSON(geojson, {
          interactive: false,
          style: feature => {
            if (highlightISOs.has(parseInt(feature.id))) {
              return { fillColor: '#3B70D6', fillOpacity: 0.14, color: '#3B70D6', weight: 1.2, opacity: 0.45 };
            }
            return { fill: false, stroke: false };
          }
        }).addTo(map);
      });
  }

  // ── Route count ───────────────────────────────────────
  document.getElementById('route-count').textContent = `${ROUTES.length} 条线路`;

  // ── Hover card logic ──────────────────────────────────
  const card  = document.getElementById('hover-card');
  const thumb = document.getElementById('card-thumb');
  const name  = document.getElementById('card-name');
  const loc   = document.getElementById('card-location');
  const dist  = document.getElementById('card-distance');
  const diff  = document.getElementById('card-difficulty');
  let hideTimer;

  function showCard(route) {
    clearTimeout(hideTimer);

    // Populate
    thumb.src          = route.thumbnail;
    name.textContent   = route.name;
    loc.textContent    = route.location;
    dist.textContent   = route.distance;
    diff.textContent   = route.difficulty;
    card.dataset.id    = route.id;

    // Position (viewport-relative)
    const pt = map.latLngToContainerPoint([route.lat, route.lng]);
    const W = 238, H = 192;
    const vw = window.innerWidth, vh = window.innerHeight;

    let x = pt.x + 18;
    let y = pt.y - H / 2;
    if (x + W > vw - 16) x = pt.x - W - 18;
    if (y < 66)          y = 66;
    if (y + H > vh - 16) y = vh - H - 16;

    card.style.left = x + 'px';
    card.style.top  = y + 'px';
    card.classList.remove('hidden');
  }

  function hideCard(delay = 160) {
    hideTimer = setTimeout(() => card.classList.add('hidden'), delay);
  }

  // ── Markers ───────────────────────────────────────────
  ROUTES.forEach(route => {
    const icon = L.divIcon({
      className: '',
      html: '<div class="dot"></div>',
      iconSize:   [20, 20],
      iconAnchor: [10, 10]
    });

    const marker = L.marker([route.lat, route.lng], { icon }).addTo(map);
    marker.on('mouseover', () => showCard(route));
    marker.on('mouseout',  () => hideCard());
    marker.on('click',     () => { location.href = `route.html?id=${route.id}`; });
  });

  // Keep card alive when hovering over it
  card.addEventListener('mouseenter', () => clearTimeout(hideTimer));
  card.addEventListener('mouseleave', () => hideCard());
  card.addEventListener('click',      () => { location.href = `route.html?id=${card.dataset.id}`; });

});
