const CACHE_PREFIX = 'azure-networking-academy-';
const CACHE_NAME = `${CACHE_PREFIX}2026-07-ui-redesign`;
const APP_BASE = new URL('./', self.location.href);
const INDEX_URL = new URL('index.html', APP_BASE).href;
const APP_SHELL = [
    './',
    'index.html',
    'manifest.webmanifest',
    'icons/app-icon.svg',
    'css/styles.css?v=2026-07-ui-redesign',
    'js/progress.js?v=2026-07-ui-redesign',
    'js/ui-state.js?v=2026-07-ui-redesign',
    'js/today-engine.js?v=2026-07-ui-redesign',
    'js/modules-100.js?v=2026-07-ui-redesign',
    'js/modules-200.js?v=2026-07-ui-redesign',
    'js/modules-300.js?v=2026-07-ui-redesign',
    'js/modules-extras.js?v=2026-07-ui-redesign',
    'js/mastery-content.js?v=2026-07-ui-redesign',
    'js/quiz-engine.js?v=2026-07-ui-redesign',
    'js/interactive.js?v=2026-07-ui-redesign',
    'js/lab-engine.js?v=2026-07-ui-redesign',
    'js/diagrams.js?v=2026-07-ui-redesign',
    'js/mastery-engine.js?v=2026-07-ui-redesign',
    'js/app.js?v=2026-07-ui-redesign'
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