from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import os
import pandas as pd
from datetime import datetime
import math

timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
# csv file location
CSV_LOCATION = os.path.join(".","data","coffee_shops_processed_20250813_114829.csv")

CSV_LOCATION_NEW = os.path.join(".","data",f"coffee_shops_stars_{timestamp}.csv")

CSV_LOCATION_NEW2 = os.path.join(".","data",f"coffee_shops_stars2_{timestamp}.csv")

# Target all aria-label elements in the specific table
# rating and reviews xpath, the xpath doesn't work all the time, so I switched to CSS selector
# table_xpath = "/html/body/div[1]/div[3]/div[8]/div[9]/div/div/div[1]/div[2]/div/div[1]/div/div/div[38]/div/div[1]/table/tbody"


# Read the coffee places from a csv file
with open(CSV_LOCATION,encoding="utf-8",mode="r") as file:
    coffees = pd.read_csv(file)
    

def reject_cookies():
    # Use Chrome options to keep browser open
    chrome_options = webdriver.ChromeOptions()
    
    # Essential options for stability
    chrome_options.add_argument("--no-sandbox")  # Bypass OS security model
    chrome_options.add_argument("--disable-dev-shm-usage")  # Overcome limited resource problems
    chrome_options.add_argument("--disable-gpu")  # Disable GPU acceleration
    chrome_options.add_argument("--remote-debugging-port=9222")  # Enable remote debugging
    chrome_options.add_argument("--disable-web-security")
    chrome_options.add_argument("--disable-features=VizDisplayCompositor")
    
    # Window management
    chrome_options.add_argument("--start-maximized")
    chrome_options.add_experimental_option("detach", True)  # Keep browser open after script ends
    
    # Logging suppression
    chrome_options.add_argument("--log-level=3")  # Suppress INFO, WARNING, ERROR logs
    chrome_options.add_argument("--disable-logging")
    chrome_options.add_argument("--silent")
    
    # Performance optimizations
    chrome_options.add_argument("--disable-background-timer-throttling")
    chrome_options.add_argument("--disable-backgrounding-occluded-windows")
    chrome_options.add_argument("--disable-renderer-backgrounding")
    chrome_options.add_argument("--disable-background-networking")
    chrome_options.add_argument("--disable-sync")  # Disable Google account sync
    chrome_options.add_argument("--disable-default-apps")
    chrome_options.add_argument("--disable-extensions")
    
    # Disable problematic features
    chrome_options.add_argument("--disable-features=TranslateUI")
    chrome_options.add_argument("--disable-machine-learning")
    chrome_options.add_argument("--disable-ml-model-service")
    chrome_options.add_argument("--disable-speech-api")
    chrome_options.add_argument("--disable-speech-synthesis-api")
    chrome_options.add_argument("--disable-voice-input")
    chrome_options.add_argument("--disable-features=VoiceInteraction")
    chrome_options.add_argument("--disable-features=VoiceSearchAudioCapturePolicy")
    chrome_options.add_argument("--disable-component-update")
    
    # Crash prevention
    chrome_options.add_argument("--disable-crash-reporter")
    chrome_options.add_argument("--disable-oopr-debug-crash-dump")
    chrome_options.add_argument("--no-crash-upload")
    chrome_options.add_argument("--disable-gpu-process-crash-limit")
    chrome_options.add_argument("--disable-ipc-flooding-protection")
    chrome_options.add_argument("--disable-gpu-sandbox")
    chrome_options.add_argument("--disable-software-rasterizer")
    chrome_options.add_argument("--disable-background-mode")
    chrome_options.add_argument("--disable-client-side-phishing-detection")

    # Set environment variables to suppress absl logging
    os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # Suppress TensorFlow logs
    os.environ['GLOG_minloglevel'] = '3'      # Suppress Google logging
    os.environ['PYTHONHTTPSVERIFY'] = '0'     # Suppress SSL warnings if any
    
    try:
        print("Starting Chrome browser...")
        driver = webdriver.Chrome(options=chrome_options)
        print("Chrome started successfully!")
        
        driver.get("https://maps.google.com")
        print("Navigated to Google Maps")

        # Wait for the page to load
        time.sleep(3)

        # First handle cookie consent if it appears
        try:
            reject_button = driver.find_element(By.XPATH, "//button[contains(normalize-space(), 'Alles afwijzen')]")
            print("Found cookie consent button!")
            reject_button.click()
            print("Clicked reject cookies button")
        except Exception as e:
            print(f"Cookie button not found (this is normal): {e}")
            
        return driver
        
    except Exception as e:
        print(f"Failed to start Chrome: {e}")
        print("Trying alternative Chrome configuration...")
        
        # Fallback configuration - minimal options
        chrome_options_fallback = webdriver.ChromeOptions()
        chrome_options_fallback.add_argument("--no-sandbox")
        chrome_options_fallback.add_argument("--disable-dev-shm-usage")
        chrome_options_fallback.add_argument("--remote-debugging-port=9223")  # Different port
        chrome_options_fallback.add_experimental_option("detach", True)
        
        try:
            driver = webdriver.Chrome(options=chrome_options_fallback)
            driver.get("https://maps.google.com")
            time.sleep(3)
            return driver
        except Exception as fallback_error:
            print(f"Fallback also failed: {fallback_error}")
            raise Exception("Unable to start Chrome browser with any configuration")



