// Connectly Service Worker for PWA Installation and Performance
const CACHE_NAME = 'connectly-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through network-first strategy for live real-time sockets and API
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
