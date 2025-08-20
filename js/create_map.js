// Initialize map - will be called after loading screen
function initializeMap() {
    if (document.getElementById('map')) {
        var map = L.map('map').setView([52.3676, 4.9041], 10); // Reduced initial zoom for better auto-fit

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20,
            minZoom: 8 // Set minimum zoom to prevent zooming too far out
        }).addTo(map);

        // Make map globally accessible
        window.map = map;
        return map;
    }
    return null;
}

// Wait for main content to be visible before initializing map
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for the loading screen to potentially finish
    setTimeout(() => {
        if (!document.getElementById('loadingScreen').classList.contains('hide')) {
            // If loading screen is still visible, wait for it to hide
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.target.classList.contains('hide')) {
                        initializeMap();
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
            initializeMap();
        }
    }, 100);
});

