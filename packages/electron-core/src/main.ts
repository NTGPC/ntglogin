import { app, BrowserWindow, session } from 'electron'
import * as path from 'path'
import * as fs from 'fs'

// Initialize Electron app if not already initialized
if (!app.isReady()) {
  app.whenReady().then(() => {
    console.log('[Electron] App is ready')
  })
}

interface ProfileConfig {
  id: number
  name: string
  userAgent?: string
  platform?: string
  uaPlatform?: string
  uaPlatformVersion?: string
  uaFullVersion?: string
  uaMobile?: boolean
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
  macAddress?: string
  proxy?: {
    host: string
    port: number
    username?: string
    password?: string
    type: string
  }
}

const profileWindows = new Map<number, BrowserWindow>()

export async function launchProfileWindow(profile: ProfileConfig): Promise<BrowserWindow> {
  console.log(`[Electron] Launching profile ${profile.id}: ${profile.name}`)

  // Close existing window for this profile if any
  const existingWindow = profileWindows.get(profile.id)
  if (existingWindow && !existingWindow.isDestroyed()) {
    existingWindow.close()
  }

  // Create session partition for this profile (isolated storage)
  const partitionName = `persist:PROFILE${profile.id}`
  const ses = session.fromPartition(partitionName)

  // ==========================================================
  // === BƯỚC 2: CAN THIỆP VÀO SESSION VÀ GIAO THỨC MẠNG ===
  // ==========================================================
  // Ghi đè User-Agent và Client Hints ở tầng sâu nhất (trước khi request được gửi)
  ses.webRequest.onBeforeSendHeaders((details, callback) => {
    const headers = details.requestHeaders || {}

    // GHI ĐÈ USER-AGENT VÀ CLIENT HINTS Ở TẦNG SÂU NHẤT
    if (profile.userAgent) {
      headers['User-Agent'] = profile.userAgent
    }

    // Client Hints Headers (quan trọng để nhất quán)
    if (profile.uaPlatform) {
      headers['Sec-CH-UA-Platform'] = `"${profile.uaPlatform}"`
    }
    if (profile.uaPlatformVersion) {
      headers['Sec-CH-UA-Platform-Version'] = `"${profile.uaPlatformVersion}"`
    }
    if (profile.uaFullVersion) {
      headers['Sec-CH-UA-Full-Version'] = `"${profile.uaFullVersion}"`
    }
    if (profile.uaMobile !== undefined) {
      headers['Sec-CH-UA-Mobile'] = profile.uaMobile ? '?1' : '?0'
    }

    // Browser brand hints
    const chromeVersion = profile.userAgent?.match(/Chrome\/(\d+)/)?.[1] || '120'
    headers['Sec-CH-UA'] = `"Not_A Brand";v="8", "Chromium";v="${chromeVersion}", "Google Chrome";v="${chromeVersion}"`

    callback({ requestHeaders: headers })
  })

  // Configure proxy if provided
  if (profile.proxy) {
    const proxyConfig = {
      proxyRules: `${profile.proxy.type}://${profile.proxy.host}:${profile.proxy.port}`,
    }
    ses.setProxy(proxyConfig, () => {
      console.log(`[Electron] Proxy configured: ${profile.proxy?.type}://${profile.proxy?.host}:${profile.proxy?.port}`)
    })
  }

  // ==========================================================
  // === BƯỚC 3: TẠO BROWSER WINDOW VỚI PRELOAD SCRIPT ===
  // ==========================================================
  // Preload script path (compiled from TypeScript)
  const preloadPath = path.join(__dirname, 'preload.js')
  const preloadDevPath = path.join(__dirname, '../src/preload.ts')
  
  // Use compiled version in production, TypeScript in development
  const finalPreloadPath = fs.existsSync(preloadPath) ? preloadPath : preloadDevPath
  
  const win = new BrowserWindow({
    width: profile.screenWidth || 1920,
    height: profile.screenHeight || 1080,
    webPreferences: {
      preload: finalPreloadPath,
      partition: partitionName,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      // Allow preload to access Node.js APIs
      enableRemoteModule: false,
    },
    show: false, // Don't show until ready
  })

  // Store window reference
  profileWindows.set(profile.id, win)

  // Load preload script and inject fingerprint data
  win.webContents.on('did-finish-load', () => {
    // Inject fingerprint configuration via IPC
    win.webContents.send('fingerprint-config', {
      profileId: profile.id,
      userAgent: profile.userAgent,
      platform: profile.platform,
      hardwareConcurrency: profile.hardwareConcurrency,
      deviceMemory: profile.deviceMemory,
      languages: profile.languages,
      screenWidth: profile.screenWidth,
      screenHeight: profile.screenHeight,
      colorDepth: profile.colorDepth,
      pixelRatio: profile.pixelRatio,
      webglVendor: profile.webglVendor,
      webglRenderer: profile.webglRenderer,
      canvasMode: profile.canvasMode,
      audioContextMode: profile.audioContextMode,
      webrtcMode: profile.webrtcMode,
      geolocationMode: profile.geolocationMode,
      geolocationLatitude: profile.geolocationLatitude,
      geolocationLongitude: profile.geolocationLongitude,
      timezone: profile.timezone,
    })
  })

  // Show window when ready
  win.once('ready-to-show', () => {
    win.show()
    console.log(`[Electron] ✅ Profile window ${profile.id} is ready`)
  })

  // Clean up on close
  win.on('closed', () => {
    profileWindows.delete(profile.id)
  })

  // ==========================================================
  // === BƯỚC 4: TÙY CHỈNH CÁC CỜ KHỞI CHẠY CỦA CHROMIUM ===
  // ==========================================================
  // Set Chromium command line switches
  app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled')
  app.commandLine.appendSwitch('disable-infobars')
  app.commandLine.appendSwitch('no-sandbox')
  app.commandLine.appendSwitch('disable-dev-shm-usage')
  
  // Language and locale
  if (profile.languages && profile.languages.length > 0) {
    app.commandLine.appendSwitch('lang', profile.languages[0])
  }
  
  // Timezone (if supported)
  if (profile.timezone) {
    // Note: Electron doesn't directly support timezone via command line
    // This will be handled by injection script
  }
  
  // Load initial URL (or restore session)
  win.loadURL('about:blank')

  return win
}

export function closeProfileWindow(profileId: number): void {
  const win = profileWindows.get(profileId)
  if (win && !win.isDestroyed()) {
    win.close()
    profileWindows.delete(profileId)
    console.log(`[Electron] ✅ Closed profile window ${profileId}`)
  }
}

export function getProfileWindow(profileId: number): BrowserWindow | undefined {
  return profileWindows.get(profileId)
}

