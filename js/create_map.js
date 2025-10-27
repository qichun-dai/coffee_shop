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

// Function to check if coordinates are within Amsterdam bounds
function isInAmsterdam(lat, lng) {
    // Amsterdam approximate bounds
    const amsterdamBounds = {
        north: 52.431,
        south: 52.278,
        east: 5.079,
        west: 4.728
    };
    
    return lat >= amsterdamBounds.south && 
           lat <= amsterdamBounds.north && 
           lng >= amsterdamBounds.west && 
           lng <= amsterdamBounds.east;
}

// Function to handle user location
function handleLocateUser() {
    const locationInput = document.getElementById('locationInput');
    const inputValue = locationInput.value.trim();
    
    if (inputValue) {
        // User has typed a location, search for it
        searchLocation(inputValue);
    } else {
        // Input is empty, get current location
        getCurrentLocation();
    }
}

// Function to search for a typed location
function searchLocation(locationQuery) {
    const locateButton = document.getElementById('locateButton');
    const originalText = locateButton.textContent;
    locateButton.textContent = 'Searching...';
    locateButton.disabled = true;
    
    // Use a geocoding service (you can use Nominatim or another service)
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationQuery)},Amsterdam,Netherlands&limit=1`;
    
    fetch(geocodeUrl)
        .then(response => response.json())
        .then(data => {
            locateButton.textContent = originalText;
            locateButton.disabled = false;
            
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);
                
                if (isInAmsterdam(lat, lng)) {
                    // Location found and is in Amsterdam
                    if (window.map) {
                        window.map.setView([lat, lng], 15);
                        
                        // Add a search result marker
                        if (window.searchLocationMarker) {
                            window.map.removeLayer(window.searchLocationMarker);
                        }
                        
                        window.searchLocationMarker = L.marker([lat, lng], {
                            icon: L.divIcon({
                                className: 'search-location-marker',
                                html: '<div style="background-color: #FF6B35; width: 12px; height: 12px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 2px #FF6B35;"></div>',
                                iconSize: [18, 18],
                                iconAnchor: [9, 9]
                            })
                        }).addTo(window.map);
                        
                        window.searchLocationMarker.bindPopup(`Location: ${data[0].display_name}`).openPopup();
                    }
                } else {
                    alert('The location you searched for is not in Amsterdam. Please try a location within Amsterdam.');
                }
            } else {
                alert('Location not found. Please try a different search term.');
            }
        })
        .catch(error => {
            locateButton.textContent = originalText;
            locateButton.disabled = false;
            console.error('Geocoding error:', error);
            alert('Error searching for location. Please try again.');
        });
}

// Function to get current location (original functionality)
function getCurrentLocation() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by this browser.');
        return;
    }

    // Show loading state
    const locateButton = document.getElementById('locateButton');
    locateButton.style.opacity = '0.6';
    locateButton.disabled = true;

    navigator.geolocation.getCurrentPosition(
        function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            // Reset button state
            locateButton.style.opacity = '1';
            locateButton.disabled = false;
            
            if (isInAmsterdam(lat, lng)) {
                // User is in Amsterdam, zoom to their location
                if (window.map) {
                    window.map.setView([lat, lng], 15);
                    
                    // Add a marker for user's location
                    if (window.userLocationMarker) {
                        window.map.removeLayer(window.userLocationMarker);
                    }
                    
                    window.userLocationMarker = L.marker([lat, lng], {
                        icon: L.divIcon({
                            className: 'user-location-marker',
                            html: '<div style="background-color: #007bff; width: 12px; height: 12px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 2px #007bff;"></div>',
                            iconSize: [18, 18],
                            iconAnchor: [9, 9]
                        })
                    }).addTo(window.map);
                    
                    window.userLocationMarker.bindPopup('Your Location').openPopup();
                }
            } else {
                // User is not in Amsterdam
                alert('Sorry, we can only show coffee shops in Amsterdam. You can try type in your location.');
            }
        },
        function(error) {
            // Reset button state
            locateButton.style.opacity = '1';
            locateButton.disabled = false;
            
            let message = 'Unable to get your location. ';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    message += 'Please allow location access to use this feature.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    message += 'Location information is unavailable.';
                    break;
                case error.TIMEOUT:
                    message += 'Location request timed out.';
                    break;
                default:
                    message += 'An unknown error occurred.';
                    break;
            }
            alert(message);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 600000 // 10 minutes
        }
    );
}

// Function to update button appearance based on input content
function updateButtonAppearance() {
    const locationInput = document.getElementById('locationInput');
    const locateButton = document.getElementById('locateButton');
    const inputValue = locationInput.value.trim();
    
    if (inputValue) {
        // Input has text, show text button
        locateButton.style.background = '#65451F';
        locateButton.style.backgroundImage = 'none';
        locateButton.style.color = 'white';
        locateButton.style.fontSize = '12px';
        locateButton.style.width = 'auto';
        locateButton.style.minWidth = '80px';
        locateButton.style.height = '25px';
        locateButton.style.padding = '0 12px';
        locateButton.style.borderRadius = '4px';
        locateButton.style.right = '5px';
        locateButton.style.transform = 'translateY(-50%)';
        locateButton.style.display = 'flex';
        locateButton.style.alignItems = 'center';
        locateButton.style.justifyContent = 'center';
        locateButton.style.lineHeight = '1';
        locateButton.textContent = 'Locate';
        locateButton.title = 'Search for this location';
    } else {
        // Input is empty, show blue navigation icon
        locateButton.style.background = 'url("../images/icons8-my-location-100.png") no-repeat center center';
        locateButton.style.backgroundSize = 'cover';
        locateButton.style.color = 'transparent';
        locateButton.style.fontSize = '';
        locateButton.style.width = '25px';
        locateButton.style.height = '25px';
        locateButton.style.minWidth = '';
        locateButton.style.padding = '';
        locateButton.style.borderRadius = '0 4px 4px 0';
        locateButton.style.right = '5px';
        locateButton.style.transform = 'translateY(-50%)';
        locateButton.style.display = 'block';
        locateButton.style.alignItems = '';
        locateButton.style.justifyContent = '';
        locateButton.style.lineHeight = '';
        locateButton.textContent = '';
        locateButton.title = 'Find my current location';
    }
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
                        setupLocateButton();
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
            setupLocateButton();
        }
    }, 100);
});

// Function to setup the locate button event listener
function setupLocateButton() {
    const locateButton = document.getElementById('locateButton');
    const locationInput = document.getElementById('locationInput');
    
    if (locateButton && locationInput) {
        locateButton.addEventListener('click', handleLocateUser);
        
        // Add input event listener to update button appearance
        locationInput.addEventListener('input', updateButtonAppearance);
        locationInput.addEventListener('keyup', updateButtonAppearance);
        locationInput.addEventListener('paste', function() {
            setTimeout(updateButtonAppearance, 10); // Small delay for paste event
        });
        
        // Initialize button appearance
        updateButtonAppearance();
    }
}

