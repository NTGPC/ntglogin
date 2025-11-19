import { launchProfileWindow, closeProfileWindow, getProfileWindow } from '../../packages/electron-core/src/main'
import type { BrowserWindow } from 'electron'

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

const electronWindows = new Map<number, BrowserWindow>()

/**
 * Launch browser profile using Electron (NEW - Chặng 3)
 * This replaces Playwright/Puppeteer with native Electron for deeper control
 */
export async function launchProfileWithElectron(profile: any): Promise<BrowserWindow> {
  console.log(`[Electron Browser] Launching profile ${profile.id}: ${profile.name}`)

  // Map profile from database to Electron config
  const config: ProfileConfig = {
    id: profile.id,
    name: profile.name,
    userAgent: profile.userAgent || profile.user_agent,
    platform: profile.platform || 'Win32',
    uaPlatform: profile.uaPlatform,
    uaPlatformVersion: profile.uaPlatformVersion,
    uaFullVersion: profile.uaFullVersion,
    uaMobile: profile.uaMobile || false,
    hardwareConcurrency: profile.hardwareConcurrency || 8,
    deviceMemory: profile.deviceMemory || 8,
    languages: profile.languages || ['en-US', 'en'],
    screenWidth: profile.screenWidth || 1920,
    screenHeight: profile.screenHeight || 1080,
    colorDepth: profile.colorDepth || 24,
    pixelRatio: profile.pixelRatio || 1.0,
    webglVendor: profile.webglVendor || (profile.webglRendererRef?.vendor),
    webglRenderer: profile.webglRenderer || (profile.webglRendererRef?.renderer),
    canvasMode: profile.canvasMode || 'noise',
    audioContextMode: profile.audioContextMode || 'noise',
    webrtcMode: profile.webrtcMode || 'fake',
    geolocationMode: profile.geolocationMode || 'fake',
    geolocationLatitude: profile.geolocationLatitude || profile.geolocationLat || profile.geoLatitude,
    geolocationLongitude: profile.geolocationLongitude || profile.geolocationLon || profile.geoLongitude,
    timezone: profile.timezone || profile.timezoneId || 'Europe/London',
    macAddress: profile.macAddress,
    proxy: profile.proxy ? {
      host: profile.proxy.host,
      port: profile.proxy.port,
      username: profile.proxy.username || undefined,
      password: profile.proxy.password || undefined,
      type: profile.proxy.type || 'http',
    } : undefined,
  }

  // Launch Electron window
  const win = await launchProfileWindow(config)
  electronWindows.set(profile.id, win)

  console.log(`[Electron Browser] ✅ Profile ${profile.id} launched successfully`)
  return win
}

/**
 * Close Electron browser window for a profile
 */
export async function closeElectronProfile(profileId: number): Promise<void> {
  closeProfileWindow(profileId)
  electronWindows.delete(profileId)
  console.log(`[Electron Browser] ✅ Closed profile ${profileId}`)
}

/**
 * Get Electron window for a profile
 */
export function getElectronWindow(profileId: number): BrowserWindow | undefined {
  return getProfileWindow(profileId)
}

