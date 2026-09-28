/* Offline cache. Raise VERSION after changing any file so phones pick up the update. */
const VERSION = 'nafas1';
const FILES = [
  './',
  './css/styles.css',
  './icons/apple180.png',
  './icons/icon192.png',
  './icons/icon512.png',
  './index.html',
  './js/app.js',
  './js/core/charts.js',
  './js/core/store.js',
  './js/core/util.js',
  './js/data/content.js',
  './js/views/craving.js',
  './js/views/habits.js',
  './js/views/home.js',
  './js/views/journal.js',
  './js/views/learn.js',
  './js/views/progress.js',
  './js/views/settings.js',
  './js/views/setup.js',
  './js/views/smoked.js',
  './manifest.webmanifest'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request)));
});
