const CACHE_NAME = 'brain-battle-v1';
const urlsToCache = [
  '/',
  '/favicon.svg',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // ❌ Skip API requests
  if (url.hostname.includes("workers.dev")) {
    return;
  }

  event.respondWith(fetch(event.request));
});