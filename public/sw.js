const CACHE_NAME_HTML = 'astro-reader-html-v5';
const CACHE_NAME_ASSETS = 'astro-reader-assets-v5';
const CACHE_NAME_IMMUTABLE = 'astro-reader-immutable-v5'; // audio and data

const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/pwa-icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME_HTML).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME_HTML, CACHE_NAME_ASSETS, CACHE_NAME_IMMUTABLE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName) && cacheName.startsWith('astro-reader-')) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET' || url.pathname.endsWith('.json')) {
    return;
  }

  // 1. IMMUTABLE FILES: CACHE-FIRST (Audio, Data, Fonts)
  // These files are heavy and they never mutate
  if (url.pathname.startsWith('/audio/') || url.pathname.startsWith('/data/') || url.pathname.startsWith('/fonts/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') return response;
          const responseToCache = response.clone();
          caches.open(CACHE_NAME_IMMUTABLE).then((cache) => cache.put(event.request, responseToCache));
          return response;
        }).catch(() => {
          // If offline and not in cache, let it fail natively
        });
      })
    );
    return;
  }

  // 2. HTML NAVIGATION: NETWORK FIRST, FALLBACK TO CACHE
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME_HTML).then((cache) => cache.put(event.request, responseToCache));
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || caches.match('/'); // Return app shell
          });
        })
    );
    return;
  }

  // 3. JS, CSS, IMAGES, OTHERS: STALE-WHILE-REVALIDATE
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME_ASSETS).then((cache) => cache.put(event.request, cacheCopy));
          }
          return networkResponse;
        })
        .catch(() => {
          // Silent catch for offline gracefully failing
        });

      return cachedResponse || fetchPromise;
    })
  );
});
