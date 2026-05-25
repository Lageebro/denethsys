const CACHE_NAME = 'deneth-finance-v1';
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './style.css',
  './tailwind.js',
  './fontawesome.js',
  './dexie.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install Event - Caching assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching complete local assets...');
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Cleaning old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Clearing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Serve from Cache, fall back to Network
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).catch(() => {
        // Handle potential offline resource requests gracefully
        console.log('Resource fetch failed (offline):', e.request.url);
      });
    })
  );
});
