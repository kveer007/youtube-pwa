// Service Worker for YouTube PWA
// Caches assets and provides offline support

const CACHE_NAME = 'youtube-pwa-v1';
const RUNTIME_CACHE = 'youtube-pwa-runtime-v1';

// Assets to cache on install
const ASSETS_TO_CACHE = [
    '/youtube-pwa/',
    '/youtube-pwa/index.html',
    '/youtube-pwa/manifest.json',
    '/youtube-pwa/app.js',
    '/youtube-pwa/ad-skipper.js',
    '/youtube-pwa/bg-audio.js'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Caching assets...');
                return cache.addAll(ASSETS_TO_CACHE).catch(err => {
                    console.warn('⚠️ Some assets could not be cached:', err);
                    return Promise.resolve();
                });
            })
            .then(() => {
                console.log('✅ Service Worker installed and cached');
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
                        console.log('🗑️ Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('✅ Service Worker activated');
            return self.clients.claim();
        })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Log request (for debugging)
    if (request.url.includes('youtube')) {
        console.log(`📡 Fetch: ${request.url}`);
    }
    
    // Handle YouTube requests
    if (url.hostname === 'www.youtube.com' || url.hostname === 'youtube.com') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache successful responses
                    if (response && response.status === 200) {
                        const clonedResponse = response.clone();
                        caches.open(RUNTIME_CACHE).then((cache) => {
                            cache.put(request, clonedResponse);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if offline
                    return caches.match(request).then((cachedResponse) => {
                        return cachedResponse || new Response(
                            '<h1>Offline</h1><p>YouTube content is not available offline. Please check your connection.</p>',
                            { headers: { 'Content-Type': 'text/html' } }
                        );
                    });
                })
        );
        return;
    }
    
    // Handle other requests
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                return cachedResponse || fetch(request);
            })
            .catch(() => {
                return fetch(request);
            })
    );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
    console.log('💬 Service Worker received message:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('✅ Service Worker script loaded');
