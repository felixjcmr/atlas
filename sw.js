const CACHE = 'atlas-v3';
const FILES = [
  'dashboard.html',
  'carburant.html',
  'glucide_tracker.html',
  'training.html',
  'routine.html',
  'bilan.html',
  'coach.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'icon-180.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Network-first pour les HTML — toujours la version fraîche si online
// Cache-first pour les assets statiques (images, manifest)
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isHtml = url.pathname.endsWith('.html') || url.pathname === '/';
  if(isHtml){
    // HTML : network d'abord, cache en fallback
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
  } else {
    // Assets : cache d'abord
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('dashboard.html')))
    );
  }
});
