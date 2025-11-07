export interface ProfileEditorData {
  // General
  name: string
  userAgent?: string
  macAddress?: string
  
  // Proxy
  proxyMode: 'manual' | 'library'
  proxyManual?: {
    host?: string
    port?: number
    username?: string
    password?: string
  }
  proxyRefId?: string
  
  // Advanced
  osName?: string
  osArch?: 'x86' | 'x64'
  browserVersion?: string
  screenWidth?: number
  screenHeight?: number
  
  // Fingerprint
  canvasMode?: 'Noise' | 'Off' | 'Block'
  clientRectsMode?: 'Off' | 'Noise'
  audioCtxMode?: 'Off' | 'Noise'
  webglImageMode?: 'Off' | 'Noise'
  webglMetaMode?: 'Mask' | 'Real'
  geoEnabled?: boolean
  webrtcMainIP?: boolean
  useSwiftShader?: boolean
}

export type TabType = 'general' | 'proxy' | 'advanced' | 'fingerprint'

