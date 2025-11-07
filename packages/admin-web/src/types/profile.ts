/**
 * Profile Editor State Interface
 * Matches the state shape used in ProfileEditor.jsx
 */
export interface ProfileState {
  folder: string
  title: string
  os: string
  osVersion: string
  browser: string
  userAgent: string
  remark: string
  startUrls: string
  twoFA: string
  language: string
  uiLanguage: string
  timezone: string
  fonts: string
  geolocation: string
  windowWidth: number
  windowHeight: number
  webglManufacturer: string
  webglRenderer: string
  deviceName: string
  macAddress: string
  hardwareConcurrency: number
  hardwareNoise: {
    canvas: boolean
    webgl: boolean
    audio: boolean
    clientRects: boolean
    speechVoices: boolean
    mediaDevice: boolean
  }
}

