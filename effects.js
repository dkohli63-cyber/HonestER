// Shared "alive" effects: scroll-reveal, count-up numbers, and share.
// Include this on any page that uses .reveal, data-countup, or .share-btn.

// Confidence tiers based on how many reports a facility has had in the last
// 48 hours — this is what makes the "reported" data feel honestly labelled
// rather than implying a single stale report is as solid as a busy facility's
// live average.
function confidenceTier(count) {
  count = count || 0;
  if (count >= 10) return { label: "High confidence", sub: `${count} reports in the last 48h`, dotClass: "dot-high" };
  if (count >= 3) return { label: "Moderate confidence", sub: `${count} reports in the last 48h`, dotClass: "dot-moderate" };
  if (count >= 1) return { label: "Limited data", sub: `Only ${count} report${count === 1 ? "" : "s"} in the last 48h`, dotClass: "dot-limited" };
  return { label: "No recent data", sub: "This estimate may be outdated", dotClass: "dot-none" };
}

function confidenceBadgeHtml(count) {
  const t = confidenceTier(count);
  return `<span class="freshness-badge"><span class="conf-dot ${t.dotClass}"></span>${t.label} &middot; ${t.sub}</span>`;
}

function officialSourceHtml(f, { compact = false } = {}) {
  if (!f.official_source_url) return "";
  if (compact) {
    return `<a href="${f.official_source_url}" target="_blank" rel="noopener" class="official-link-compact" onclick="event.stopPropagation()">
      <i class="ti ti-external-link"></i> Official wait time
    </a>`;
  }
  return `<a href="${f.official_source_url}" target="_blank" rel="noopener" class="official-link">
    <i class="ti ti-building-hospital"></i>
    <span>Check official wait time — ${escapeHtmlShared(f.official_source_name)} <i class="ti ti-external-link" style="font-size:12px;"></i></span>
  </a>`;
}

function escapeHtmlShared(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

// On-device favorites — no login, no account, no data sent anywhere.
// Stored in this browser only, same privacy model as the rest of the site.
const FAVORITES_KEY = "honester_favorites";

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
  } catch {
    return [];
  }
}

function isFavorite(id) {
  return getFavorites().includes(id);
}

function toggleFavorite(id) {
  let favs = getFavorites();
  if (favs.includes(id)) {
    favs = favs.filter((f) => f !== id);
  } else {
    favs.push(id);
  }
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  return favs.includes(id);
}

function favoriteButtonHtml(id) {
  const active = isFavorite(id);
  return `<button class="fav-btn ${active ? "active" : ""}" data-fav-id="${id}" onclick="event.preventDefault();event.stopPropagation();window.__handleFavClick(this)" aria-label="Save this facility">
    <i class="ti ${active ? "ti-heart-filled" : "ti-heart"}"></i>
  </button>`;
}

window.__handleFavClick = function (btn) {
  const id = btn.dataset.favId;
  const nowActive = toggleFavorite(id);
  btn.classList.toggle("active", nowActive);
  btn.querySelector("i").className = `ti ${nowActive ? "ti-heart-filled" : "ti-heart"}`;
};

document.addEventListener("DOMContentLoaded", () => {
  initScrollReveal();
});

function initScrollReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!els.length) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  els.forEach((el) => observer.observe(el));
}

// Animates a number from 0 (or its current text) up to `target` over `duration` ms.
// `formatter` lets callers render "16.1M" / "4h 10m" / "92%" etc from the raw number.
function countUpTo(el, target, { duration = 1200, formatter = (n) => Math.round(n) } = {}) {
  if (!el) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.textContent = formatter(target);
    return;
  }
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = formatter(target * eased);
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// Wires up any button with class "share-btn" and a data-share-text attribute.
// Uses the native share sheet where available (mobile), falls back to
// copying the text to the clipboard (desktop) with a brief "Copied!" confirmation.
function wireShareButtons(root = document) {
  root.querySelectorAll(".share-btn").forEach((btn) => {
    if (btn.dataset.wired) return;
    btn.dataset.wired = "1";
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const text = btn.dataset.shareText || "";
      const url = btn.dataset.shareUrl || window.location.href;
      if (navigator.share) {
        try {
          await navigator.share({ text, url });
        } catch (err) {
          // user cancelled the share sheet — no action needed
        }
      } else {
        try {
          await navigator.clipboard.writeText(`${text} ${url}`);
          const original = btn.innerHTML;
          btn.innerHTML = '<i class="ti ti-check"></i>';
          setTimeout(() => (btn.innerHTML = original), 1500);
        } catch (err) {
          console.error("Clipboard write failed:", err);
        }
      }
    });
  });
}
