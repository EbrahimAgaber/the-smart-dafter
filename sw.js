// Daftar Smart Service Worker v2.3
const CACHE_NAME = 'daftar-smart-v2.3';
const STATIC_ASSETS = [
  './',
  './index.html',
  './404.html',
  './manifest.json',
  './icon.svg',
  './favicon.png',
  './pwa-192x192.png',
  './pwa-512x512.png',
  './app-icon.jpg',
  './apple-touch-icon.png'
];

// Handle direct skip waiting message from app client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of STATIC_ASSETS) {
        try {
          await cache.add(asset);
        } catch (e) {
          // ignore optional missing assets
        }
      }
    })
  );
  // Activate immediately without waiting for old clients to close
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  // Claim all clients immediately so the new service worker controls open pages
  self.clients.claim();
});

// NETWORK-FIRST STRATEGY:
// Always fetch the freshest code when online so updates push seamlessly.
// Fallback to cache seamlessly when offline.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  // Network First, fallback to Cache
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Offline: serve from cache
        const cached = await caches.match(event.request);
        if (cached) {
          return cached;
        }
        // If navigating and offline, return cached index.html
        if (event.request.mode === 'navigate') {
          return (await caches.match('./index.html')) || (await caches.match('./'));
        }
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      })
  );
});
