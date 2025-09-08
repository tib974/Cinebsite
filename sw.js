const CACHE_NAME = 'cineb-v1';
const CORE = [
  '/',
  '/index.html',
  '/theme-poppins.css',
  '/favicon.ico',
  '/js/nav.js',
  '/js/config.js',
  '/js/cache.js',
  '/js/image-optimizer.js',
  '/manifest.webmanifest',
  '/data/image_manifest.json',
  // Precache local fonts for stable first paint
  '/assets/fonts/pxiEyp8kv8JHgFVrJJnecnFHGPezSQ.woff2',
  '/assets/fonts/pxiEyp8kv8JHgFVrJJfecnFHGPc.woff2',
  '/assets/fonts/pxiByp8kv8JHgFVrLEj6Z11lFd2JQEl8qw.woff2',
  '/assets/fonts/pxiByp8kv8JHgFVrLEj6Z1JlFd2JQEl8qw.woff2',
  '/assets/fonts/pxiByp8kv8JHgFVrLEj6Z1xlFd2JQEk.woff2',
  '/assets/fonts/pxiByp8kv8JHgFVrLCz7Z11lFd2JQEl8qw.woff2',
  '/assets/fonts/pxiByp8kv8JHgFVrLCz7Z1JlFd2JQEl8qw.woff2',
  '/assets/fonts/pxiByp8kv8JHgFVrLCz7Z1xlFd2JQEk.woff2',
  '/assets/fonts/pxiByp8kv8JHgFVrLDD4Z11lFd2JQEl8qw.woff2',
  '/assets/fonts/pxiByp8kv8JHgFVrLDD4Z1JlFd2JQEl8qw.woff2',
  '/assets/fonts/pxiByp8kv8JHgFVrLDD4Z1xlFd2JQEk.woff2'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME ? caches.delete(k) : null))).then(()=>self.clients.claim())
  );
});

// Stale-while-revalidate for GET requests on same-origin, except admin and POST endpoints
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.startsWith('/desk') || url.pathname.startsWith('/office') || url.pathname.startsWith('/api/quote.php')) return;
  event.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(res => {
        const respClone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, respClone));
        return res;
      }).catch(()=> cached);
      return cached || network;
    })
  );
});
