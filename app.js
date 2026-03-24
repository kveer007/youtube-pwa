// Main App Logic
// Initializes the PWA and coordinates all features

class YouTubePWA {
    constructor() {
        this.name = 'YouTube PWA';
        this.version = '1.0.0';
        this.initialized = false;
        
        console.log(`🚀 $${this.name} v$${this.version} initializing...`);
        
        this.init();
    }
    
    init() {
        // Setup event listeners
        this.setupEventListeners();
        
        // Check online status
        this.updateOnlineStatus();
        
        // Setup periodic checks
        this.setupPeriodicChecks();
        
        this.initialized = true;
        console.log(`✅ $${this.name} initialized`);
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
        console.log(`🌐 Online status: $${isOnline ? '✅ Online' : '❌ Offline'}`);
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
        // Could add visual notification here
    }
    
    // Get app info
    getInfo() {
        return {
            name: this.name,
            version: this.version,
            initialized: this.initialized,
            online: navigator.onLine,
            serviceWorker: 'serviceWorker' in navigator,
            backgroundAudio: 'AudioContext' in window,
            webWorkers: 'Worker' in window
        };
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

console.log('✅ app.js loaded');
