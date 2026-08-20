let map;
let userLatLng = { lat: 49.2827, lng: -123.1207 }; // fallback: Vancouver, BC

document.addEventListener("DOMContentLoaded", async () => {
  initMap();

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        map.setView([userLatLng.lat, userLatLng.lng], 12);
        L.marker([userLatLng.lat, userLatLng.lng], { icon: youIcon() })
          .addTo(map)
          .bindPopup("You are here");
        loadFacilities();
      },
      () => loadFacilities(), // permission denied — use fallback + still load
      { timeout: 5000 }
    );
  } else {
    loadFacilities();
  }

  const searchInput = document.getElementById("facility-search");
  if (searchInput) {
    searchInput.addEventListener("input", debounce(handleSearchInput, 300));
  }
});

function initMap() {
  map = L.map("map", { zoomControl: true }).setView([userLatLng.lat, userLatLng.lng], 11);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 18,
  }).addTo(map);
}

function youIcon() {
  return L.divIcon({
    className: "",
    html: '<div style="width:16px;height:16px;border-radius:50%;background:#7C9070;border:3px solid #fff;box-shadow:0 0 0 1px #C7D1B9;"></div>',
    iconSize: [16, 16],
  });
}

function facilityIcon() {
  return L.divIcon({
    className: "",
    html: '<div style="width:14px;height:14px;border-radius:50%;background:#5F7350;border:2px solid #fff;"></div>',
    iconSize: [14, 14],
  });
}

async function loadFacilities() {
  let facilities;

  if (supabaseClient) {
    // Expects a Postgres view `facility_wait_stats` — see supabase/schema.sql
    const { data, error } = await supabaseClient
      .from("facility_wait_stats")
      .select("*");
    if (error) {
      console.error("Failed to load facilities:", error);
      facilities = SAMPLE_FACILITIES;
    } else {
      facilities = data;
    }
  } else {
    facilities = SAMPLE_FACILITIES;
  }

  facilities = facilities
    .map((f) => ({ ...f, distance: distanceKm(userLatLng.lat, userLatLng.lng, f.lat, f.lng) }))
    .sort((a, b) => a.distance - b.distance);

  renderMarkers(facilities);
  renderList(facilities);
}

function renderMarkers(facilities) {
  facilities.forEach((f) => {
    L.marker([f.lat, f.lng], { icon: facilityIcon() })
      .addTo(map)
      .bindPopup(`<strong>${escapeHtml(f.name)}</strong><br>${formatMinutes(f.avg_wait_minutes)} avg wait`)
      .on("click", () => (window.location.href = `facility.html?id=${f.id}`));
  });
}

function renderList(facilities) {
  const list = document.getElementById("facility-list");
  list.innerHTML = "";
  facilities.forEach((f) => {
    const long = f.avg_wait_minutes && f.avg_wait_minutes > 180;
    const card = document.createElement("a");
    card.href = `facility.html?id=${f.id}`;
    card.className = "facility-card";
    card.style.textDecoration = "none";
    card.style.color = "inherit";
    card.innerHTML = `
      <div>
        <p class="facility-name">${escapeHtml(f.name)}</p>
        <p class="facility-meta">${f.type === "er" ? "Emergency room" : "Walk-in clinic"} &middot; ${f.distance.toFixed(1)} km &middot; ${escapeHtml(f.city)}, ${escapeHtml(f.province)}</p>
      </div>
      <div style="text-align:right;">
        <div class="wait-badge ${long ? "long" : ""}">${formatMinutes(f.avg_wait_minutes)}</div>
        <div class="wait-sub">avg wait</div>
      </div>
    `;
    list.appendChild(card);
  });

  if (facilities.length === 0) {
    list.innerHTML = `<p style="color:var(--text-muted);font-size:14px;">No facilities found yet. Be the first to <a href="report.html">report a visit</a>.</p>`;
  }
}

async function handleSearchInput(e) {
  const q = e.target.value.trim().toLowerCase();
  if (!q) return loadFacilities();

  let facilities;
  if (supabaseClient) {
    const { data } = await supabaseClient
      .from("facility_wait_stats")
      .select("*")
      .ilike("name", `%${q}%`);
    facilities = data || [];
  } else {
    facilities = SAMPLE_FACILITIES.filter((f) => f.name.toLowerCase().includes(q));
  }
  facilities = facilities.map((f) => ({ ...f, distance: distanceKm(userLatLng.lat, userLatLng.lng, f.lat, f.lng) }));
  renderList(facilities);
}

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
