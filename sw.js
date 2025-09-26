self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("rexmath-cache").then((cache) => {
      return cache.addAll([
        "index.html",
        "placevalue.html",
        "factor_multiple.html",
        "prime_composite.html",
        "Bomdas.html",
        "manifest.webmanifest",
        "icons/icon-192.png",
        "icons/icon-512.png"
      ]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