def finding_stars(row_index, link, driver):
    # Wait a bit more for the page to fully load after cookie consent

    driver.get(link)
    time.sleep(3)
    
    print(f"Processing row {row_index}: Searching for aria-label elements in the table...")

    # Initialize return dictionary with default values
    star_data = {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}

    try:
        
        # First, try to find the scrollable container using multiple approaches
        print("Looking for scrollable container...")
        wait = WebDriverWait(driver, 15)
        
        scrollable_element = None
        
        # Method 1: Try to find a common scrollable container
        try:
            scrollable_element = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "[role='main'], .m6QErb, .siAUzd")))
            print("Found scrollable container using CSS selector")
        except:
            # Method 2: Fallback to original XPath
            try:
                scrollable = "/html/body/div[1]/div[3]/div[8]/div[9]/div/div/div[1]/div[2]/div/div[1]"
                scrollable_element = wait.until(EC.presence_of_element_located((By.XPATH, scrollable)))
                print("Found scrollable container using XPath fallback")
            except:
                # Method 3: Try to scroll the whole body
                scrollable_element = driver.find_element(By.TAG_NAME, "body")
                print("Using body element for scrolling")
        
        if scrollable_element:
            print("Scrolling down to load all rating elements...")
            
            # Method 2: Scroll to the bottom of the element
            driver.execute_script("arguments[0].scrollTop = arguments[0].scrollHeight;", scrollable_element)
            time.sleep(3)  # Wait longer for content to load after scrolling
            
            # Additional scroll attempts to ensure everything loads
            for i in range(3):
                driver.execute_script("arguments[0].scrollTop += 500;", scrollable_element)
                time.sleep(1)
                print(f"Additional scroll {i+1}")
        
        print("Finished scrolling, waiting for content to load...")
        
        # Wait for the ratings table to be present using CSS selector
        wait = WebDriverWait(driver, 15)
        
        # Wait for the div with class ExlQHd to be present
        ratings_container = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "div.ExlQHd")))
        print("Found ratings container with class 'ExlQHd'")
        
        # Find all <tr> elements with aria-label within the ratings container
        aria_elements = ratings_container.find_elements(By.CSS_SELECTOR, "tr[aria-label]")
        print(f"Found {len(aria_elements)} tr elements with aria-label in the ratings table")
        
        for i, element in enumerate(aria_elements):
            aria_label = element.get_attribute("aria-label")
            splited = aria_label.split(",")

            star = splited[0].split()[0]
            number = splited[1].split()[0]
            number = number.replace(".", "").replace(",", "")  # Remove dots and commas from numbers
            
            # Store data in dictionary instead of updating DataFrame immediately
            star_data[star] = int(number)
            print(f"Extracted - Star: {star}, Number: {number}")

        print(f"Row {row_index} star data: {star_data}")
        return star_data
            
    except Exception as e:
        print(f"Error finding aria-label elements for row {row_index}: {e}")
        return star_data  # Return default values (all zeros) if error occurs


def collect_all_star_data(coffees_df, driver):
    """
    Collect star rating data for all coffee shops and update DataFrame efficiently
    """
    print("Starting bulk star data collection...")
    
    # Initialize lists to store data for each star rating
    stars_5_list = []
    stars_4_list = []
    stars_3_list = []
    stars_2_list = []
    stars_1_list = []
    
    # Process each row and collect data
    for i, row in coffees_df.iterrows():
        print(f"\n--- Processing {i+1}/{len(coffees_df)} ---")
        
        try:
            star_data = finding_stars(i, row['placeUri'], driver)
            
            # Append data to respective lists
            stars_5_list.append(star_data["5"])
            stars_4_list.append(star_data["4"])
            stars_3_list.append(star_data["3"])
            stars_2_list.append(star_data["2"])
            stars_1_list.append(star_data["1"])
            
            # Optional: Save progress every 10 rows
            if (i + 1) % 10 == 0:
                print(f"Processed {i+1} rows so far...")
                
        except Exception as e:
            print(f"Error processing row {i}: {e}")
            # Add zeros for failed rows
            stars_5_list.append(0)
            stars_4_list.append(0)
            stars_3_list.append(0)
            stars_2_list.append(0)
            stars_1_list.append(0)
    
    # Update DataFrame columns in bulk (much more efficient!)
    print("\nUpdating DataFrame with collected data...")
    coffees_df["5"] = stars_5_list
    coffees_df["4"] = stars_4_list
    coffees_df["3"] = stars_3_list
    coffees_df["2"] = stars_2_list
    coffees_df["1"] = stars_1_list
    
    print("Bulk update completed!")
    return coffees_df
        

def sort_beyasian(coffees):
    beyasian_rating = []
    for i, coffee in coffees.iterrows():
        try:
            #  https://www.evanmiller.org/ranking-items-with-star-ratings.html
            N = coffee["userRatingCount"]
            K = 5
            z = 1.65
            nk = [coffee["5"],coffee["4"],coffee["3"],coffee["2"],coffee["1"]]
    
            sk = range(K,0,-1)
            sk2 = [each**2 for each in sk]
            def f(sk,nk):
                return sum(sk*(nk+1) for sk, nk in zip(sk,nk))/(N+K)
            fsum = f(sk,nk)
            beyasian_rating.append(fsum -z * math.sqrt((f(sk2,nk)-fsum**2)/(N+K+1)))
        except Exception as e:
            print(e)
            beyasian_rating.append("")
    return beyasian_rating
        
        
    
driver = reject_cookies()
coffees = collect_all_star_data(coffees, driver)
driver.close()

coffees.to_csv(CSV_LOCATION_NEW, index=False, encoding='utf-8')

# running the Bayesian calculation on existing data
adjustedRating = sort_beyasian(coffees)
coffees["adjustedRating"] = adjustedRating

coffees.to_csv(CSV_LOCATION_NEW2, index=False, encoding='utf-8')
