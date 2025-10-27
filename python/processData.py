import pandas as pd
import json
import os
from datetime import datetime
from dateutil import tz

coffee_file = os.path.join(".", "data", "coffee_shops_response_20251021_162227.json")

with open(coffee_file, mode="r", encoding='utf-8') as file:
    coffee_raw = json.load(file)
    
print(coffee_raw["places"][1])

data_list = []

for coffee in coffee_raw["places"]:
    # Helper function to safely get nested values
    def safe_get(data, *keys, default=""):
        """Safely get nested dictionary values with fallback to default"""
        try:
            for key in keys:
                data = data[key]
            return data if data is not None else default
        except (KeyError, TypeError):
            return default
    
    # Extract fields with safe fallbacks
    displayName = safe_get(coffee, "displayName", "text", default="")
    rating = safe_get(coffee, "rating", default=0.0)
    userRatingCount = safe_get(coffee, "userRatingCount", default=0)
    primaryType = safe_get(coffee, "primaryType", default="")
    placeUri = safe_get(coffee, "googleMapsLinks", "placeUri", default="")
    address = safe_get(coffee, "formattedAddress", default="")
    latitude = safe_get(coffee, "location", "latitude", default=0.0)
    longitude = safe_get(coffee, "location", "longitude", default=0.0)
    nextCloseTime = safe_get(coffee,"regularOpeningHours","nextCloseTime", default="")
    neighborhood = safe_get(coffee,"neighborhood", default="")
    
    # Debug: Print if primaryType is missing or unusual
    if primaryType == "unknown":
        print(f"⚠️  Missing primaryType for: {displayName} - Available keys: {list(coffee.keys())}")
    
    # Clean up weekday descriptions with error handling
    weekday_clean = ""
    try:
        weekday_raw = safe_get(coffee, "regularOpeningHours", "weekdayDescriptions", default=[])
        if weekday_raw and isinstance(weekday_raw, list):
            # Join the list with newlines and normalize Unicode characters
            weekday_clean = "\n".join(str(day) for day in weekday_raw)
            # Replace Unicode spaces and dashes with regular ones
            weekday_clean = weekday_clean.replace('\u202f', ' ')  # Narrow no-break space
            weekday_clean = weekday_clean.replace('\u2009', ' ')  # Thin space
            weekday_clean = weekday_clean.replace('\u2013', '-')  # En dash
            weekday_clean = weekday_clean.replace('\u2014', '-')  # Em dash
    except Exception as e:
        print(f"Warning: Could not process weekday descriptions for {displayName}: {e}")
        weekday_clean = ""
    
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
        "weekdayDescriptions": weekday_clean,
        "nextCloseTime": nextCloseTime,
        "neighborhood": neighborhood,
    })
    
 
# convert to local time
def get_local_hour(utc_time_str):
    """Simple conversion to local system timezone"""
    try:
        if not utc_time_str or utc_time_str == "":
            return None
            
        # Parse UTC time
        if isinstance(utc_time_str, str):
            if utc_time_str.endswith('Z'):
                utc_time = datetime.fromisoformat(utc_time_str.replace('Z', '+00:00'))
            else:
                utc_time = datetime.fromisoformat(utc_time_str)
        else:
            return None
            
        # Convert to local system timezone
        local_time = utc_time.astimezone(tz.tzlocal())
        return local_time.hour
        
    except Exception as e:
        print(f"Error processing time {utc_time_str}: {e}")
        return None

# Create DataFrame from the list of dictionaries
coffee_final = pd.DataFrame(data_list)
# TO-DO: Filter out coffee places that opens after 11 pm
coffee_final["nextCloseHour"] = coffee_final["nextCloseTime"].apply(get_local_hour)
coffee_final["trueCoffee"] =  (
    ((coffee_final["nextCloseHour"] <= 23) & (coffee_final["nextCloseHour"] >= 5)) | coffee_final["nextCloseHour"].isna()
).astype(int)

# Drop duplicates ignoring the neighborhood column, keeping the first occurrence
duplicate_columns = [col for col in coffee_final.columns if col != 'neighborhood']
coffee_final = coffee_final.drop_duplicates(subset=duplicate_columns, keep='first')


print(f"DataFrame shape: {coffee_final.shape}")
print("\nDataFrame head:")
print(coffee_final.head())

# Save to CSV with proper Unicode handling
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
output_file = os.path.join(".", "data", f"coffee_shops_processed_{timestamp}.csv")
coffee_final.to_csv(output_file, index=False, encoding='utf-8-sig', escapechar=None, quoting=1)
print(f"\n✅ DataFrame saved to: {os.path.abspath(output_file)}")
  