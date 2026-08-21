// Shared "alive" effects: scroll-reveal, count-up numbers, and share.
// Include this on any page that uses .reveal, data-countup, or .share-btn.

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
