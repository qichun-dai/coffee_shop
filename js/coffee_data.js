// Coffee Shop Data Handler
class CoffeeShopLoader {
    constructor() {
        this.coffeeShops = [];
        this.markers = [];
        this.map = null;
    }

    async loadCoffeeData() {
        try {
            console.log('Loading coffee data...');
            const response = await fetch('./data/coffee_shops_stars_20251021_163739.csv');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvText = await response.text();
            console.log('CSV loaded, first 200 chars:', csvText.substring(0, 200));

            // Use PapaParse for robust CSV parsing
            if (typeof Papa === 'undefined') {
                console.error('PapaParse is not loaded! Please include papaparse.min.js in your HTML.');
                return [];
            }
            const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
            console.log('PapaParse result:', parsed);
            const data = parsed.data;
            console.log('CSV row count (excluding header):', data.length);

            // Find the keys for the columns we need
            const headers = parsed.meta.fields;
            const nameKey = headers.find(h => h.includes('displayName'));
            const ratingKey = headers.find(h => h.includes('rating'));
            const userRatingCountKey = headers.find(h => h.includes('userRatingCount'));
            const latKey = headers.find(h => h.includes('latitude'));
            const lngKey = headers.find(h => h.includes('longitude'));
            const addressKey = headers.find(h => h.includes('address'));
            const trueCoffeeKey = headers.find(h => h.includes('trueCoffee'));
            const placeUriKey = headers.find(h => h.includes('placeUri'));
            const typeKey = headers.find(h => h.includes('primaryType'));
            const adjustedRatingKey = headers.find(h => h.includes('adjustedRating'));
            console.log('Column keys:', { nameKey, ratingKey, latKey, lngKey, addressKey, userRatingCountKey, typeKey, adjustedRatingKey, trueCoffeeKey, placeUriKey });

            let skippedRows = 0;
            this.coffeeShops = [];
            data.forEach((row, i) => {
                const lat = parseFloat(row[latKey]);
                const lng = parseFloat(row[lngKey]);
                const trueCoffeeValue = (row[trueCoffeeKey] || '').replace(/"/g, '').trim();
                const ratingCountValue = parseInt(row[userRatingCountKey], 10);
                const adjustedRatingValue = parseFloat((row[adjustedRatingKey] || '').replace(/"/g, '').trim()) || 0;
                if (!isNaN(lat) && !isNaN(lng) && trueCoffeeValue === '1' && ratingCountValue >= 50 && adjustedRatingValue > 4.0) {
                    this.coffeeShops.push({
                        name: (row[nameKey] || '').replace(/"/g, '') || 'Unknown',
                        rating: parseFloat(row[ratingKey]) || 0,
                        ratingCount: row[userRatingCountKey] || '',
                        latitude: lat,
                        longitude: lng,
                        address: (row[addressKey] || '').replace(/"/g, '') || 'No address',
                        type: (row[typeKey] || '').replace(/"/g, '') || 'coffee_shop',
                        trueCoffee: trueCoffeeValue,
                        placeUri: (row[placeUriKey] || '').replace(/"/g, '') || 'Unknown',
                        adjustedRating: parseFloat((row[adjustedRatingKey] || '').replace(/"/g, '').trim()) || 0
                    });
                } 
            });
            console.log(`Loaded ${this.coffeeShops.length} coffee shops (skipped ${skippedRows} rows)`);
            return this.coffeeShops;
            
        } catch (error) {
            console.error('Error loading coffee data:', error);
            return [];
        }
    }

    // Helper function to parse CSV lines with quoted fields
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result;
    }

    // Helper function to create star rating display
    createStarRating(rating) {
        let starsHTML = '<div class="star-container">';
        
        // Always create exactly 5 stars
        for (let i = 1; i <= 5; i++) {
            if (i <= Math.floor(rating)) {
                // Full star
                starsHTML += '<span class="star-item full-star">&#9733;</span>';
            } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
                // Partial star (only for the position where the rating ends)
                const percentage = Math.round((rating % 1) * 100);
                starsHTML += `
                    <span class="star-item partial-star" style="--fill-percentage: ${percentage}%;">
                        <span class="star-bg">&#9733;</span>
                        <span class="star-fill">&#9733;</span>
                    </span>
                `;
            } else {
                // Empty star
                starsHTML += '<span class="star-item empty-star">&#9733;</span>';
            }
        }
        
        starsHTML += '</div>';
        
    // Add rating number (show only two decimals)
    starsHTML += `<span class="rating-number">${Number(rating).toFixed(2)}</span>`;
        
        return starsHTML;
    }

    addMarkersToMap(map) {
        this.map = map;
        this.clearMarkers();
        
        // Function to get icon size based on zoom level
        const getIconSize = (zoomLevel) => {
            if (zoomLevel <= 10) return 15;
            if (zoomLevel <= 12) return 20;
            if (zoomLevel <= 14) return 25;
            if (zoomLevel <= 16) return 30;
            return 35;
        };

        // Function to create coffee icon with dynamic size
        const createCoffeeIcon = (zoomLevel) => {
            const size = getIconSize(zoomLevel);
            return L.divIcon({
                className: 'coffee-marker',
                html: '<div class="coffee-icon-container"><span class="coffee-icon">C</span></div>',
                iconSize: [size, size],
                iconAnchor: [size/2, size/2],
                popupAnchor: [0, -size/2]
            });
        };

        // Create initial markers
        const initialZoom = map.getZoom();
        let coffeeIcon = createCoffeeIcon(initialZoom);

        this.coffeeShops.forEach((shop, shopIndex) => {
            
            const marker = L.marker([shop.latitude, shop.longitude], {
                icon: coffeeIcon
            });
            // Create popup content
            const popupContent = `
                <div class="coffee-popup">
                    <h3>${shop.name}</h3>
                    <div class="rating">${this.createStarRating(shop.rating)}</div>
                    <div class="address">${shop.address}</div>
                    <div class="type">${shop.type.replace('_', ' ')}</div>
                </div>
            `;
            marker.bindPopup(popupContent);
            
            // Add click event using multiple approaches to ensure it works
            marker.on('click', (e) => {
                console.log('Marker clicked for:', shop.name);
                this.scrollToTableRow(shop);
            });
            
            // Also try popupopen event as backup
            marker.on('popupopen', (e) => {
                console.log('Popup opened for:', shop.name);
                this.scrollToTableRow(shop);
            });
            
            // Store shop reference on marker for debugging
            marker.shopData = shop;
            
            marker.addTo(map);
            this.markers.push(marker);
        });
        // Restore zoom event listener to update icon sizes
        map.on('zoomend', () => {
            const currentZoom = map.getZoom();
            const newIcon = createCoffeeIcon(currentZoom);
            this.markers.forEach(marker => {
                marker.setIcon(newIcon);
            });
        });
    // Remove zoomend event for testing default marker

        // Fit map to show all markers with padding
        if (this.markers.length > 0) {
            const group = new L.featureGroup(this.markers);
            map.fitBounds(group.getBounds().pad(0.05)); // Reduced padding for better fit
        }
        
        // Add global debug function for testing
        window.testScrollToRow = () => {
            if (this.coffeeShops.length > 0) {
                console.log('Testing scroll with first shop:', this.coffeeShops[0].name);
                this.scrollToTableRow(this.coffeeShops[0]);
            }
        };
        
        console.log('Markers created. Test with: window.testScrollToRow()');
    }

    // Function to scroll to and highlight table row for a specific shop
    scrollToTableRow(targetShop) {
        console.log('Attempting to scroll to shop:', targetShop.name);
        
        // Wait a bit for the DOM to be ready
        setTimeout(() => {
            const tableContainer = document.querySelector('.table-container');
            const table = document.querySelector('.coffee-table');
            const tableRows = document.querySelectorAll('.coffee-table tbody tr');
            
            console.log('Table container found:', !!tableContainer);
            console.log('Table found:', !!table);
            console.log('Number of table rows found:', tableRows.length);
            
            if (!tableContainer || !tableRows.length) {
                console.log('Table or rows not found, retrying...');
                return;
            }
            
            // Clear any existing highlights
            tableRows.forEach(row => {
                row.classList.remove('highlighted-row');
                row.style.backgroundColor = '';
            });
            
            // Find the matching row by comparing shop names
            let targetRow = null;
            let rowIndex = -1;
            
            tableRows.forEach((row, index) => {
                const nameLink = row.querySelector('td:first-child a');
                if (nameLink) {
                    const rowShopName = nameLink.textContent.trim();
                    const targetShopName = targetShop.name.trim();
                    console.log(`Comparing row ${index}: "${rowShopName}" vs "${targetShopName}"`);
                    
                    if (rowShopName === targetShopName) {
                        targetRow = row;
                        rowIndex = index;
                        console.log('Found matching row at index:', index);
                    }
                }
            });
            
            if (targetRow) {
                console.log('Highlighting and scrolling to row');
                
                // Add highlight class and inline style for immediate effect
                targetRow.classList.add('highlighted-row');
                targetRow.style.backgroundColor = '#FFE4B5';
                targetRow.style.boxShadow = '0 0 10px rgba(255, 107, 53, 0.3)';
                
                // Calculate scroll position
                const containerRect = tableContainer.getBoundingClientRect();
                const rowRect = targetRow.getBoundingClientRect();
                const scrollTop = tableContainer.scrollTop;
                const containerTop = containerRect.top;
                const rowTop = rowRect.top;
                
                // Calculate target scroll position to center the row
                const targetScrollTop = scrollTop + rowTop - containerTop - (containerRect.height / 2) + (rowRect.height / 2);
                
                console.log('Scroll calculation:', {
                    scrollTop,
                    containerTop,
                    rowTop,
                    targetScrollTop
                });
                
                // Smooth scroll to the target row
                tableContainer.scrollTo({
                    top: Math.max(0, targetScrollTop),
                    behavior: 'smooth'
                });
                
                // Remove highlight after 4 seconds
                setTimeout(() => {
                    targetRow.classList.remove('highlighted-row');
                    targetRow.style.backgroundColor = '';
                    targetRow.style.boxShadow = '';
                    console.log('Highlight removed');
                }, 4000);
            } else {
                console.log('No matching row found for shop:', targetShop.name);
                console.log('Available shop names in table:');
                tableRows.forEach((row, index) => {
                    const nameLink = row.querySelector('td:first-child a');
                    if (nameLink) {
                        console.log(`  ${index}: "${nameLink.textContent.trim()}"`);
                    }
                });
            }
        }, 100); // Small delay to ensure DOM is ready
    }

    clearMarkers() {
        this.markers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.markers = [];
    }

    filterByRating(minRating) {
        this.clearMarkers();
        const filtered = this.coffeeShops.filter(shop => shop.adjustedRating >= minRating);
        
        // Function to get icon size based on zoom level
        const getIconSize = (zoomLevel) => {
            if (zoomLevel <= 10) return 15;
            if (zoomLevel <= 12) return 20;
            if (zoomLevel <= 14) return 25;
            if (zoomLevel <= 16) return 30;
            return 35;
        };

        // Function to create coffee icon with dynamic size
        const createCoffeeIcon = (zoomLevel) => {
            const size = getIconSize(zoomLevel);
            return L.divIcon({
                className: 'coffee-marker',
                html: '<div class="coffee-icon-container"><span class="coffee-icon">C</span></div>',
                iconSize: [size, size],
                iconAnchor: [size/2, size/2],
                popupAnchor: [0, -size/2]
            });
        };

        const currentZoom = this.map.getZoom();
        const coffeeIcon = createCoffeeIcon(currentZoom);

        filtered.forEach(shop => {
            const marker = L.marker([shop.latitude, shop.longitude], {
                icon: coffeeIcon
            });
            
            const popupContent = `
                <div class="coffee-popup">
                    <h3>${shop.name}</h3>
                    <div class="rating">${this.createStarRating(shop.adjustedRating)}</div>
                    <div class="address">${shop.address}</div>
                    <div class="type">${shop.type.replace('_', ' ')}</div>
                </div>
            `;
            
            marker.bindPopup(popupContent);
            
            // Add click event using multiple approaches
            marker.on('click', (e) => {
                console.log('Filtered marker clicked for:', shop.name);
                this.scrollToTableRow(shop);
            });
            
            // Also try popupopen event as backup
            marker.on('popupopen', (e) => {
                console.log('Filtered popup opened for:', shop.name);
                this.scrollToTableRow(shop);
            });
            
            // Store shop reference on marker
            marker.shopData = shop;
            
            marker.addTo(this.map);
            this.markers.push(marker);
        });

        // Update zoom event listener for filtered markers
        this.map.off('zoomend'); // Remove previous listener
        this.map.on('zoomend', () => {
            const newZoom = this.map.getZoom();
            const newIcon = createCoffeeIcon(newZoom);
            
            this.markers.forEach(marker => {
                marker.setIcon(newIcon);
            });
        });
    }
        filterByAdjustedRating(minRating) {
            this.clearMarkers();
            const filtered = this.coffeeShops.filter(shop => shop.adjustedRating >= minRating);

            // Function to get icon size based on zoom level
            const getIconSize = (zoomLevel) => {
                if (zoomLevel <= 10) return 15;
                if (zoomLevel <= 12) return 20;
                if (zoomLevel <= 14) return 25;
                if (zoomLevel <= 16) return 30;
                return 35;
            };

            // Function to create coffee icon with dynamic size
            const createCoffeeIcon = (zoomLevel) => {
                const size = getIconSize(zoomLevel);
                return L.divIcon({
                    className: 'coffee-marker',
                    html: '<div class="coffee-icon-container"><span class="coffee-icon">C</span></div>',
                    iconSize: [size, size],
                    iconAnchor: [size/2, size/2],
                    popupAnchor: [0, -size/2]
                });
            };

            const currentZoom = this.map.getZoom();
            const coffeeIcon = createCoffeeIcon(currentZoom);

            filtered.forEach(shop => {
                const marker = L.marker([shop.latitude, shop.longitude], {
                    icon: coffeeIcon
                });

                const popupContent = `
                    <div class="coffee-popup">
                        <h3>${shop.name}</h3>
                        <div class="rating">${this.createStarRating(shop.adjustedRating)}</div>
                        <div class="address">${shop.address}</div>
                        <div class="type">${shop.type.replace('_', ' ')}</div>
                    </div>
                `;

                marker.bindPopup(popupContent);
                marker.addTo(this.map);
                this.markers.push(marker);
            });

            // Update zoom event listener for filtered markers
            this.map.off('zoomend'); // Remove previous listener
            this.map.on('zoomend', () => {
                const newZoom = this.map.getZoom();
                const newIcon = createCoffeeIcon(newZoom);

                this.markers.forEach(marker => {
                    marker.setIcon(newIcon);
                });
            });
        }
}

// Loading screen controller
class LoadingController {
    constructor() {
        this.loadingScreen = document.getElementById('loadingScreen');
        this.mainContent = document.getElementById('mainContent');
    }

    async initializeApp() {
        // Start the coffee bean animation
        this.animateCoffeeBeans();
        
        // Simulate loading time for better UX
        await this.delay(2000);
        
        // Load coffee shop data
        const coffeeLoader = new CoffeeShopLoader();
        await coffeeLoader.loadCoffeeData();
        
        // Hide loading screen and show main content
        this.hideLoadingScreen();
        
        // Wait for map to be initialized, then add markers
        await this.waitForMap();
        if (window.map) {
            coffeeLoader.addMarkersToMap(window.map);
        }
        
        // Add rating filter and table
        this.addRatingFilter(coffeeLoader);
        this.createCoffeeTable(coffeeLoader);
        
        return coffeeLoader;
    }

    async waitForMap() {
        return new Promise((resolve) => {
            const checkMap = () => {
                if (window.map) {
                    resolve();
                } else {
                    setTimeout(checkMap, 100);
                }
            };
            checkMap();
        });
    }

    addRatingFilter(coffeeLoader) {
        // Add rating filter to the existing filter area
        const filterDiv = document.querySelector('.flex_item.filter');
        
        const ratingFilter = document.createElement('select');
        ratingFilter.id = 'ratingFilter';
        ratingFilter.style.marginLeft = '10px';
        ratingFilter.style.padding = '10px';
        ratingFilter.style.fontSize = '12px';
        ratingFilter.style.border = '1px solid #ccc';
        ratingFilter.style.borderRadius = '4px';
        ratingFilter.style.height = '40px';
        
        ratingFilter.innerHTML = `
            <option value="0">All Ratings</option>
            <option value="4.5">4.5+ Stars</option>
            <option value="4.8">4.8+ Stars</option>
        `;
        
        ratingFilter.addEventListener('change', (e) => {
            const minRating = parseFloat(e.target.value);
                coffeeLoader.filterByAdjustedRating(minRating);
            this.updateTable(coffeeLoader, minRating);
        });
        
        filterDiv.appendChild(ratingFilter);
    }

    createCoffeeTable(coffeeLoader) {
        const tableDiv = document.querySelector('.flex_item.table');

        // Create table container
        const tableContainer = document.createElement('div');
        tableContainer.className = 'table-container';
        tableContainer.style.maxHeight = '70vh';
        tableContainer.style.overflowY = 'auto';
        tableContainer.style.border = '1px solid #ccc';
        tableContainer.style.borderRadius = '10px';
        tableContainer.style.padding = '10px';

        // Create table
        const table = document.createElement('table');
        table.className = 'coffee-table';
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';

        // Sort state
        let sortColumn = 'adjustedRating';
        let sortDirection = 'desc';

        // Column definitions
        const columns = [
            { key: 'name', label: 'Name', align: 'left', isNumeric: false },
            { key: 'rating', label: 'User Rating', align: 'center', isNumeric: true },
            { key: 'ratingCount', label: '# Ratings', align: 'center', isNumeric: true },
            { key: 'adjustedRating', label: 'Adjusted Rating', align: 'center', isNumeric: true }
        ];

        // Create header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        columns.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col.label;
            th.style.padding = '8px';
            th.style.borderBottom = '2px solid #65451F';
            th.style.textAlign = col.align;
            th.style.color = '#65451F';
            th.style.cursor = 'pointer';
            th.addEventListener('click', () => {
                if (sortColumn === col.key) {
                    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    sortColumn = col.key;
                    sortDirection = col.isNumeric ? 'desc' : 'asc';
                }
                renderRows();
                updateHeaderSortIndicators();
            });
            th.setAttribute('data-sort-key', col.key);
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        // Add sort indicators
        function updateHeaderSortIndicators() {
            headerRow.querySelectorAll('th').forEach(th => {
                const col = columns.find(c => c.key === th.getAttribute('data-sort-key'));
                let label = col.label;
                if (th.getAttribute('data-sort-key') === sortColumn) {
                    label += sortDirection === 'asc' ? ' <span style="font-size:12px">&#9650;</span>' : ' <span style="font-size:12px">&#9660;</span>';
                }
                th.innerHTML = label;
            });
        }

        // Create body
        const tbody = document.createElement('tbody');

        function renderRows() {
            tbody.innerHTML = '';
            let sortedShops = [...coffeeLoader.coffeeShops];
            sortedShops.sort((a, b) => {
                let aVal = a[sortColumn];
                let bVal = b[sortColumn];
                if (sortColumn === 'name') {
                    aVal = aVal.toLowerCase();
                    bVal = bVal.toLowerCase();
                } else {
                    aVal = Number(aVal);
                    bVal = Number(bVal);
                }
                if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
            sortedShops.forEach((shop, index) => {
                const row = document.createElement('tr');
                row.style.cursor = 'pointer';
                row.style.borderBottom = '1px solid #eee';
                // Name as clickable URL
                const nameCell = `<a href="${shop.placeUri}" target="_blank" style="color: #65451F; text-decoration: underline;">${shop.name}</a>`;
                // User rating (raw number)
                const userRatingCell = (shop.rating !== undefined && shop.rating !== null && !isNaN(shop.rating)) ? shop.rating : '';
                // User rating count
                const userRatingCountCell = `${shop.ratingCount || ''}`;
                // Adjusted rating with stars and two decimals
                const adjustedRatingCell = coffeeLoader.createStarRating(shop.adjustedRating);
                row.innerHTML = `
                    <td style="padding: 8px; font-size: 12px;">${nameCell}</td>
                    <td style="padding: 8px; text-align: center; font-size: 14px;">${userRatingCell}</td>
                    <td style="padding: 8px; text-align: center; font-size: 14px;">${userRatingCountCell}</td>
                    <td style="padding: 8px; text-align: center; font-size: 14px;">${adjustedRatingCell}</td>
                `;
                // Add hover effect
                row.addEventListener('mouseenter', () => {
                    row.style.backgroundColor = '#f5f5f5';
                });
                row.addEventListener('mouseleave', () => {
                    row.style.backgroundColor = '';
                });
                // Add click to zoom to location on map
                row.addEventListener('click', () => {
                    if (window.map) {
                        window.map.setView([shop.latitude, shop.longitude], 16);
                        // Find and open the popup for this shop, and set icon to custom icon for current zoom
                        const currentZoom = window.map.getZoom();
                        const newIcon = coffeeLoader && coffeeLoader.createCoffeeIcon ? coffeeLoader.createCoffeeIcon(currentZoom) : undefined;
                        coffeeLoader.markers.forEach(marker => {
                            const markerLatLng = marker.getLatLng();
                            if (Math.abs(markerLatLng.lat - shop.latitude) < 0.0001 && 
                                Math.abs(markerLatLng.lng - shop.longitude) < 0.0001) {
                                if (newIcon) marker.setIcon(newIcon);
                                marker.openPopup();
                            }
                        });
                    }
                });
                tbody.appendChild(row);
            });
        }

        renderRows();
        updateHeaderSortIndicators();

        table.appendChild(thead);
        table.appendChild(tbody);
        tableContainer.appendChild(table);
        tableDiv.appendChild(tableContainer);

        // Store reference for updates
        this.tableContainer = tableContainer;
        this.coffeeLoader = coffeeLoader;
    }

    updateTable(coffeeLoader, minRating = 0) {
        const tbody = this.tableContainer.querySelector('tbody');
        tbody.innerHTML = '';
        
        // Filter and sort coffee shops
        const filteredShops = coffeeLoader.coffeeShops
            .filter(shop => shop.adjustedRating >= minRating)
                .sort((a, b) => b.adjustedRating - a.adjustedRating);
        
        // Add rows for all filtered coffee shops
        filteredShops.forEach((shop, index) => {
            const row = document.createElement('tr');
            row.style.cursor = 'pointer';
            row.style.borderBottom = '1px solid #eee';
            // Name as clickable URL
            const nameCell = `<a href="${shop.placeUri}" target="_blank" style="color: #65451F; text-decoration: underline;">${shop.name}</a>`;
            // User rating (raw number)
            const userRatingCell = (shop.rating !== undefined && shop.rating !== null && !isNaN(shop.rating)) ? shop.rating : '';
            // User rating count
            const userRatingCountCell = `${shop.ratingCount || ''}`;
            // Adjusted rating with stars and two decimals
            const adjustedRatingCell = coffeeLoader.createStarRating(shop.adjustedRating);
            row.innerHTML = `
                <td style="padding: 8px; font-size: 12px;">${nameCell}</td>
                <td style="padding: 8px; text-align: center; font-size: 14px;">${userRatingCell}</td>
                <td style="padding: 8px; text-align: center; font-size: 14px;">${userRatingCountCell}</td>
                <td style="padding: 8px; text-align: center; font-size: 14px;">${adjustedRatingCell}</td>
            `;
            
            // Add hover effect
            row.addEventListener('mouseenter', () => {
                row.style.backgroundColor = '#f5f5f5';
            });
            row.addEventListener('mouseleave', () => {
                row.style.backgroundColor = '';
            });
            
            // Add click to zoom to location on map
            row.addEventListener('click', () => {
                if (window.map) {
                    window.map.setView([shop.latitude, shop.longitude], 16);
                    
                    // Find and open the popup for this shop
                    coffeeLoader.markers.forEach(marker => {
                        const markerLatLng = marker.getLatLng();
                        if (Math.abs(markerLatLng.lat - shop.latitude) < 0.0001 && 
                            Math.abs(markerLatLng.lng - shop.longitude) < 0.0001) {
                            marker.openPopup();
                        }
                    });
                }
            });
            
            tbody.appendChild(row);
        });
    }

    animateCoffeeBeans() {
        const beans = ['bean1', 'bean2', 'bean3'];
        const timing = [500, 1000, 1500]; // Show beans at 0.5s, 1s, and 1.5s

        beans.forEach((beanId, index) => {
            setTimeout(() => {
                const bean = document.getElementById(beanId);
                if (bean) {
                    bean.classList.add('visible');
                }
            }, timing[index]);
        });
    }

    hideLoadingScreen() {
        this.loadingScreen.classList.add('hide');
        this.mainContent.classList.remove('hidden');
        
        // Remove loading screen from DOM after animation
        setTimeout(() => {
            this.loadingScreen.style.display = 'none';
        }, 800);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const loadingController = new LoadingController();
    loadingController.initializeApp();
});
