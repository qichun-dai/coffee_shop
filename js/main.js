import { getLocations } from './get_locations.js';


coffee = getLocations().catch(error => console.error('Error:', error));

console.log(coffee);

document.addEventListener("DOMContentLoaded", function() {
    // The Google Places API endpoint (adjust this based on your backend proxy)
    const baseUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json?';

    // Your API key (be cautious about exposing this in client-side code!)
    const apiKey = 'AIzaSyASYqIg0LimDB_uaDTsN9sbnjqFXUHK8sI';

    function searchPlaces(query) {
        const url = `${baseUrl}query=${encodeURIComponent(query)}&key=${apiKey}`;

        // Using Fetch API to make the request
        fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            renderPlaces(data.results);
        })
        .catch(error => {
            console.error('Error fetching places:', error);
        });
    }

    function renderPlaces(places) {
        const chartArea = document.getElementById('chart-area');
        chartArea.innerHTML = ''; // Clear previous results

        places.forEach(place => {
            const placeDiv = document.createElement('div');
            placeDiv.innerText = place.name;
            chartArea.appendChild(placeDiv);
        });
    }

    // Fetching coffee places in New York for this example
    searchPlaces('coffee shops in New York');
});

