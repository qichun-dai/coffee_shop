import pandas as pd
import json
import os

coffee_file = os.path.join(".", "data", "coffee_shops_response_20250801_182000.json")

with open(coffee_file, mode="r", encoding='utf-8') as file:
    coffee_raw = json.load(file)
    
print(coffee_raw["places"][1])

# Method 2: Collect all data first, then create DataFrame (most efficient)
data_list = []

for coffee in coffee_raw["places"]:
    displayName = coffee["displayName"]["text"]
    rating = coffee["rating"]
    userRatingCount = coffee["userRatingCount"]
    primaryType = coffee["primaryType"]
    placeUri = coffee["googleMapsLinks"]["placeUri"]
    address = coffee["formattedAddress"]
    latitude = coffee["location"]["latitude"]
    longitude = coffee["location"]["longitude"]
    
    # Clean up weekday descriptions - join list and normalize Unicode characters
    weekday_raw = coffee["regularOpeningHours"]["weekdayDescriptions"]
    # Join the list with newlines and normalize Unicode characters
    weekday_clean = "\n".join(weekday_raw)
    # Replace Unicode spaces and dashes with regular ones
    weekday_clean = weekday_clean.replace('\u202f', ' ')  # Narrow no-break space
    weekday_clean = weekday_clean.replace('\u2009', ' ')  # Thin space
    weekday_clean = weekday_clean.replace('\u2013', '-')  # En dash
    weekday_clean = weekday_clean.replace('\u2014', '-')  # Em dash
    
    # Add each record as a dictionary to the list
    data_list.append({
        "displayName": displayName,
        "rating": rating,
        "userRatingCount": userRatingCount,
        "primaryType": primaryType,
        "placeUri": placeUri,
        "address": address,
        "latitude": latitude,
        "longitude": longitude,
        "weekdayDescriptions": weekday_clean
    })
    
    


# Create DataFrame from the list of dictionaries
coffee_final = pd.DataFrame(data_list)

print(f"DataFrame shape: {coffee_final.shape}")
print("\nDataFrame head:")
print(coffee_final.head())

# Save to CSV with proper Unicode handling
output_file = os.path.join(".", "data", "coffee_shops_processed.csv")
coffee_final.to_csv(output_file, index=False, encoding='utf-8-sig', escapechar=None, quoting=1)
print(f"\n✅ DataFrame saved to: {os.path.abspath(output_file)}")
  