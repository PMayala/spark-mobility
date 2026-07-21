/* Spark Mobility — service worker: offline support + asset caching */
const V = "spark-v1";
const CORE = ["/", "/index.html", "/offline.html", "/assets/css/main.css", "/assets/js/main.js", "/assets/img/favicon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;              // never touch cross-origin (images/video CDNs)
  if (url.pathname.startsWith("/api/")) return;            // never cache the API

  if (req.mode === "navigate") {                           // pages: network-first → cache → offline
    e.respondWith(
      fetch(req).then((r) => { const cp = r.clone(); caches.open(V).then((c) => c.put(req, cp)); return r; })
        .catch(() => caches.match(req).then((m) => m || caches.match("/offline.html")))
    );
    return;
  }
  e.respondWith(                                           // assets: stale-while-revalidate
    caches.match(req).then((hit) => {
      const net = fetch(req).then((r) => { if (r.ok) { const cp = r.clone(); caches.open(V).then((c) => c.put(req, cp)); } return r; }).catch(() => hit);
      return hit || net;
    })
  );
});
