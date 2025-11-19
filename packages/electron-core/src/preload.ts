import { contextBridge, ipcRenderer } from 'electron'

interface FingerprintConfig {
  profileId: number
  userAgent?: string
  platform?: string
  hardwareConcurrency?: number
  deviceMemory?: number
  languages?: string[]
  screenWidth?: number
  screenHeight?: number
  colorDepth?: number
  pixelRatio?: number
  webglVendor?: string
  webglRenderer?: string
  canvasMode?: string
  audioContextMode?: string
  webrtcMode?: string
  geolocationMode?: string
  geolocationLatitude?: number
  geolocationLongitude?: number
  timezone?: string
}

let fingerprintConfig: FingerprintConfig | null = null

// Listen for fingerprint config from main process
ipcRenderer.on('fingerprint-config', (_event, config: FingerprintConfig) => {
  fingerprintConfig = config
  applyFingerprint(config)
})

function applyFingerprint(config: FingerprintConfig) {
  console.log('[Preload] Applying fingerprint for profile', config.profileId)
  
  const seed = config.profileId || 12345
  
  // Request injection script from main process via IPC
  ipcRenderer.invoke('get-injection-script').then((injectionScript: string) => {
    if (injectionScript) {
      // Replace placeholders
      const replacements: Record<string, string> = {
        '__USER_AGENT__': config.userAgent || navigator.userAgent,
        '__PLATFORM__': config.platform || 'Win32',
        '__HARDWARE_CONCURRENCY__': String(config.hardwareConcurrency || 8),
        '__DEVICE_MEMORY__': String(config.deviceMemory || 8),
        '__LANGUAGES__': JSON.stringify(config.languages || ['en-US', 'en']),
        '__LANGUAGE__': config.languages?.[0] || 'en-US',
        '__SCREEN_WIDTH__': String(config.screenWidth || 1920),
        '__SCREEN_HEIGHT__': String(config.screenHeight || 1080),
        '__SCREEN_AVAIL_WIDTH__': String(config.screenWidth || 1920),
        '__SCREEN_AVAIL_HEIGHT__': String((config.screenHeight || 1080) - 40),
        '__SCREEN_COLOR_DEPTH__': String(config.colorDepth || 24),
        '__SCREEN_PIXEL_DEPTH__': String(config.colorDepth || 24),
        '__DEVICE_PIXEL_RATIO__': String(config.pixelRatio || 1.0),
        '__WEBGL_VENDOR__': config.webglVendor || 'Intel Inc.',
        '__WEBGL_RENDERER__': config.webglRenderer || 'Intel Iris OpenGL Engine',
        '__CANVAS_MODE__': config.canvasMode || 'noise',
        '__CANVAS_SEED__': String(seed),
        '__AUDIO_CONTEXT_MODE__': config.audioContextMode || 'noise',
        '__AUDIO_SEED__': String(seed),
        '__CLIENT_RECTS_MODE__': 'off',
        '__GEO_ENABLED__': config.geolocationMode === 'fake' ? 'true' : 'false',
        '__GEO_LAT__': String(config.geolocationLatitude || 10.762622),
        '__GEO_LON__': String(config.geolocationLongitude || 106.660172),
        '__WEBRTC_USE_MAIN_IP__': config.webrtcMode === 'fake' ? 'true' : 'false',
        '__TIMEZONE__': config.timezone || 'Europe/London',
        '__SEED__': String(seed),
      }
      
      for (const [placeholder, value] of Object.entries(replacements)) {
        injectionScript = injectionScript.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value)
      }
      
      // Execute injection script
      try {
        eval(injectionScript)
        console.log('[Preload] ✅ Injection script executed successfully')
      } catch (error) {
        console.error('[Preload] ❌ Failed to execute injection script:', error)
      }
    }
  }).catch((error) => {
    console.error('[Preload] Failed to load injection script:', error)
    // Fallback to basic fingerprint
    applyBasicFingerprint(config)
  })
  
  // Apply basic fingerprint immediately (before script loads)
  applyBasicFingerprint(config)
}

function applyBasicFingerprint(config: FingerprintConfig) {
  // Navigator properties
  if (config.platform) {
    Object.defineProperty(navigator, 'platform', {
      get: () => config.platform,
      configurable: true,
    })
  }

  if (config.hardwareConcurrency) {
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      get: () => config.hardwareConcurrency,
      configurable: true,
    })
  }

  if (config.deviceMemory) {
    Object.defineProperty(navigator, 'deviceMemory', {
      get: () => config.deviceMemory,
      configurable: true,
    })
  }

  if (config.languages) {
    Object.defineProperty(navigator, 'languages', {
      get: () => config.languages,
      configurable: true,
    })
    Object.defineProperty(navigator, 'language', {
      get: () => config.languages?.[0] || 'en-US',
      configurable: true,
    })
  }

  // Screen properties
  if (config.screenWidth && config.screenHeight) {
    Object.defineProperty(screen, 'width', {
      get: () => config.screenWidth,
      configurable: true,
    })
    Object.defineProperty(screen, 'height', {
      get: () => config.screenHeight,
      configurable: true,
    })
    Object.defineProperty(screen, 'availWidth', {
      get: () => config.screenWidth,
      configurable: true,
    })
    Object.defineProperty(screen, 'availHeight', {
      get: () => (config.screenHeight || 1080) - 40,
      configurable: true,
    })
  }

  if (config.colorDepth) {
    Object.defineProperty(screen, 'colorDepth', {
      get: () => config.colorDepth,
      configurable: true,
    })
    Object.defineProperty(screen, 'pixelDepth', {
      get: () => config.colorDepth,
      configurable: true,
    })
  }

  if (config.pixelRatio) {
    Object.defineProperty(window, 'devicePixelRatio', {
      get: () => config.pixelRatio,
      configurable: true,
    })
  }

  // WebGL spoofing
  if (config.webglVendor && config.webglRenderer) {
    const origGetParameter = WebGLRenderingContext.prototype.getParameter
    WebGLRenderingContext.prototype.getParameter = function(parameter: number) {
      if (parameter === 37445) return config.webglVendor // UNMASKED_VENDOR_WEBGL
      if (parameter === 37446) return config.webglRenderer // UNMASKED_RENDERER_WEBGL
      return origGetParameter.call(this, parameter)
    }
    
    // Also patch WebGL2
    if (typeof WebGL2RenderingContext !== 'undefined') {
      const origGetParameter2 = WebGL2RenderingContext.prototype.getParameter
      WebGL2RenderingContext.prototype.getParameter = function(parameter: number) {
        if (parameter === 37445) return config.webglVendor
        if (parameter === 37446) return config.webglRenderer
        return origGetParameter2.call(this, parameter)
      }
    }
  }

  // Hide automation indicators
  Object.defineProperty(navigator, 'webdriver', {
    get: () => undefined,
    configurable: true,
  })
  
  // Remove Electron-specific indicators
  try {
    delete (window as any).__electron
    delete (window as any).__ELECTRON_INTERNALS__
  } catch (e) {}
}

// Expose API to renderer (if needed)
contextBridge.exposeInMainWorld('electronAPI', {
  getFingerprintConfig: () => fingerprintConfig,
})
