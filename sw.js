// Bumping this version string invalidates every visitor's old cache the
// next time they load the site — do this any time you deploy real changes,
// otherwise browsers that already installed this service worker will keep
// serving stale pages indefinitely.
const CACHE_NAME = "honester-v3";
const CORE_ASSETS = [
  "index.html",
  "report.html",
  "facility.html",
  "about.html",
  "browse.html",
  "style.css",
  "config.js",
  "manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-first for everything on our own site: always try to get the latest
// version first, and only fall back to the cached copy if the network fails
// (e.g. offline). This is the opposite of the old cache-first behavior, which
// could silently keep serving outdated pages after a real deployment.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isOwnOrigin = url.origin === self.location.origin;

  if (!isOwnOrigin) return; // let API calls (Supabase/Google/etc.) go straight to the network

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
