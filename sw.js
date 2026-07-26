const CACHE_PREFIX = 'azure-networking-academy-';
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const APP_BASE = new URL('./', self.location.href);
const INDEX_URL = new URL('index.html', APP_BASE).href;
const APP_SHELL = [
    './',
    'index.html',
    'manifest.webmanifest',
    'icons/app-icon.svg',
    'css/styles.css',
    'js/progress.js',
    'js/modules-100.js',
    'js/modules-200.js',
    'js/modules-300.js',
    'js/modules-extras.js',
    'js/mastery-content.js',
    'js/quiz-engine.js',
    'js/interactive.js',
    'js/lab-engine.js',
    'js/diagrams.js',
    'js/mastery-engine.js',
    'js/app.js'
].map(path => new URL(path, APP_BASE).href);

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys
                    .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const request = event.request;
    const requestUrl = new URL(request.url);
    if (request.method !== 'GET' || requestUrl.origin !== self.location.origin) return;

    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request).catch(() => caches.match(INDEX_URL))
        );
        return;
    }

    event.respondWith(
        caches.match(request).then(cachedResponse => {
            if (cachedResponse) return cachedResponse;
            return fetch(request).then(networkResponse => {
                if (networkResponse.ok) {
                    const responseCopy = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, responseCopy));
                }
                return networkResponse;
            });
        })
    );
});