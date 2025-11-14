
class CoffeeMapApp {
    constructor() {
        this.coffeeLoader = null;
        this.loadingController = null;
        this.mapInitialized = false;
    }

    // Initialize the entire application
    async init() {
   
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }

        // Initialize map first
        this.initializeMap();
        
        // Initialize coffee data and loading controller
        this.initializeDataLoader();
    }

    // Initialize map and location features
    initializeMap() {
        
        
        // Wait for loading screen to finish before initializing map
        setTimeout(() => {
            if (!document.getElementById('loadingScreen').classList.contains('hide')) {
                // If loading screen is still visible, wait for it to hide
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.target.classList.contains('hide')) {
                            window.MapFunctions.initializeMap();
                            window.MapFunctions.setupLocateButton();
                            this.mapInitialized = true;
                            observer.disconnect();
                        }
                    });
                });
                observer.observe(document.getElementById('loadingScreen'), {
                    attributes: true,
                    attributeFilter: ['class']
                });
            } else {
                // Loading screen is already hidden, initialize map immediately
                window.MapFunctions.initializeMap();
                window.MapFunctions.setupLocateButton();
                this.mapInitialized = true;
            }
        }, 100);
    }

    // Initialize coffee data loading and UI
    initializeDataLoader() {
        // Wait for classes to be available
        const waitForClasses = () => {
            if (window.LoadingController) {
                // Create loading controller instance
                this.loadingController = new window.LoadingController();
                
                // Start the app initialization process
                this.loadingController.initializeApp();
            } else {
                setTimeout(waitForClasses, 100);
            }
        };
        
        waitForClasses();
    }

    // Get the coffee loader instance (useful for external access)
    getCoffeeLoader() {
        return this.loadingController ? this.loadingController.coffeeLoader : null;
    }

    // Check if map is ready
    isMapReady() {
        return this.mapInitialized && window.map;
    }
}

// Create global app instance
const coffeeMapApp = new CoffeeMapApp();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Set flag that main.js is handling initialization
    window.coffeeMapApp = coffeeMapApp;
    
    // Initialize the app
    coffeeMapApp.init();
});

// Export for external use if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CoffeeMapApp, coffeeMapApp };
} else {
    window.CoffeeMapApp = CoffeeMapApp;
    window.coffeeMapApp = coffeeMapApp;
}