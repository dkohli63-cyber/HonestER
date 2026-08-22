document.addEventListener("DOMContentLoaded", async () => {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    document.getElementById("facility-name").textContent = "Facility not found";
    return;
  }

  let facility, staff, trend;

  if (supabaseClient) {
    const { data: f } = await supabaseClient.from("facility_wait_stats").select("*").eq("id", id).single();
    facility = f;
    // staff_ratings links to a visit, not directly to a facility — join through visits,
    // and only show ratings an admin has approved (see admin.html).
    const { data: s } = await supabaseClient
      .from("staff_ratings")
      .select("staff_name, rating, visits!inner(facility_id)")
      .eq("visits.facility_id", id)
      .eq("approved", true);
    staff = aggregateStaff(s || []);
    trend = await loadTrend(id);
  } else {
    facility = SAMPLE_FACILITIES.find((f) => f.id === id) || SAMPLE_FACILITIES[0];
    staff = [
      { name: "Dr. A. Chen", avg: 4.5, count: 12 },
      { name: "Nurse R. Patel", avg: 4.8, count: 9 },
    ];
    trend = [220, 260, 300, 280, 250, 240, 250]; // sample last 7 days, minutes
  }

  renderHeader(facility);
  renderStaff(staff);
  renderTrend(trend);
});

function aggregateStaff(rows) {
  const map = {};
  rows.forEach((r) => {
    if (!map[r.staff_name]) map[r.staff_name] = { total: 0, count: 0 };
    map[r.staff_name].total += r.rating;
    map[r.staff_name].count += 1;
  });
  return Object.entries(map)
    .map(([name, v]) => ({ name, avg: v.total / v.count, count: v.count }))
    .sort((a, b) => b.avg - a.avg);
}

async function loadTrend(facilityId) {
  // Expects an RPC `facility_daily_wait(facility_id)` returning last 7 days avg wait.
  const { data, error } = await supabaseClient.rpc("facility_daily_wait", { fid: facilityId });
  if (error || !data) return [];
  return data.map((d) => d.avg_minutes);
}

function renderHeader(f) {
  document.getElementById("facility-name").textContent = f.name;
  document.getElementById("facility-meta").textContent =
    `${f.type === "er" ? "Emergency room" : "Walk-in clinic"} · ${f.city}, ${f.province}`;
  document.getElementById("current-wait").textContent = formatMinutes(f.avg_wait_minutes);
  document.getElementById("current-rating").textContent = f.avg_rating ? f.avg_rating.toFixed(1) : "—";

  const freshEl = document.getElementById("freshness-note");
  if (freshEl) {
    freshEl.innerHTML = confidenceBadgeHtml(f.recent_report_count);
    freshEl.className = ""; // confidenceBadgeHtml already includes the freshness-badge class
  }

  const shareBtn = document.getElementById("facility-share-btn");
  if (shareBtn) {
    shareBtn.dataset.shareText = `ER/clinic wait at ${f.name}: ${formatMinutes(f.avg_wait_minutes)} (via HonestER)`;
    shareBtn.dataset.shareUrl = window.location.href;
    wireShareButtons(document);
  }
}

function renderStaff(staff) {
  const el = document.getElementById("staff-list");
  if (!staff.length) {
    el.innerHTML = `<p style="color:var(--text-muted);font-size:13px;">No staff ratings yet.</p>`;
    return;
  }
  el.innerHTML = staff
    .map(
      (s) => `<div class="staff-list-item">
        <span>${s.name}</span>
        <span>${s.avg.toFixed(1)} ★ <span style="color:var(--text-muted);">(${s.count})</span></span>
      </div>`
    )
    .join("");
}

function renderTrend(values) {
  const ctx = document.getElementById("trend-chart");
  if (!ctx || !values.length) return;
  new Chart(ctx, {
    type: "line",
    data: {
      labels: values.map((_, i) => `Day ${i + 1}`),
      datasets: [
        {
          data: values,
          borderColor: "#7C9070",
          backgroundColor: "rgba(124,144,112,0.12)",
          fill: true,
          tension: 0.3,
          pointRadius: 3,
        },
      ],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { ticks: { callback: (v) => `${v}m` } } },
    },
  });
}
