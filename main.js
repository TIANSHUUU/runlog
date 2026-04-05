document.addEventListener('DOMContentLoaded', () => {

  // ── Map init ──────────────────────────────────────────
  const map = L.map('map', {
    zoomControl: false,
    worldCopyJump: false,
    maxBounds: [[-85, -180], [85, 180]],
    maxBoundsViscosity: 1.0
  }).setView([28, 15], 2);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20,
    noWrap: true
  }).addTo(map);

  // ── Continent labels (English, custom) ────────────────
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
        iconSize:   [0, 0],
        iconAnchor: [0, 0]
      }),
      interactive:    false,
      zIndexOffset: -1000
    }).addTo(map);
  });

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  // ── Group routes by country ISO ───────────────────────
  const routesByISO = {};
  ROUTES.forEach(r => {
    if (!r.country_iso) return;
    if (!routesByISO[r.country_iso]) routesByISO[r.country_iso] = [];
    routesByISO[r.country_iso].push(r);
  });
  const highlightISOs = new Set(Object.keys(routesByISO).map(Number));

  // ── Country card (multi-route hover list) ─────────────
  const countryCard     = document.getElementById('country-card');
  const countryCardList = document.getElementById('country-card-list');
  let countryHideTimer;

  function positionCountryCard(pt) {
    const W  = countryCard.offsetWidth  || 220;
    const H  = countryCard.offsetHeight || 120;
    const vw = window.innerWidth, vh = window.innerHeight;
    let x = pt.x + 18;
    let y = pt.y - H / 2;
    if (x + W > vw - 16) x = pt.x - W - 18;
    if (y < 66)          y = 66;
    if (y + H > vh - 16) y = vh - H - 16;
    countryCard.style.left = x + 'px';
    countryCard.style.top  = y + 'px';
  }

  // Track which layer is currently highlighted so card mouseleave can reference it
  let activeCountryLayer = null;

  function showCountryCard(routes, pt, layer) {
    clearTimeout(countryHideTimer);
    activeCountryLayer = layer;
    countryCardList.innerHTML = '';
    routes.forEach(route => {
      const item = document.createElement('div');
      item.className = 'country-route-item';
      item.innerHTML = `
        <img class="country-route-thumb" src="${route.thumbnail}" alt="">
        <span class="country-route-name">${route.name}</span>
      `;
      item.addEventListener('click', () => { location.href = `route.html?id=${route.id}`; });
      countryCardList.appendChild(item);
    });
    positionCountryCard(pt);
    countryCard.classList.remove('hidden');
  }

  function hideCountryCard(delay = 160) {
    countryHideTimer = setTimeout(() => {
      countryCard.classList.add('hidden');
      activeCountryLayer = null;
    }, delay);
  }

  // Card itself: keep alive when mouse enters, hide when mouse leaves
  countryCard.addEventListener('mouseenter', () => clearTimeout(countryHideTimer));
  countryCard.addEventListener('mouseleave', e => {
    // Don't hide if mouse moved back onto the polygon
    const rel = e.relatedTarget;
    if (rel && rel.closest && rel.closest('.leaflet-interactive')) {
      clearTimeout(countryHideTimer);
      return;
    }
    hideCountryCard();
  });

  // ── Country highlights + hover ────────────────────────
  if (highlightISOs.size > 0) {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(r => r.json())
      .then(world => {
        const geojson = topojson.feature(world, world.objects.countries);
        L.geoJSON(geojson, {
          style: feature => {
            if (highlightISOs.has(parseInt(feature.id))) {
              return { fillColor: '#3B70D6', fillOpacity: 0.14, color: '#3B70D6', weight: 1.2, opacity: 0.45 };
            }
            return { fill: false, stroke: false };
          },
          onEachFeature: (feature, layer) => {
            const iso    = parseInt(feature.id);
            const routes = routesByISO[iso];
            if (!routes || routes.length < 2) {
              layer.options.interactive = false;
              return;
            }
            layer.on('mouseover', e => {
              if (markerHovered) return;
              // Don't re-show if mouse came from the card itself
              const rel = e.originalEvent.relatedTarget;
              if (rel && countryCard.contains(rel)) return;
              layer.setStyle({ fillOpacity: 0.22 });
              showCountryCard(routes, e.containerPoint, layer);
            });
            layer.on('mouseout', e => {
              layer.setStyle({ fillOpacity: 0.14 });
              // Don't hide if mouse moved onto the card
              const rel = e.originalEvent.relatedTarget;
              if (rel && countryCard.contains(rel)) return;
              hideCountryCard();
            });
          }
        }).addTo(map);
      });
  }

  // ── Route count ───────────────────────────────────────
  document.getElementById('route-count').textContent = `${ROUTES.length} 条线路`;

  // ── Single-route hover card ───────────────────────────
  const card  = document.getElementById('hover-card');
  const thumb = document.getElementById('card-thumb');
  const name  = document.getElementById('card-name');
  const loc   = document.getElementById('card-location');
  const dist  = document.getElementById('card-distance');
  const diff  = document.getElementById('card-difficulty');
  let hideTimer;

  function showCard(route) {
    clearTimeout(hideTimer);
    thumb.src        = route.thumbnail;
    name.textContent = route.name;
    loc.textContent  = route.location;
    dist.textContent = route.distance;
    diff.textContent = route.difficulty;
    card.dataset.id  = route.id;

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
  let markerHovered = false;

  ROUTES.forEach(route => {
    const icon = L.divIcon({
      className: '',
      html: '<div class="dot"></div>',
      iconSize:   [20, 20],
      iconAnchor: [10, 10]
    });

    const marker = L.marker([route.lat, route.lng], { icon }).addTo(map);
    marker.on('mouseover', () => { markerHovered = true;  showCard(route); });
    marker.on('mouseout',  () => { markerHovered = false; hideCard(); });
    marker.on('click',     () => { location.href = `route.html?id=${route.id}`; });
  });

  card.addEventListener('mouseenter', () => clearTimeout(hideTimer));
  card.addEventListener('mouseleave', () => hideCard());
  card.addEventListener('click',      () => { location.href = `route.html?id=${card.dataset.id}`; });

});
