// This version marker will be updated on each deployment
const DEPLOY_VERSION = '__DEPLOY_VERSION__';
const CACHE_NAME = 'brain-battle-hub-' + DEPLOY_VERSION;

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
];

// Install event
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // ✅ 1. NEVER cache API calls (fixes leaderboard issues)
  if (req.url.includes('/api/')) {
    event.respondWith(fetch(req));
    return;
  }

  // ✅ 2. Skip version.json cache
  if (req.url.includes('/version.json')) {
    event.respondWith(fetch(req));
    return;
  }

  // ✅ 3. HTML requests (network first)
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req, { cache: 'no-cache' })
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;

          // ✅ Always return valid Response
          return new Response(
            "<h1>Offline</h1><p>Page not available</p>",
            {
              status: 503,
              headers: { "Content-Type": "text/html" }
            }
          );
        })
    );
    return;
  }

  // ✅ 4. Other assets (network first)
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && req.method === "GET") {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(req);
        if (cached) return cached;

        // ✅ Always return valid Response
        return new Response(
          JSON.stringify({ error: "Offline or not cached" }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" }
          }
        );
      })
  );
});

// Message listener (for updates)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

