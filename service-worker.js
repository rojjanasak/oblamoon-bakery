/* ============================================================
   Ob-la-moon — Service Worker
   v2: fixes a matching bug where every request was treated as a
   "shell asset" (a stray './' entry made url.endsWith('') always
   true), which could serve the offline fallback unpredictably
   even while online. Now uses exact pathname matching and a
   proper network-first strategy for page navigations.
   ============================================================ */

const CACHE_NAME = 'oblamoon-shell-v3';

const SHELL_ASSETS = [
  'index.html',
  'customer.html',
  'offline.html',
  'manifest.json',
  'css/style.css',
  'js/data.js',
  'js/i18n.js',
  'js/app.js',
  'js/customer.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // Cache each file individually so one missing/renamed file
      // can't make the whole install silently cache nothing.
      Promise.all(
        SHELL_ASSETS.map((path) =>
          fetch(path, { cache: 'no-cache' })
            .then((res) => (res.ok ? cache.put(path, res) : null))
            .catch(() => null)
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Page loads: try the network first (so you always get the latest
  // version while online), fall back to the cached page, then the
  // offline page, only when the network truly fails.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, clone)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches.match(req)
            .then((cached) => cached || caches.match('index.html'))
            .then((cached) => cached || caches.match('offline.html'))
        )
    );
    return;
  }

  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    // Same-origin static files: cache-first for speed, refresh cache in background.
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req)
          .then((res) => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(CACHE_NAME).then((c) => c.put(req, clone)).catch(() => {});
            }
            return res;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Cross-origin (CDN libraries, fonts): network-first, cached copy as offline fallback.
  event.respondWith(
    fetch(req)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(req, clone)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req))
  );
});
