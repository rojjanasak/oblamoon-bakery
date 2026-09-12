const CACHE_NAME = 'oblamoon-shell-v1';
const ASSETS = [
  './',
  './index.html',
  './customer.html',
  './offline.html',
  './manifest.json',
  './css/style.css',
  './js/data.js',
  './js/app.js',
  './js/customer.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
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

  // App shell files: cache-first
  const isShellAsset = ASSETS.some((a) => req.url.endsWith(a.replace('./', '')));
  if (isShellAsset) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req))
    );
    return;
  }

  // Everything else (CDN libs, navigation): network-first, fallback to cache/offline page
  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) => cached || (req.mode === 'navigate' ? caches.match('./offline.html') : undefined))
      )
  );
});
