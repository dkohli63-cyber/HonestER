let map;
let userLatLng = { lat: 49.2827, lng: -123.1207 }; // fallback: Vancouver, BC

document.addEventListener("DOMContentLoaded", async () => {
  showSkeletons();
  initMap();
  initStatCountUps();
  loadWeeklyCounter();

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

function showSkeletons() {
  const list = document.getElementById("facility-list");
  if (list) {
    list.innerHTML = Array(3).fill('<div class="skeleton skeleton-card"></div>').join("");
  }
}

function initMap() {
  map = L.map("map", { zoomControl: true }).setView([userLatLng.lat, userLatLng.lng], 11);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 18,
  }).addTo(map);
}

// Animates the homepage stat cards counting up when they scroll into view.
function initStatCountUps() {
  const targets = [
    { id: "stat-visits", value: 16.1, formatter: (n) => `${n.toFixed(1)}M` },
    { id: "stat-admitted", value: 12, formatter: (n) => `${Math.round(n)}%` },
  ];
  const els = targets.map((t) => document.getElementById(t.id)).filter(Boolean);
  if (!els.length) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const t = targets.find((t) => t.id === entry.target.id);
        if (t) countUpTo(entry.target, t.value, { formatter: t.formatter });
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.4 }
  );
  els.forEach((el) => observer.observe(el));
}

// Real count of reports submitted in the last 7 days — falls back to a
// clearly-labelled estimate when Supabase isn't connected (demo mode).
async function loadWeeklyCounter() {
  const el = document.getElementById("weekly-counter-number");
  if (!el) return;
  let count = null;
  if (supabaseClient) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: c, error } = await supabaseClient
      .from("visits")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since);
    if (!error) count = c;
  }
  if (count === null) {
    document.getElementById("weekly-counter-wrap").innerHTML =
      '<span style="color:var(--text-muted);">Report counter connects once your database is live.</span>';
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          countUpTo(el, count, { formatter: (n) => Math.round(n) });
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );
  observer.observe(el);
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
  renderNearbyChart(facilities);
}

let nearbyChartInstance;
function renderNearbyChart(facilities) {
  const canvas = document.getElementById("nearby-chart");
  if (!canvas) return;
  const top = facilities.filter((f) => f.avg_wait_minutes != null).slice(0, 6);
  if (nearbyChartInstance) nearbyChartInstance.destroy();
  if (!top.length) {
    canvas.parentElement.querySelector(".chart-panel-sub").textContent =
      "No reports yet for facilities near you — be the first.";
    return;
  }
  nearbyChartInstance = new Chart(canvas, {
    type: "bar",
    data: {
      labels: top.map((f) => f.name),
      datasets: [
        {
          data: top.map((f) => Math.round(f.avg_wait_minutes)),
          backgroundColor: "#6E8A5E",
          borderRadius: 6,
        },
      ],
    },
    options: {
      indexAxis: "y",
      plugins: { legend: { display: false } },
      scales: { x: { ticks: { callback: (v) => `${v}m` } } },
    },
  });
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
    const shareText = `ER/clinic wait at ${f.name}: ${formatMinutes(f.avg_wait_minutes)} (via HonestER)`;
    const card = document.createElement("div");
    card.className = "facility-card";
    card.innerHTML = `
      <a href="facility.html?id=${f.id}" style="text-decoration:none;color:inherit;flex:1;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <p class="facility-name">${escapeHtml(f.name)}</p>
          <p class="facility-meta">${f.type === "er" ? "Emergency room" : "Walk-in clinic"} &middot; ${f.distance.toFixed(1)} km &middot; ${escapeHtml(f.city)}, ${escapeHtml(f.province)}</p>
          ${freshnessBadge(f.recent_report_count)}
        </div>
        <div style="text-align:right;margin-right:10px;">
          <div class="wait-badge ${long ? "long" : ""}">${formatMinutes(f.avg_wait_minutes)}</div>
          <div class="wait-sub">avg wait</div>
        </div>
      </a>
      <button class="share-btn" data-share-text="${escapeHtml(shareText)}" data-share-url="${window.location.origin}${window.location.pathname.replace("index.html", "")}facility.html?id=${f.id}" aria-label="Share this wait time"><i class="ti ti-share-3"></i></button>
    `;
    list.appendChild(card);
  });

  if (facilities.length === 0) {
    list.innerHTML = `<p style="color:var(--text-muted);font-size:14px;">No facilities found yet. Be the first to <a href="report.html">report a visit</a>.</p>`;
  }
  wireShareButtons(list);
}

function freshnessBadge(count) {
  if (!count) return "";
  const label = count === 1 ? "1 report in the last 48h" : `${count} reports in the last 48h`;
  return `<span class="freshness-badge"><span class="live-dot"></span>${label}</span>`;
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
