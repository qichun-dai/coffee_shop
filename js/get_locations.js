const fetch = import('node-fetch').then(fetch => fetch.default || fetch);

export async function getLocations() {
    const fetch = (await import('node-fetch')).default;

    const apiKey = 'AIzaSyASYqIg0LimDB_uaDTsN9sbnjqFXUHK8sI'; // Replace with your API key
    const placeId = 'ChIJ_xnMsItvxkcRqLpRsJroePE'; // Replace with the place ID you want to look up

    const response = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?placeid=${placeId}&key=${apiKey}`);
    const data = await response.json();
    console.log(data);
}

coffee = getLocations().catch(error => console.error('Error:', error));

console.log(coffee);