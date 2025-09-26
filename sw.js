// Offline cache for Rex Math
const CACHE = 'rexmath-v1';
const ASSETS = [
  '/Rex/',
  '/Rex/index.html',
  '/Rex/placevalue.html',
  '/Rex/factor_multiple.html',
  '/Rex/prime_composite.html',
  '/Rex/Bomdas.html',
  '/Rex/manifest.webmanifest',
  '/Rex/icons/icon-192.png',
  '/Rex/icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached ||
      fetch(e.request).then(res => {
        try {
          const url = new URL(e.request.url);
          if (url.origin === location.origin) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
        } catch {}
        return res;
      }).catch(() => caches.match('/Rex/index.html'))
    )
  );
});
