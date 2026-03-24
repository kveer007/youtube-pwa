// Service Worker for YouTube PWA
// Handles caching, offline support, and background sync

const CACHE_NAME = 'youtube-pwa-v2';

const ASSETS_TO_CACHE = [
    '/',
    '/manifest.json',
    '/app.js',
    '/ad-skipper.js',
    '/bg-audio.js',
    '/sw.js'
];

// Install Event - Cache files on first install
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Caching app files');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log('✅ All files cached successfully');
                // Skip waiting to activate immediately
                return self.skipWaiting();
            })
            .catch((err) => {
                console.error('❌ Cache installation failed:', err);
            })
    );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Delete old cache versions
                    if (cacheName !== CACHE_NAME) {
                        console.log(`🗑️ Deleting old cache: $${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        .then(() => {
            console.log('✅ Service Worker activated');
            // Take control of all clients
            return self.clients.claim();
        })
        .catch((err) => {
            console.error('❌ Activation error:', err);
        })
    );
});

// Fetch Event - Serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Only cache GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip cross-origin requests (non-YouTube)
    if (url.origin !== self.location.origin && 
        !url.hostname.includes('youtube.com') &&
        !url.hostname.includes('youtu.be')) {
        return;
    }
    
    // Caching strategies
    if (isAssetRequest(url)) {
        // Strategy: Cache first, fallback to network
        event.respondWith(
            caches.match(request)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        console.log(`📦 Served from cache: $${request.url}`);
                        return cachedResponse;
                    }
                    
                    return fetch(request)
                        .then((response) => {
                            // Cache successful responses
                            if (response.ok) {
                                const responseToCache = response.clone();
                                caches.open(CACHE_NAME)
                                    .then((cache) => {
                                        cache.put(request, responseToCache);
                                    });
                            }
                            return response;
                        })
                        .catch((err) => {
                            console.error(`❌ Fetch failed for $${request.url}:`, err);
                            return cacheErrorResponse();
                        });
                })
        );
    } else if (isVideoRequest(url)) {
        // Strategy: Network first, fallback to cache for videos
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        // Cache video response
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(request, responseToCache);
                            });
                    }
                    return response;
                })
                .catch(() => {
                    console.log(`📺 Attempting to serve video from cache: $${request.url}`);
                    return caches.match(request)
                        .then((cachedResponse) => {
                            return cachedResponse || cacheErrorResponse();
                        });
                })
        );
    } else {
        // Strategy: Stale-while-revalidate for other requests
        event.respondWith(
            caches.match(request)
                .then((cachedResponse) => {
                    const fetchPromise = fetch(request)
                        .then((response) => {
                            if (response.ok) {
                                const responseToCache = response.clone();
                                caches.open(CACHE_NAME)
                                    .then((cache) => {
                                        cache.put(request, responseToCache);
                                    });
                            }
                            return response;
                        })
                        .catch(() => {
                            return cachedResponse || cacheErrorResponse();
                        });
                    
                    return cachedResponse || fetchPromise;
                })
        );
    }
});

// Helper: Check if request is an asset (JS, CSS, images, fonts)
function isAssetRequest(url) {
    const assetExtensions = [
        '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg',
        '.woff', '.woff2', '.ttf', '.eot', '.json', '.webmanifest'
    ];
    
    return assetExtensions.some(ext => url.pathname.endsWith(ext));
}

// Helper: Check if request is a video
function isVideoRequest(url) {
    return url.pathname.endsWith('.mp4') ||
           url.pathname.endsWith('.webm') ||
           url.pathname.endsWith('.ogg') ||
           url.hostname.includes('youtube.com') ||
           url.hostname.includes('youtu.be');
}

// Helper: Return offline error page
function cacheErrorResponse() {
    return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Offline</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-align: center;
                }
                .container {
                    padding: 40px;
                    border-radius: 10px;
                    background: rgba(0, 0, 0, 0.2);
                }
                h1 { margin: 0; font-size: 48px; }
                p { margin: 10px 0 0 0; font-size: 18px; opacity: 0.9; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>📵 Offline</h1>
                <p>This resource is not available offline.</p>
                <p>Please check your internet connection.</p>
            </div>
        </body>
        </html>
        `,
        {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
                'Content-Type': 'text/html; charset=utf-8'
            })
        }
    );
}

// Message Event - Handle messages from clients
self.addEventListener('message', (event) => {
    console.log('📨 Message received in Service Worker:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
        console.log('⚡ Skipped waiting - activating new version');
    }
});

// Periodic Background Sync (if supported)
if ('periodicSync' in self.registration) {
    self.addEventListener('periodicsync', (event) => {
        if (event.tag === 'update-cache') {
            console.log('🔄 Periodic sync: Updating cache');
            event.waitUntil(
                caches.open(CACHE_NAME)
                    .then((cache) => {
                        return cache.addAll(ASSETS_TO_CACHE);
                    })
            );
        }
    });
}

// Push Notification Event (if supported)
self.addEventListener('push', (event) => {
    if (event.data) {
        const options = {
            body: event.data.text(),
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%23FF0000" width="192" height="192"/><path fill="white" d="M72 90l48-32v64z" transform="translate(48 48)"/></svg>',
            badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%23FF0000" width="192" height="192"/></svg>'
        };
        
        event.waitUntil(
            self.registration.showNotification('YouTube PWA', options)
        );
    }
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Focus existing window if available
                for (let client of clientList) {
                    if (client.url === '/' && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Open new window if not found
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
    );
});

console.log('✅ Service Worker script loaded');
