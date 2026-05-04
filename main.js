document.addEventListener('DOMContentLoaded', () => {

  // ── Map init ──────────────────────────────────────────
  const map = L.map('map', {
    zoomControl: false,
    scrollWheelZoom: false,
    worldCopyJump: false,
    maxBounds: [[-85, -180], [85, 180]],
    maxBoundsViscosity: 1.0
  }).setView([20, 120], 3);

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20,
    noWrap: true
  }).addTo(map);

  // Auto-fit to all route locations
  if (ROUTES.length > 0) {
    const bounds = L.latLngBounds(ROUTES.map(r => [r.lat, r.lng]));
    map.fitBounds(bounds, { padding: [60, 100], maxZoom: 4 });
  }

  // ── Continent labels ──────────────────────────────────
  const continents = [
    { name: 'NORTH AMERICA', lat: 50,  lng: -100 },
    { name: 'SOUTH AMERICA', lat: -15, lng:  -58  },
    { name: 'EUROPE',        lat: 52,  lng:   18  },
    { name: 'AFRICA',        lat:  3,  lng:   22  },
    { name: 'ASIA',          lat: 44,  lng:   90  },
    { name: 'OCEANIA',       lat: -27, lng:  134  },
    { name: 'ANTARCTICA',    lat: -80, lng:    0  }
  ];
  continents.forEach(({ name, lat, lng }) => {
    L.marker([lat, lng], {
      icon: L.divIcon({
        className: '',
        html: `<span class="continent-label">${name}</span>`,
        iconSize: [0, 0], iconAnchor: [0, 0]
      }),
      interactive: false, zIndexOffset: -1000
    }).addTo(map);
  });

  // ── Country highlights (decorative only, no interaction) ─
  const routesByISO = {};
  ROUTES.forEach(r => {
    if (!r.country_iso) return;
    if (!routesByISO[r.country_iso]) routesByISO[r.country_iso] = [];
    routesByISO[r.country_iso].push(r);
  });
  const highlightISOs = new Set(Object.keys(routesByISO).map(Number));

  if (highlightISOs.size > 0) {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(r => r.json())
      .then(world => {
        const geojson = topojson.feature(world, world.objects.countries);
        L.geoJSON(geojson, {
          filter: feature => highlightISOs.has(parseInt(feature.id)),
          style: () => ({
            fillColor: '#3B70D6', fillOpacity: 0.14,
            color: '#3B70D6', weight: 1.2, opacity: 0.45,
            interactive: false
          })
        }).addTo(map);
      });
  }

  // ── Dot markers with hover card ───────────────────────
  const card  = document.getElementById('hover-card');
  const thumb = document.getElementById('card-thumb');
  const cname = document.getElementById('card-name');
  const loc   = document.getElementById('card-location');
  const dist  = document.getElementById('card-distance');
  const diff  = document.getElementById('card-difficulty');
  let hideTimer;

  function showCard(route) {
    clearTimeout(hideTimer);
    thumb.src        = route.thumbnail;
    thumb.style.objectPosition = route.thumbnail_position || 'center';
    cname.textContent = route.name;
    loc.textContent  = route.location;
    dist.textContent = route.distance;
    diff.textContent          = route.difficulty;
    diff.dataset.difficulty   = route.difficulty;
    card.dataset.id  = route.id;

    const pt = map.latLngToContainerPoint([route.lat, route.lng]);
    const W = 238, H = 192;
    const vw = window.innerWidth, vh = window.innerHeight;
    let x = pt.x + 18, y = pt.y - H / 2;
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

  ROUTES.forEach(route => {
    const marker = L.marker([route.lat, route.lng], {
      icon: L.divIcon({
        className: '',
        html: '<div class="dot"></div>',
        iconSize: [20, 20], iconAnchor: [10, 10]
      })
    }).addTo(map);
    marker.on('mouseover', () => showCard(route));
    marker.on('mouseout',  () => hideCard());
    marker.on('click',     () => { location.href = `route.html?id=${route.id}`; });
  });

  card.addEventListener('mouseenter', () => clearTimeout(hideTimer));
  card.addEventListener('mouseleave', () => hideCard());
  card.addEventListener('click', () => { location.href = `route.html?id=${card.dataset.id}`; });

  // ── Route count ───────────────────────────────────────
  document.getElementById('route-count').textContent = `${ROUTES.length} routes`;

  // ── Route card list ───────────────────────────────────
  const grid = document.getElementById('route-grid');
  ROUTES.forEach(route => {
    const a = document.createElement('a');
    a.href      = `route.html?id=${route.id}`;
    a.className = 'route-card';
    a.innerHTML = `
      <img class="route-card-img" src="${route.thumbnail}" alt="${route.name}" loading="lazy" style="object-position:${route.thumbnail_position || 'center'}">
      <div class="route-card-body">
        <div class="route-card-name">${route.name}</div>
        <div class="route-card-location">${route.location}</div>
        <div class="route-card-stats">
          <span class="route-card-distance">${route.distance}</span>
          <span class="badge" data-difficulty="${route.difficulty}">${route.difficulty}</span>
        </div>
      </div>`;
    grid.appendChild(a);
  });

});
