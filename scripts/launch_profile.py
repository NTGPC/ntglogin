# launch_profile.py
# Python Selenium wrapper for launching browser with fingerprint injection
# Usage: python scripts/launch_profile.py profiles/{id}.json

import json
import os
import sys
import time
import secrets

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities

CHROMEDRIVER_PATH = "chromedriver"  # path to chromedriver or binary in PATH
INJECT_JS_PATH = os.path.join(os.path.dirname(__file__), "inject_before_load.js")  # ensure this file exists


def load_profile(profile_path):
    """Load profile JSON from file"""
    with open(profile_path, "r", encoding="utf-8") as f:
        return json.load(f)


def build_inject_script(profile):
    """Build injection script with profile data embedded"""
    # Load base script
    if not os.path.exists(INJECT_JS_PATH):
        print(f"Warning: {INJECT_JS_PATH} not found. Using inline script.")
        # Fallback: use minimal script
        profile_json = json.dumps(profile)
        return f"window.__INJECTED_FINGERPRINT__ = {profile_json};"
    
    with open(INJECT_JS_PATH, "r", encoding="utf-8") as f:
        base = f.read()
    
    # We want the script to see window.__INJECTED_FINGERPRINT__ or window.__PROFILE__
    # Replace placeholder by injecting a snippet at top that sets window.__INJECTED_FINGERPRINT__
    profile_json = json.dumps(profile)
    prefix = f"window.__INJECTED_FINGERPRINT__ = {profile_json};\n"
    return prefix + "\n" + base


def launch(profile, headless=False):
    """Launch Chrome with profile configuration"""
    chrome_opts = Options()
    
    if profile.get("ua"):
        chrome_opts.add_argument(f"--user-agent={profile['ua']}")
    
    # window size
    w = profile.get("screen", {}).get("width", 1920)
    h = profile.get("screen", {}).get("height", 1080)
    chrome_opts.add_argument(f"--window-size={w},{h}")
    
    # per-profile user-data-dir for persistence & isolation
    profile_name = profile.get("name") or f"profile_{secrets.token_hex(4)}"
    user_data_dir = os.path.abspath(os.path.join("user_data", profile_name))
    os.makedirs(user_data_dir, exist_ok=True)
    chrome_opts.add_argument(f"--user-data-dir={user_data_dir}")
    
    # reduce webdriver flags
    chrome_opts.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_opts.add_experimental_option("useAutomationExtension", False)
    chrome_opts.add_argument("--disable-blink-features=AutomationControlled")
    
    # WebGL/GPU renderer masking at system level (ép WebGL dùng SwiftShader)
    # Check if profile wants to use SwiftShader renderer
    use_swiftshader = profile.get("webgl", {}).get("useSwiftShader", False)
    if use_swiftshader:
        chrome_opts.add_argument("--use-gl=swiftshader")          # ép WebGL dùng SwiftShader
        chrome_opts.add_argument("--use-angle=swiftshader")       # ANGLE -> swiftshader
        chrome_opts.add_argument("--disable-software-rasterizer=false")
        # Optional: chrome_opts.add_argument("--gpu-rasterization-msaa-sample-count=0")
    
    if headless:
        chrome_opts.add_argument("--headless=new")
        chrome_opts.add_argument("--hide-scrollbars")
    
    service = Service(CHROMEDRIVER_PATH)
    caps = DesiredCapabilities.CHROME.copy()
    driver = webdriver.Chrome(service=service, options=chrome_opts, desired_capabilities=caps)
    
    # Build injection script with profile injected
    inject_script = build_inject_script(profile)
    
    # Add script to evaluate on new document (before any page script)
    try:
        driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {"source": inject_script})
    except Exception as e:
        print("CDP injection failed:", e)
        driver.quit()
        raise
    
    return driver


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/launch_profile.py path/to/profile.json")
        print("Example: python scripts/launch_profile.py profiles/1.json")
        sys.exit(1)
    
    profile_path = sys.argv[1]
    
    if not os.path.exists(profile_path):
        print(f"Error: Profile file not found: {profile_path}")
        sys.exit(1)
    
    profile = load_profile(profile_path)
    print("Launching profile:", profile.get("name", "unnamed"))
    
    driver = launch(profile, headless=False)
    
    try:
        # test page
        test_url = profile.get("test_url", "https://pixelscan.net/fingerprint-check")
        print(f"Navigating to: {test_url}")
        driver.get(test_url)
        time.sleep(4)
        
        # get injected info back
        try:
            injected = driver.execute_script("return window.__INJECTED_FINGERPRINT__ || null;")
            print("Injected fingerprint (client-side):", json.dumps(injected, indent=2))
        except Exception as e:
            print("Could not retrieve injected object:", e)
        
        print("Browser will stay open for 8 seconds...")
        time.sleep(8)
    finally:
        driver.quit()
        print("Browser closed.")

