const CACHE_NAME = 'sakhipur-bazar-v2';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/offline.html',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&display=swap'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(key => {
                if (key !== CACHE_NAME) return caches.delete(key);
            })
        ))
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Network-first for index.html/root
    if (url.origin === self.location.origin && (url.pathname === '/' || url.pathname === '/index.html')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    const clonedResponse = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, clonedResponse));
                    return response;
                })
                .catch(() => caches.match(request))
        );
        return;
    }

    // Stale-while-revalidate for other assets
    event.respondWith(
        caches.match(request).then(cachedResponse => {
            const fetchedResponse = fetch(request).then(networkResponse => {
                caches.open(CACHE_NAME).then(cache => cache.put(request, networkResponse.clone()));
                return networkResponse;
            }).catch(() => null);

            return cachedResponse || fetchedResponse;
        })
    );
});
