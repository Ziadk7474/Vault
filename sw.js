const CACHE_VERSION = "companyvault-v1";
const SHELL = ["./index.html", "./manifest.json"];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_VERSION).then((c) => c.addAll(SHELL)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for everything (this app needs live Firebase data);
// falls back to the cached app shell only when fully offline.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return; // never intercept Firebase/CDN calls

  e.respondWith(
    fetch(e.request).catch(() =>
      caches.match(e.request).then((r) => r || caches.match("./index.html"))
    )
  );
});
