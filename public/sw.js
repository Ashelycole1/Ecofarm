const CACHE_NAME = 'ecofarm-pwa-cache-v1';
const DYNAMIC_CACHE = 'ecofarm-dynamic-cache-v1';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/window.svg',
  '/globe.svg'
];

// Install event: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== DYNAMIC_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event: Stale-While-Revalidate strategy
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests unless they are specific APIs we want to cache
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.open(DYNAMIC_CACHE).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            // Update the cache with the new response
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          })
          .catch(() => {
            // If offline and not in cache, we could return an offline fallback page here
          });

        // Return the cached response immediately if there is one, otherwise wait for network
        return cachedResponse || fetchPromise;
      });
    })
  );
});
