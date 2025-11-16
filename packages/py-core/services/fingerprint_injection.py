"""
Build JavaScript injection code for fingerprint spoofing in Playwright.
Patches navigator.webdriver, user agent, canvas, webgl, media devices, etc.
"""
from typing import Dict, Any, Optional


def build_injection(fp: Dict[str, Any]) -> str:
    """
    Build JavaScript injection code from fingerprint dict.
    Args:
        fp: Dictionary with fingerprint data (user_agent, screen, canvas, webgl, etc.)
    Returns:
        JavaScript code string to inject via add_init_script
    """
    ua = fp.get("user_agent") or fp.get("userAgent") or "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    screen_width = fp.get("screen_width") or fp.get("screenWidth") or 1920
    screen_height = fp.get("screen_height") or fp.get("screenHeight") or 1080
    device_memory = fp.get("device_memory") or fp.get("deviceMemory") or 8
    hardware_concurrency = fp.get("hardware_concurrency") or fp.get("hardwareConcurrency") or 8
    
    canvas_hash = fp.get("canvas") or fp.get("canvas_hash")
    webgl_vendor = fp.get("webgl_vendor") or fp.get("webglVendor") or "Intel Inc."
    webgl_renderer = fp.get("webgl_renderer") or fp.get("webglRenderer") or "Intel Iris OpenGL Engine"
    
    os_name = fp.get("os") or fp.get("os_name") or ""
    os_arch = fp.get("arch") or fp.get("architecture") or "x64"
    os_lower = os_name.lower()
    
    if not fp.get("platform"):
        if "macos" in os_lower or "mac" in os_lower:
            platform = "MacIntel"
        elif "linux" in os_lower:
            platform = "Linux x86_64" if (os_arch == "x64" or os_arch == "x86_64") else "Linux i686"
        else:
            platform = "Win32"
    else:
        platform = fp.get("platform")
    language = fp.get("language") or "en-US"
    timezone = fp.get("timezone") or "America/New_York"
    
    plugins = fp.get("plugins") or []
    
    js_code = f"""
(() => {{
    // Remove webdriver flag
    Object.defineProperty(navigator, 'webdriver', {{
        get: () => false,
        configurable: true
    }});
    
    // Override user agent
    Object.defineProperty(navigator, 'userAgent', {{
        get: () => '{ua}',
        configurable: true
    }});
    
    Object.defineProperty(navigator, 'platform', {{
        get: () => '{platform}',
        configurable: true
    }});
    
    Object.defineProperty(navigator, 'language', {{
        get: () => '{language}',
        configurable: true
    }});
    
    // Screen dimensions
    Object.defineProperty(screen, 'width', {{
        get: () => {screen_width},
        configurable: true
    }});
    
    Object.defineProperty(screen, 'height', {{
        get: () => {screen_height},
        configurable: true
    }});
    
    Object.defineProperty(screen, 'availWidth', {{
        get: () => {screen_width},
        configurable: true
    }});
    
    Object.defineProperty(screen, 'availHeight', {{
        get: () => {screen_height - 40},
        configurable: true
    }});
    
    // Device memory
    if (navigator.deviceMemory !== undefined) {{
        Object.defineProperty(navigator, 'deviceMemory', {{
            get: () => {device_memory},
            configurable: true
        }});
    }}
    
    // Hardware concurrency
    Object.defineProperty(navigator, 'hardwareConcurrency', {{
        get: () => {hardware_concurrency},
        configurable: true
    }});
    
    // Timezone
    try {{
        Intl.DateTimeFormat().resolvedOptions().timeZone = '{timezone}';
    }} catch (e) {{}}
    
    // Canvas fingerprint spoofing
    if ({bool(canvas_hash)}) {{
        const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
        const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
        
        HTMLCanvasElement.prototype.toDataURL = function(type) {{
            const context = this.getContext('2d');
            if (context) {{
                const imageData = context.getImageData(0, 0, this.width, this.height);
                // Add subtle noise to canvas
                for (let i = 0; i < imageData.data.length; i += 4) {{
                    imageData.data[i] += Math.floor(Math.random() * 3) - 1;
                }}
                context.putImageData(imageData, 0, 0);
            }}
            return originalToDataURL.apply(this, arguments);
        }};
    }}
    
    // WebGL fingerprint spoofing
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {{
        if (parameter === 37445) {{ // UNMASKED_VENDOR_WEBGL
            return '{webgl_vendor}';
        }}
        if (parameter === 37446) {{ // UNMASKED_RENDERER_WEBGL
            return '{webgl_renderer}';
        }}
        return getParameter.apply(this, arguments);
    }};
    
    // Media devices stub (no real device enumeration)
    if (navigator.mediaDevices) {{
        const originalEnumerateDevices = navigator.mediaDevices.enumerateDevices;
        navigator.mediaDevices.enumerateDevices = function() {{
            return Promise.resolve([
                {{
                    deviceId: 'default',
                    kind: 'audioinput',
                    label: 'Default - Microphone',
                    groupId: 'group1'
                }},
                {{
                    deviceId: 'default',
                    kind: 'audiooutput',
                    label: 'Default - Speaker',
                    groupId: 'group2'
                }},
                {{
                    deviceId: 'default',
                    kind: 'videoinput',
                    label: 'Default - Camera',
                    groupId: 'group3'
                }}
            ]);
        }};
    }}
    
    // Plugins spoofing
    Object.defineProperty(navigator, 'plugins', {{
        get: () => {{
            const pluginArray = [];
            const pluginList = {json.dumps(plugins) if plugins else '[]'};
            pluginList.forEach(p => {{
                pluginArray.push({{
                    name: p.name || 'Chrome PDF Plugin',
                    description: p.description || 'Portable Document Format',
                    filename: p.filename || 'internal-pdf-viewer',
                    length: p.mimeTypes ? p.mimeTypes.length : 0
                }});
            }});
            return pluginArray;
        }},
        configurable: true
    }});
    
    // Permissions API
    if (navigator.permissions) {{
        const originalQuery = navigator.permissions.query;
        navigator.permissions.query = function(parameters) {{
            return originalQuery.apply(this, arguments).then(result => {{
                if (parameters.name === 'notifications') {{
                    Object.defineProperty(result, 'state', {{
                        get: () => 'prompt',
                        configurable: true
                    }});
                }}
                return result;
            }});
        }};
    }}
}})();
"""
    return js_code.strip()


def get_default_fingerprint() -> Dict[str, Any]:
    """Get default fingerprint values."""
    return {
        "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "screen_width": 1920,
        "screen_height": 1080,
        "device_memory": 8,
        "hardware_concurrency": 8,
        "platform": "Win32",
        "os": "Windows 10",
        "language": "en-US",
        "timezone": "America/New_York",
        "webgl_vendor": "Intel Inc.",
        "webgl_renderer": "Intel Iris OpenGL Engine",
        "plugins": []
    }

