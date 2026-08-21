const CACHE_NAME = "honester-v1";
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
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
});

// Network-first for live data (Supabase/Google/etc.), cache-first for our own static files.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isOwnOrigin = url.origin === self.location.origin;

  if (!isOwnOrigin) return; // let API calls go straight to the network, uncached

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
