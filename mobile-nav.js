// Adds a hamburger menu on small screens so nav links (About, ER guide,
// Browse by province) are actually reachable on mobile instead of just
// disappearing. Works generically across every page — no per-page markup
// needed, it finds the existing nav and wraps it.

document.addEventListener("DOMContentLoaded", () => {
  const nav = document.querySelector("header.site-header nav.main-nav");
  if (!nav || !nav.querySelector("a.nav-link")) return;

  const btn = document.createElement("button");
  btn.className = "mobile-menu-btn";
  btn.setAttribute("aria-label", "Menu");
  btn.innerHTML = '<i class="ti ti-menu-2"></i>';
  nav.insertBefore(btn, nav.firstChild);

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = nav.classList.toggle("mobile-open");
    btn.innerHTML = open ? '<i class="ti ti-x"></i>' : '<i class="ti ti-menu-2"></i>';
  });

  document.addEventListener("click", (e) => {
    if (!nav.contains(e.target)) {
      nav.classList.remove("mobile-open");
      btn.innerHTML = '<i class="ti ti-menu-2"></i>';
    }
  });
});
