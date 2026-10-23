const CACHE_PREFIX = 'azure-networking-academy-';
const CACHE_NAME = `${CACHE_PREFIX}2026-10-diagrams-1`;
const APP_BASE = new URL(self.registration.scope);
const INDEX_URL = new URL('index.html', APP_BASE).href;
const APP_SHELL = [
    './',
    'index.html',
    'manifest.webmanifest',
    'icons/app-icon.svg',
    'css/styles.css?v=2026-10-diagrams-1',
    'css/learning.css?v=2026-10-diagrams-1',
    'css/diagrams.css?v=2026-10-diagrams-1',
    'js/progress.js?v=2026-10-diagrams-1',
    'js/ui-state.js?v=2026-10-diagrams-1',
    'js/today-engine.js?v=2026-10-diagrams-1',
    'js/modules-100.js?v=2026-10-diagrams-1',
    'js/modules-200.js?v=2026-10-diagrams-1',
    'js/modules-300.js?v=2026-10-diagrams-1',
    'js/modules-extras.js?v=2026-10-diagrams-1',
    'js/mastery-content.js?v=2026-10-diagrams-1',
    'js/learning-content.js?v=2026-10-diagrams-1',
    'js/quiz-engine.js?v=2026-10-diagrams-1',
    'js/interactive.js?v=2026-10-diagrams-1',
    'js/lab-engine.js?v=2026-10-diagrams-1',
    'js/diagram-models.js?v=2026-10-diagrams-1',
    'js/diagram-afd.js?v=2026-10-diagrams-1',
    'js/diagrams.js?v=2026-10-diagrams-1',
    'js/mastery-engine.js?v=2026-10-diagrams-1',
    'js/learning-engine.js?v=2026-10-diagrams-1',
    'js/beginner.js?v=2026-10-diagrams-1',
    'js/app.js?v=2026-10-diagrams-1'
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
    if (request.method !== 'GET' || requestUrl.origin !== APP_BASE.origin || !requestUrl.pathname.startsWith(APP_BASE.pathname)) return;

    if (request.mode === 'navigate') {
        event.respondWith(
            caches.open(CACHE_NAME)
                .then(cache => cache.match(INDEX_URL))
                .then(cachedIndex => cachedIndex || fetch(request))
        );
        return;
    }

    event.respondWith(
        caches.open(CACHE_NAME).then(async cache => {
            const cachedResponse = await cache.match(request);
            if (cachedResponse) return cachedResponse;
            const networkResponse = await fetch(request);
            if (networkResponse.ok) event.waitUntil(cache.put(request, networkResponse.clone()));
            return networkResponse;
        })
    );
});