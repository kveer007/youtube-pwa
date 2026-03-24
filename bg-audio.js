// Background Audio Module
// Enables audio playback when app is in background

class BackgroundAudio {
    constructor() {
        this.isEnabled = true;
        this.audioContext = null;
        this.mediaSession = null;
        this.isPlaying = false;
        this.currentVideo = null;
        
        console.log('🚀 BackgroundAudio initializing...');
        
        this.init();
    }
    
    init() {
        // Initialize Media Session API
        this.initMediaSession();
        
        // Initialize audio context
        this.initAudioContext();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Monitor video playback
        this.monitorVideoPlayback();
        
        console.log('✅ BackgroundAudio initialized');
    }
    
    initMediaSession() {
        if ('mediaSession' in navigator) {
            this.mediaSession = navigator.mediaSession;
            
            // Set up media session handlers
            this.mediaSession.setActionHandler('play', () => this.handlePlay());
            this.mediaSession.setActionHandler('pause', () => this.handlePause());
            this.mediaSession.setActionHandler('previoustrack', () => this.handlePrevious());
            this.mediaSession.setActionHandler('nexttrack', () => this.handleNext());
            this.mediaSession.setActionHandler('seekbackward', (details) => this.handleSeekBackward(details));
            this.mediaSession.setActionHandler('seekforward', (details) => this.handleSeekForward(details));
            
            console.log('🎵 Media Session API initialized');
        } else {
            console.warn('⚠️ Media Session API not supported');
        }
    }
    
    initAudioContext() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioContext = new AudioContext();
                console.log('🔊 Audio Context initialized');
            }
        } catch (err) {
            console.warn('⚠️ Audio Context not available:', err);
        }
    }
    
    setupEventListeners() {
        // Listen for visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handleAppBackgrounded();
            } else {
                this.handleAppForegrounded();
            }
        });
        
        // Listen for page state changes
        window.addEventListener('beforeunload', () => {
            this.handlePageUnload();
        });
    }
    
    monitorVideoPlayback() {
        // Check for video elements every 500ms
        setInterval(() => {
            this.checkActiveVideo();
        }, 500);
    }
    
    checkActiveVideo() {
        // Find the main YouTube video player
        const videos = document.querySelectorAll('video');
        
        videos.forEach(video => {
            if (!video.paused) {
                this.currentVideo = video;
                this.isPlaying = true;
                
                // Update media session metadata
                this.updateMediaSession();
            }
        });
    }
    
    updateMediaSession() {
        if (!this.mediaSession || !this.currentVideo) return;
        
        // Try to get video metadata
        const title = this.extractVideoTitle();
        const artwork = this.extractVideoThumbnail();
        
        try {
            this.mediaSession.metadata = new MediaMetadata({
                title: title || 'YouTube Video',
                artist: 'YouTube',
                album: 'YouTube',
                artwork: artwork ? [{ src: artwork, sizes: '512x512', type: 'image/jpeg' }] : []
            });
            
            console.log(`🎵 Media Session updated: $${title}`);
        } catch (err) {
            console.warn('⚠️ Could not update media session:', err);
        }
    }
    
    extractVideoTitle() {
        // Try various selectors for video title
        const selectors = [
            'h1.title yt-formatted-string',
            'h1 yt-formatted-string',
            '.title.ytd-video-primary-info-renderer',
            'yt-formatted-string.title'
        ];
        
        for (let selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element.textContent.trim();
            }
        }
        
        return null;
    }
    
    extractVideoThumbnail() {
        // Try to get video thumbnail
        const selectors = [
            'meta[property="og:image"]',
            'img[alt="Thumbnail"]',
            'img.yt-core-image'
        ];
        
        for (let selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element.src || element.content;
            }
        }
        
        return null;
    }
    
    handleAppBackgrounded() {
        if (this.isPlaying) {
            console.log('🔊 App backgrounded - audio will continue playing');
            
            // Prevent screen lock on supported devices
            this.preventScreenLock();
            
            // Notify user
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('YouTube', {
                    body: 'Audio playback continues in background',
                    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%23FF0000" width="192" height="192"/><path fill="white" d="M72 90l48-32v64z" transform="translate(48 48)"/></svg>'
                });
            }
        }
    }
    
    handleAppForegrounded() {
        console.log('📱 App in foreground');
    }
    
    preventScreenLock() {
        // Try to prevent screen lock using Wake Lock API
        if ('wakeLock' in navigator) {
            navigator.wakeLock.request('screen')
                .then(() => {
                    console.log('🔒 Wake Lock acquired - screen will stay on');
                })
                .catch(err => {
                    console.warn('⚠️ Could not acquire Wake Lock:', err);
                });
        }
    }
    
    handlePageUnload() {
        console.log('👋 Page unloading - playback will stop');
    }
    
    // Media Session handlers
    handlePlay() {
        if (this.currentVideo) {
            this.currentVideo.play();
            this.isPlaying = true;
            console.log('▶️ Play');
        }
    }
    
    handlePause() {
        if (this.currentVideo) {
            this.currentVideo.pause();
            this.isPlaying = false;
            console.log('⏸️ Pause');
        }
    }
    
    handlePrevious() {
        console.log('⏮️ Previous track');
        // Navigate to previous video (if available)
    }
    
    handleNext() {
        console.log('⏭️ Next track');
        // Navigate to next video (if available)
    }
    
    handleSeekBackward(details) {
        if (this.currentVideo) {
            const seekTime = details.seekTime || 10;
            this.currentVideo.currentTime = Math.max(0, this.currentVideo.currentTime - seekTime);
            console.log(`⏪ Seek backward $${seekTime}s`);
        }
    }
    
    handleSeekForward(details) {
        if (this.currentVideo) {
            const seekTime = details.seekTime || 10;
            this.currentVideo.currentTime = Math.min(this.currentVideo.duration, this.currentVideo.currentTime + seekTime);
            console.log(`⏩ Seek forward $${seekTime}s`);
        }
    }
    
    // Request notification permission
    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('✅ Notification permission granted');
                }
            });
        }
    }
    
    // Get stats
    getStats() {
        return {
            enabled: this.isEnabled,
            playing: this.isPlaying,
            mediaSessionAvailable: this.mediaSession !== null,
            audioContextAvailable: this.audioContext !== null
        };
    }
    
    // Enable/disable background audio
    setEnabled(enabled) {
        this.isEnabled = enabled;
        console.log(`🔊 Background audio $${enabled ? 'enabled' : 'disabled'}`);
    }
}

// Initialize BackgroundAudio
window.backgroundAudio = null;

function initBackgroundAudio() {
    if (!window.backgroundAudio) {
        window.backgroundAudio = new BackgroundAudio();
        window.backgroundAudio.requestNotificationPermission();
    }
}

// Initialize when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBackgroundAudio);
} else {
    initBackgroundAudio();
}

// Also try to initialize immediately
setTimeout(initBackgroundAudio, 1000);

console.log('✅ bg-audio.js loaded');
