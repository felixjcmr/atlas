// Atlas SW — network-first pour HTML, mise à jour auto sans cache clear
const CACHE = 'atlas-v5';
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

// Install : met en cache les assets statiques
self.addEventListener('install', e => {
  self.skipWaiting(); // Active immédiatement sans attendre fermeture des onglets
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(FILES))
  );
});

// Activate : supprime les anciens caches et prend le contrôle immédiatement
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim()) // Prend le contrôle de tous les onglets ouverts
  );
});

// Fetch : toujours network-first pour les HTML (jamais de cache périmé)
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isHtml = url.pathname.endsWith('.html') || url.pathname.endsWith('/');

  if (isHtml) {
    // HTML : réseau d'abord → met à jour le cache → retourne la réponse fraîche
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' }) // Force le réseau
        .then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(e.request)) // Fallback cache si hors ligne
    );
  } else {
    // Assets (images, manifest) : cache d'abord
    e.respondWith(
      caches.match(e.request)
        .then(r => r || fetch(e.request).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        }))
    );
  }
});
