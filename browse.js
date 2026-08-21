const PROVINCES = [
  { code: "BC", name: "British Columbia" },
  { code: "AB", name: "Alberta" },
  { code: "SK", name: "Saskatchewan" },
  { code: "MB", name: "Manitoba" },
  { code: "ON", name: "Ontario" },
  { code: "QC", name: "Quebec" },
  { code: "NB", name: "New Brunswick" },
  { code: "NS", name: "Nova Scotia" },
  { code: "PE", name: "Prince Edward Island" },
  { code: "NL", name: "Newfoundland and Labrador" },
  { code: "YT", name: "Yukon" },
  { code: "NT", name: "Northwest Territories" },
  { code: "NU", name: "Nunavut" },
];

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const province = params.get("province");

  let facilities;
  if (supabaseClient) {
    const { data } = await supabaseClient.from("facility_wait_stats").select("*");
    facilities = data || [];
  } else {
    facilities = SAMPLE_FACILITIES;
  }

  if (province) {
    showProvinceDetail(province, facilities.filter((f) => f.province === province));
  } else {
    showProvinceGrid(facilities);
  }
});

function showProvinceGrid(facilities) {
  const grid = document.getElementById("province-grid");
  grid.innerHTML = PROVINCES.map((p) => {
    const count = facilities.filter((f) => f.province === p.code).length;
    return `<a class="province-card" href="browse.html?province=${p.code}">${p.name}<span class="count">${count} listed</span></a>`;
  }).join("");
}

function showProvinceDetail(code, facilities) {
  document.getElementById("province-grid").style.display = "none";
  const detail = document.getElementById("province-detail");
  detail.style.display = "block";
  const provinceName = PROVINCES.find((p) => p.code === code)?.name || code;
  document.getElementById("province-detail-title").textContent = `${provinceName} facilities`;

  const list = document.getElementById("province-facility-list");
  if (!facilities.length) {
    list.innerHTML = `<p style="color:var(--text-muted);font-size:14px;">No facilities reported yet in ${provinceName}. <a href="report.html">Be the first.</a></p>`;
    return;
  }
  list.innerHTML = facilities
    .map((f) => {
      const long = f.avg_wait_minutes && f.avg_wait_minutes > 180;
      const count = f.recent_report_count || 0;
      return `<a href="facility.html?id=${f.id}" class="facility-card" style="text-decoration:none;color:inherit;">
        <div>
          <p class="facility-name">${escapeHtml(f.name)}</p>
          <p class="facility-meta">${f.type === "er" ? "Emergency room" : "Walk-in clinic"} &middot; ${escapeHtml(f.city || "")}</p>
          ${count ? `<span class="freshness-badge"><span class="live-dot"></span>${count} report${count === 1 ? "" : "s"} in the last 48h</span>` : ""}
        </div>
        <div style="text-align:right;">
          <div class="wait-badge ${long ? "long" : ""}">${formatMinutes(f.avg_wait_minutes)}</div>
          <div class="wait-sub">avg wait</div>
        </div>
      </a>`;
    })
    .join("");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
