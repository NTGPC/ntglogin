import { Arch, OsName } from './userAgentService'

export type FingerprintConfig = {
  osName?: OsName
  osArch?: Arch
  browserVersion?: number
  screenWidth?: number
  screenHeight?: number
  canvasMode?: 'Noise' | 'Off' | 'Block'
  clientRectsMode?: 'Off' | 'Noise'
  audioCtxMode?: 'Off' | 'Noise'
  webglImageMode?: 'Off' | 'Noise'
  webglMetaMode?: 'Mask' | 'Real'
  geoEnabled?: boolean
  geoLatitude?: number
  geoLongitude?: number
  webrtcMainIP?: boolean
  proxyRefId?: string | null
  proxyManual?: any | null
  ua: string
  mac: string
  timezoneId?: string
  language?: string
  hardwareConcurrency?: number
  deviceMemory?: number
  profileId?: number
  seed?: number
}

function getDefaultTimezone(osName?: string): string {
  if (!osName) return 'America/Los_Angeles'
  if (osName.includes('macOS')) return 'America/Los_Angeles'
  if (osName.includes('Windows')) return 'America/New_York'
  if (osName.includes('Linux')) return 'Europe/London'
  return 'America/Los_Angeles'
}

function getDefaultLanguage(osName?: string): string {
  if (!osName) return 'en-US'
  if (osName.includes('macOS')) return 'en-US'
  if (osName.includes('Windows')) return 'en-US'
  if (osName.includes('Linux')) return 'en-US'
  return 'en-US'
}

function getDefaultHardwareConcurrency(seed?: number): number {
  const baseSeed = (seed || 12345) % 100
  return 4 + (baseSeed % 4)
}

function getDefaultDeviceMemory(seed?: number): number {
  const baseSeed = (seed || 12345) % 100
  const options = [4, 8, 16]
  return options[baseSeed % options.length]
}

export function build(config: FingerprintConfig) {
  const {
    osName, osArch, browserVersion, screenWidth, screenHeight, canvasMode, clientRectsMode,
    audioCtxMode, webglImageMode, webglMetaMode, geoEnabled, geoLatitude, geoLongitude,
    webrtcMainIP, proxyRefId, proxyManual, ua, mac, timezoneId, language,
    hardwareConcurrency, deviceMemory, profileId, seed
  } = config

  const finalSeed = seed || profileId || 12345
  const finalTimezone = timezoneId || getDefaultTimezone(osName)
  const finalLanguage = language || getDefaultLanguage(osName)
  const finalHardwareConcurrency = hardwareConcurrency ?? getDefaultHardwareConcurrency(finalSeed)
  const finalDeviceMemory = deviceMemory ?? getDefaultDeviceMemory(finalSeed)

  return {
    seed: finalSeed,
    profileId: profileId,
    os: { name: osName, arch: osArch },
    ua,
    browser: { version: browserVersion },
    screen: { width: screenWidth, height: screenHeight },
    canvas: { mode: canvasMode },
    clientRects: { mode: clientRectsMode },
    audioContext: { mode: audioCtxMode },
    webgl: { imageMode: webglImageMode, metaMode: webglMetaMode },
    geo: {
      enabled: !!geoEnabled,
      lat: geoLatitude,
      lon: geoLongitude
    },
    webrtc: { useMainIP: !!webrtcMainIP },
    proxy: { libraryId: proxyRefId ?? undefined, manual: proxyManual ?? undefined },
    mac,
    timezoneId: finalTimezone,
    language: finalLanguage,
    languages: [finalLanguage, finalLanguage.split('-')[0]],
    hardwareConcurrency: finalHardwareConcurrency,
    deviceMemory: finalDeviceMemory,
  }
}


