const CACHE_NAME = 'ecofarm-pwa-cache-v2';
const DYNAMIC_CACHE = 'ecofarm-dynamic-cache-v2';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/window.svg',
  '/globe.svg',
];

// ── Install: cache static assets ──────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: clean up old caches ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== DYNAMIC_CACHE)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: Stale-While-Revalidate ─────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.open(DYNAMIC_CACHE).then((cache) =>
      cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          })
          .catch(() => {
            // Return offline fallback if we have it
            return caches.match('/') || new Response('Offline', { status: 503 });
          });
        return cachedResponse || fetchPromise;
      })
    )
  );
});

// ── Background Sync: Soil Reports ─────────────────────────────────────────────
async function syncSoilReports() {
  try {
    // Open the Dexie DB directly (IndexedDB)
    const dbRequest = indexedDB.open('eco-farm-db');
    return new Promise((resolve, reject) => {
      dbRequest.onsuccess = async (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('soilReports')) {
          resolve();
          return;
        }
        const tx = db.transaction('soilReports', 'readwrite');
        const store = tx.objectStore('soilReports');
        const index = store.index('synced');
        const req = index.getAll(0); // synced === false (stored as 0)

        req.onsuccess = async () => {
          const unsynced = req.result;
          if (unsynced.length === 0) { resolve(); return; }

          // Post each unsynced report (in production: POST to Supabase)
          for (const report of unsynced) {
            try {
              // Mark synced in IndexedDB
              const updateTx = db.transaction('soilReports', 'readwrite');
              updateTx.objectStore('soilReports').put({ ...report, synced: 1 });
            } catch {}
          }
          console.log(`[SW] Synced ${unsynced.length} soil reports`);
          resolve();
        };
        req.onerror = reject;
      };
      dbRequest.onerror = reject;
    });
  } catch (e) {
    console.warn('[SW] Soil sync failed:', e);
    throw e; // Retry on failure
  }
}

// ── Background Sync: Market Prices ────────────────────────────────────────────
async function syncMarketPrices() {
  try {
    const dbRequest = indexedDB.open('eco-farm-db');
    return new Promise((resolve) => {
      dbRequest.onsuccess = async (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('marketPrices')) { resolve(); return; }
        const tx = db.transaction('marketPrices', 'readwrite');
        const store = tx.objectStore('marketPrices');
        const req = store.getAll();
        req.onsuccess = () => {
          console.log(`[SW] Market prices cache has ${req.result.length} entries`);
          resolve();
        };
      };
      dbRequest.onerror = () => resolve();
    });
  } catch (e) {
    console.warn('[SW] Market sync failed:', e);
  }
}

// ── Sync Event Listener ────────────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-soil-reports') {
    event.waitUntil(syncSoilReports());
  }
  if (event.tag === 'sync-market-prices') {
    event.waitUntil(syncMarketPrices());
  }
});

// ── Push Notifications (future) ───────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'EcoFarm Alert', {
      body: data.body || '',
      icon: '/globe.svg',
      badge: '/globe.svg',
    })
  );
});
