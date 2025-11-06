# test_inject_check.py
# Quick test script to verify fingerprint injection (runs fast, prints to terminal - no DevTools needed)

import time
import sys
import os

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options

CHROMEDRIVER = "chromedriver"  # sửa nếu cần


def run_test():
    opts = Options()
    opts.add_experimental_option("excludeSwitches", ["enable-automation"])
    opts.add_experimental_option("useAutomationExtension", False)
    opts.add_argument("--disable-blink-features=AutomationControlled")

    # recommended flags to alter GPU layer (test)
    opts.add_argument("--use-gl=swiftshader")
    opts.add_argument("--use-angle=swiftshader")
    # opts.add_argument("--disable-gpu")  # uncomment to test disabling GPU

    # optional: set per-profile user-data-dir
    # opts.add_argument("--user-data-dir=./user_data/test1")

    service = Service(CHROMEDRIVER)
    driver = webdriver.Chrome(service=service, options=opts)

    # Load and inject fingerprint script
    inject_script_path = os.path.join(os.path.dirname(__file__), "inject_before_load.js")
    inject_script = ""
    
    if os.path.exists(inject_script_path):
        with open(inject_script_path, "r", encoding="utf-8") as f:
            inject_script = f.read()
    else:
        print(f"Warning: {inject_script_path} not found. Using minimal test script.")
        inject_script = "window.__INJECT_TEST__ = true; console.log('[TEST INJECT REGISTERED]');"

    # register inject script BEFORE navigation
    try:
        driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
            "source": inject_script
        })
        print("✅ CDP script registered successfully")
    except Exception as e:
        print(f"❌ CDP registration failed: {e}")
        driver.quit()
        return

    try:
        print("Navigating to test page...")
        driver.get("https://pixelscan.net/fingerprint-check")
        time.sleep(4)

        # Test 1: Check if fingerprint was injected
        injected = driver.execute_script("return !!window.__INJECTED_FINGERPRINT__ || !!window.__INJECT_TEST__")
        
        # Test 2: Check navigator.webdriver
        webdriver_flag = driver.execute_script("return !!navigator.webdriver")
        
        # Test 3: Check WebGL vendor/renderer
        webgl_info = driver.execute_script("""
        try{
          const c=document.createElement('canvas');
          const g=c.getContext('webgl')||c.getContext('webgl2');
          if(!g) return {gl:false};
          return { gl:true, vendor: g.getParameter(37445), renderer: g.getParameter(37446) };
        }catch(e){ return {err: String(e)} }
        """)
        
        # Test 4: Check OfflineAudioContext
        audio_hash = driver.execute_script("""
        try {
          // try compute audio offline hash presence by creating OfflineAudioContext
          const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
          if (!OAC) return { offline:false };
          const ctx = new OAC(1, 44100, 44100);
          const buf = ctx.createBuffer(1, 44100, 44100);
          // fill buffer quickly
          for (let i=0;i<buf.length;i++) buf.getChannelData(0)[i] = Math.sin(i);
          return { offline: true, startRenderingType: typeof ctx.startRendering };
        } catch(e){ return {err: String(e)} }
        """)
        
        # Test 5: Check canvas fingerprint
        canvas_test = driver.execute_script("""
        try {
          const c = document.createElement('canvas');
          const ctx = c.getContext('2d');
          if (!ctx) return { canvas: false };
          ctx.fillText('test', 10, 10);
          const dataURL = c.toDataURL();
          return { canvas: true, dataURLLength: dataURL.length };
        } catch(e) { return { err: String(e) } }
        """)
        
        # Test 6: Check navigator properties
        nav_props = driver.execute_script("""
        return {
          webdriver: navigator.webdriver,
          hardwareConcurrency: navigator.hardwareConcurrency,
          deviceMemory: navigator.deviceMemory,
          platform: navigator.platform,
          languages: navigator.languages
        };
        """)

        # Print results
        print("\n" + "="*60)
        print("FINGERPRINT INJECTION TEST RESULTS")
        print("="*60)
        print(f"✅ INJECTED: {injected}")
        print(f"✅ navigator.webdriver: {webdriver_flag} (should be False/undefined)")
        print(f"✅ WebGL vendor/renderer: {webgl_info}")
        print(f"✅ Audio/OfflineAudioContext: {audio_hash}")
        print(f"✅ Canvas: {canvas_test}")
        print(f"✅ Navigator properties: {nav_props}")
        print("="*60)
        
        # Summary
        print("\nSUMMARY:")
        if not webdriver_flag:
            print("✅ navigator.webdriver is hidden")
        else:
            print("❌ navigator.webdriver is still visible")
            
        if webgl_info.get('gl') and webgl_info.get('vendor'):
            vendor = webgl_info.get('vendor', '')
            if 'Poly' in vendor or 'Plastic' in vendor:
                print("✅ WebGL vendor is masked")
            else:
                print("⚠️  WebGL vendor might not be masked (check manually)")
        else:
            print("⚠️  WebGL not available or error")
            
        if audio_hash.get('offline'):
            print("✅ OfflineAudioContext is available")
        else:
            print("⚠️  OfflineAudioContext not available")
            
    except Exception as e:
        print(f"❌ Error during test: {e}")
        import traceback
        traceback.print_exc()
    finally:
        driver.quit()
        print("\n✅ Test completed. Browser closed.")


if __name__ == "__main__":
    run_test()

