// Ad Skipper Module
// Automatically skips YouTube ads

class AdSkipper {
    constructor() {
        this.isActive = true;
        this.skippedCount = 0;
        this.checkInterval = 500; // Check every 500ms
        this.lastCheckTime = Date.now();
        
        console.log('🚀 AdSkipper initializing...');
        
        this.init();
    }
    
    init() {
        // Wait for page to load before starting
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.start());
        } else {
            this.start();
        }
    }
    
    start() {
        console.log('✅ AdSkipper started');
        
        // Start the ad-checking loop
        this.checkInterval = setInterval(() => {
            this.checkAndSkipAds();
        }, 500);
        
        // Also watch for ad elements being injected
        this.observeAdElements();
    }
    
    checkAndSkipAds() {
        // Skip button selectors (YouTube uses various selectors)
        const skipSelectors = [
            'button.ytp-ad-skip-button',
            'button[aria-label="Skip ad"]',
            'button.ytp-ad-skip',
            'div.ytp-ad-skip-button-container button',
            '.ytp-ad-skip-button',
            'button[data-type="skip"]'
        ];
        
        for (let selector of skipSelectors) {
            const skipButton = document.querySelector(selector);
            if (skipButton && !skipButton.disabled) {
                // Check if button is actually visible
                const rect = skipButton.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    console.log(`⏭️ Skipping ad ($${selector})`);
                    skipButton.click();
                    this.skippedCount++;
                    return; // Skip only one ad per check
                }
            }
        }
        
        // Check for ad overlay elements
        this.removeAdOverlays();
    }
    
    removeAdOverlays() {
        // Remove ad overlay elements
        const adSelectors = [
            '.ytp-ad-overlay-container',
            '.ytp-ad-overlay',
            'div[data-is-ad="true"]',
            '.ytp-ad-progress',
            '.ytp-ad-preview'
        ];
        
        for (let selector of adSelectors) {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                // Only remove if it's actually an ad container
                if (el.style.display !== 'none') {
                    console.log(`🗑️ Removing ad element ($${selector})`);
                    el.style.display = 'none';
                }
            });
        }
    }
    
    observeAdElements() {
        // Use MutationObserver to watch for new ad elements
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' || mutation.type === 'attributes') {
                    // Check for ad elements in mutations
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            if (this.isAdElement(node)) {
                                console.log(`🚨 Ad element detected:`, node);
                                // Try to remove it
                                if (node.parentNode) {
                                    node.parentNode.removeChild(node);
                                    console.log(`✅ Ad element removed`);
                                }
                            }
                        }
                    });
                }
            });
        });
        
        // Start observing the document body
        observer.observe(document.body, {
            childList: true,
            attributes: true,
            subtree: true,
            attributeFilter: ['class', 'data-is-ad']
        });
        
        console.log('👁️ Ad element observer started');
    }
    
    isAdElement(node) {
        if (!node || !node.classList) return false;
        
        const adIndicators = [
            'ad',
            'ytp-ad',
            'sponsored',
            'promotion'
        ];
        
        const classList = node.className.toLowerCase();
        const dataAttrs = node.getAttribute('data-is-ad') === 'true';
        
        return adIndicators.some(indicator => classList.includes(indicator)) || dataAttrs;
    }
    
    // Hide YouTube's ad pause countdown
    hideAdCountdown() {
        const countdownSelectors = [
            '.ytp-ad-duration',
            '.ytp-ad-simple-ad-badge',
            'span.ytp-ad-duration-remaining'
        ];
        
        countdownSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                el.style.visibility = 'hidden';
            });
        });
    }
    
    // Get stats
    getStats() {
        return {
            active: this.isActive,
            skipped: this.skippedCount,
            uptime: Date.now() - this.lastCheckTime
        };
    }
    
    // Stop ad skipping
    stop() {
        clearInterval(this.checkInterval);
        this.isActive = false;
        console.log('⏹️ AdSkipper stopped');
    }
    
    // Resume ad skipping
    resume() {
        this.start();
        this.isActive = true;
        console.log('▶️ AdSkipper resumed');
    }
}

// Initialize AdSkipper
window.adSkipper = null;

// Wait for page to be ready
function initAdSkipper() {
    if (!window.adSkipper) {
        window.adSkipper = new AdSkipper();
    }
}

// Initialize when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdSkipper);
} else {
    initAdSkipper();
}

// Also try to initialize immediately
setTimeout(initAdSkipper, 1000);

console.log('✅ ad-skipper.js loaded');
