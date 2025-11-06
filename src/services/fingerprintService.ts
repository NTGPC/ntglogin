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
  webrtcMainIP?: boolean
  proxyRefId?: string | null
  proxyManual?: any | null
  ua: string
  mac: string
}

export function build(config: FingerprintConfig) {
  const {
    osName, osArch, browserVersion, screenWidth, screenHeight, canvasMode, clientRectsMode,
    audioCtxMode, webglImageMode, webglMetaMode, geoEnabled, webrtcMainIP, proxyRefId, proxyManual, ua, mac
  } = config

  return {
    os: { name: osName, arch: osArch },
    ua,
    browser: { version: browserVersion },
    screen: { width: screenWidth, height: screenHeight },
    canvas: { mode: canvasMode },
    clientRects: { mode: clientRectsMode },
    audioContext: { mode: audioCtxMode },
    webgl: { imageMode: webglImageMode, metaMode: webglMetaMode },
    geo: { enabled: !!geoEnabled },
    webrtc: { useMainIP: !!webrtcMainIP },
    proxy: { libraryId: proxyRefId ?? undefined, manual: proxyManual ?? undefined },
    mac,
  }
}


