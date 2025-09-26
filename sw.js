// sw.js — Auto-updating PWA service worker for Rex-Math

const APP_PREFIX   = 'rexmath';
const STATIC_CACHE = `${APP_PREFIX}-static-v1`;   // rarely changes
const RUNTIME_CACHE = `${APP_PREFIX}-runtime`;    // updated at runtime

// Files to pre-cache for offline (must be GET-able at these paths)
const PRECACHE_FILES = [
  'index.html',
  'placevalue.html',
  'factor_multiple.html',
  'prime_composite.html',
  'Bodmas.html',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

// Take over immediately after install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(PRECACHE_FILES))
  );
  self.skipWaiting();
});

// Clean out old caches and start controlling pages
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => ![STATIC_CACHE, RUNTIME_CACHE].includes(k))
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Strategy:
// - HTML (pages): network-first -> fall back to cache when offline
// - Everything else (icons/manifest/images): cache-first
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isHTML =
    req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html') ||
    url.pathname.endsWith('.html');

  if (isHTML) {
    // Network-first for pages so edits go live without bumping versions
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(RUNTIME_CACHE).then(cache => cache.put(req, resClone));
          return res;
        })
        .catch(() =>
          caches.match(req).then(cached => cached || caches.match('index.html'))
        )
    );
  } else {
    // Cache-first for static assets
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          // Only cache valid responses
          if (!res || res.status !== 200 || res.type === 'opaque') return res;
          const resClone = res.clone();
          caches.open(RUNTIME_CACHE).then(cache => cache.put(req, resClone));
          return res;
        }).catch(() => cached);
      })
    );
  }
});
