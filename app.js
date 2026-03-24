// Main App Logic
// Initializes the PWA and coordinates all features

class YouTubePWA {
    constructor() {
        this.name = 'YouTube PWA';
        this.version = '1.0.0';
        this.initialized = false;
        this.swRegistration = null;
        
        console.log(`🚀 $${this.name} v$${this.version} initializing...`);
        
        this.init();
    }
    
    async init() {
        // Register Service Worker
        await this.registerServiceWorker();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Check online status
        this.updateOnlineStatus();
        
        // Setup periodic checks
        this.setupPeriodicChecks();
        
        // Check for Service Worker updates
        this.checkForUpdates();
        
        this.initialized = true;
        console.log(`✅ $${this.name} initialized`);
    }
    
    async registerServiceWorker() {
        // Only register if supported
        if (!('serviceWorker' in navigator)) {
            console.warn('⚠️ Service Workers not supported');
            return;
        }
        
        try {
            console.log('📝 Registering Service Worker...');
            
            // Register from root directory (GitHub Pages compatible)
            this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });
            
            console.log('✅ Service Worker registered successfully');
            console.log('📍 Scope:', this.swRegistration.scope);
            
            // Check for updates
            this.swRegistration.addEventListener('updatefound', () => {
                const newWorker = this.swRegistration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'activated') {
                        console.log('🆕 New Service Worker version available');
                        this.showNotification('App updated! Refresh to see changes.', 'success');
                    }
                });
            });
            
            // Handle controller change
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('🔄 Service Worker controller changed');
            });
            
        } catch (error) {
            console.error('❌ Service Worker registration failed:', error);
            this.showNotification('Service Worker registration failed', 'error');
        }
    }
    
    checkForUpdates() {
        // Check for SW updates every 60 seconds
        if (this.swRegistration) {
            setInterval(() => {
                this.swRegistration.update();
            }, 60000);
        }
    }
    
    setupEventListeners() {
        // Online/Offline listeners
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
        
        // Visibility change listener (for background play)
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
        
        // Page visibility
        if (document.hidden) {
            console.log('📱 App is in background');
        } else {
            console.log('📱 App is in foreground');
        }
        
        // Service Worker message listener
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                console.log('📨 Message from Service Worker:', event.data);
                
                if (event.data.type === 'CACHE_UPDATED') {
                    console.log('📦 Cache updated');
                }
            });
        }
    }
    
    setupPeriodicChecks() {
        // Check connection every 30 seconds
        setInterval(() => {
            this.updateOnlineStatus();
        }, 30000);
        
        // Refresh session every 15 minutes
        setInterval(() => {
            this.refreshSession();
        }, 15 * 60 * 1000);
    }
    
    updateOnlineStatus() {
        const isOnline = navigator.onLine;
        const status = isOnline ? '✅ Online' : '❌ Offline';
        console.log(`🌐 Online status: $${status}`);
        
        // Update UI if needed
        document.body.classList.toggle('offline', !isOnline);
    }
    
    handleOnline() {
        console.log('✅ Connection restored');
        this.showNotification('Connection restored', 'success');
    }
    
    handleOffline() {
        console.log('❌ Connection lost - using cached content');
        this.showNotification('Offline mode - cached content available', 'warning');
    }
    
    handleVisibilityChange() {
        if (document.hidden) {
            console.log('🔇 App backgrounded - audio will continue playing');
        } else {
            console.log('📱 App in foreground');
        }
    }
    
    refreshSession() {
        console.log('🔄 Refreshing session...');
        // Session refresh happens automatically via cookies
    }
    
    showNotification(message, type = 'info') {
        console.log(`[$${type.toUpperCase()}] $${message}`);
        
        // Visual notification in console
        const styles = {
            info: 'color: #0066cc; font-weight: bold;',
            success: 'color: #008000; font-weight: bold;',
            warning: 'color: #ff9900; font-weight: bold;',
            error: 'color: #cc0000; font-weight: bold;'
        };
        
        console.log(`%c$${message}`, styles[type] || styles.info);
    }
    
    // Get app info
    getInfo() {
        return {
            name: this.name,
            version: this.version,
            initialized: this.initialized,
            online: navigator.onLine,
            serviceWorker: 'serviceWorker' in navigator,
            swRegistered: !!this.swRegistration,
            backgroundAudio: 'AudioContext' in window,
            webWorkers: 'Worker' in window,
            webGL: !!document.createElement('canvas').getContext('webgl'),
            notifications: 'Notification' in window,
            vibration: 'vibrate' in navigator
        };
    }
    
    // Force Service Worker update
    async forceUpdate() {
        if (this.swRegistration) {
            try {
                await this.swRegistration.update();
                console.log('🔄 Service Worker update check completed');
            } catch (error) {
                console.error('❌ Update check failed:', error);
            }
        }
    }
    
    // Clear all caches
    async clearCache() {
        try {
            const cacheNames = await caches.keys();
            const deletions = cacheNames.map(name => caches.delete(name));
            await Promise.all(deletions);
            console.log('✅ All caches cleared');
        } catch (error) {
            console.error('❌ Cache clear failed:', error);
        }
    }
    
    // Get cache size
    async getCacheSize() {
        if ('estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                const used = (estimate.usage / 1024 / 1024).toFixed(2);
                const quota = (estimate.quota / 1024 / 1024).toFixed(2);
                console.log(`💾 Cache: $${used}MB / ${quota}MB`);
                return { used, quota };
            } catch (error) {
                console.error('❌ Could not get cache size:', error);
            }
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new YouTubePWA();
    console.log('📊 App Info:', window.app.getInfo());
});

// Log any errors
window.addEventListener('error', (event) => {
    console.error('❌ Error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Unhandled Promise Rejection:', event.reason);
});

// Page load complete
window.addEventListener('load', () => {
    console.log('✅ Page fully loaded');
    if (window.app) {
        console.log('📊 Final App State:', window.app.getInfo());
    }
});

console.log('✅ app.js loaded');
