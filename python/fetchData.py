from google.oauth2 import service_account
import os
from dotenv import load_dotenv
import requests
import json
from datetime import datetime

# Load environment variables from .env file
load_dotenv()

# google places API credentials
creds = os.getenv('GOOGLE_PLACES_API_KEY')
if not creds:
    raise ValueError("GOOGLE_PLACES_API_KEY environment variable not set")
else:
    print("The key is loaded")
    

URL = "https://places.googleapis.com/v1/places:searchText"

# Set up headers with API key
headers = {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": creds,
    "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.googleMapsLinks,places.primaryType,places.regularOpeningHours"
}

# Request body for the new Places API
data = {
    "textQuery": "coffee",
    "openNow": True,
}

results = requests.post(URL, headers=headers, json=data)

print(f"Status code: {results.status_code}")

# Generate timestamp for filename
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

# Create data directory if it doesn't exist
data_dir = os.path.join("..", "data")
os.makedirs(data_dir, exist_ok=True)

# Print the absolute path for debugging
print(f"📁 Data directory: {os.path.abspath(data_dir)}")

if results.status_code == 200:
    response_data = results.json()
    print("Response:", response_data)
    
    # Save successful response to JSON file in data directory
    filename = os.path.join(data_dir, f"coffee_shops_response_{timestamp}.json")
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(response_data, f, indent=2, ensure_ascii=False)
    print(f"✅ Response saved to: {os.path.abspath(filename)}")
    
else:
    print(f"Error: {results.status_code}")
    print("Response:", results.text)
    
    # Save error response to JSON file in data directory
    error_data = {
        "status_code": results.status_code,
        "error_text": results.text,
        "timestamp": timestamp,
        "request_data": data,
        "request_headers": {k: v if k != "X-Goog-Api-Key" else "***HIDDEN***" for k, v in headers.items()}
    }
    
    filename = os.path.join(data_dir, f"coffee_shops_error_{timestamp}.json")
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(error_data, f, indent=2, ensure_ascii=False)
    print(f"❌ Error response saved to: {os.path.abspath(filename)}")
    



