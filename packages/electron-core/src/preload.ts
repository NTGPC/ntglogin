import { contextBridge, ipcRenderer } from 'electron'
import * as path from 'path'
import * as fs from 'fs'

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

  // Load injection script from file
  const injectionScriptPath = path.join(__dirname, '../../src/scripts/injection_script.js')
  
  // For now, we'll inject directly here
  // In production, load from file and replace placeholders
  
  const seed = config.profileId || 12345

  // ==========================================================
  // === FINGERPRINT INJECTION (Tương tự injection_script.js) ===
  // ==========================================================
  
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
  }

  // Hide automation indicators
  Object.defineProperty(navigator, 'webdriver', {
    get: () => undefined,
    configurable: true,
  })

  // Canvas, Audio, WebRTC, Geolocation patches will be loaded from injection_script.js
  // For now, this is a basic implementation
}

// Expose API to renderer (if needed)
contextBridge.exposeInMainWorld('electronAPI', {
  getFingerprintConfig: () => fingerprintConfig,
})

