// Snapshot of Playwright device-like presets
// (Key fields mapped for our fingerprint config JSON)

interface PwPreset {
  name: string
  type: string
  config: any
}

export const playwrightPresets: PwPreset[] = [
  {
    name: 'iPhone 14 Pro Safari',
    type: 'userAgent',
    config: {
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      viewport: { width: 393, height: 852, deviceScaleFactor: 3 },
      isMobile: true,
      hasTouch: true,
      languages: ['en-US', 'en'],
      platform: 'iPhone',
    },
  },
  {
    name: 'Pixel 7 Chrome',
    type: 'userAgent',
    config: {
      userAgent:
        'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      viewport: { width: 412, height: 915, deviceScaleFactor: 2.75 },
      isMobile: true,
      hasTouch: true,
      languages: ['en-US', 'en'],
      platform: 'Android',
    },
  },
  {
    name: 'iPad 10 Safari',
    type: 'userAgent',
    config: {
      userAgent:
        'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      viewport: { width: 810, height: 1080, deviceScaleFactor: 2 },
      isMobile: true,
      hasTouch: true,
      languages: ['en-US', 'en'],
      platform: 'iPad',
    },
  },
  {
    name: 'Desktop Windows Chrome',
    type: 'userAgent',
    config: {
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1366, height: 768, deviceScaleFactor: 1 },
      isMobile: false,
      hasTouch: false,
      languages: ['en-US', 'en'],
      platform: 'Win32',
    },
  },
  {
    name: 'Desktop macOS Safari',
    type: 'userAgent',
    config: {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      viewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
      isMobile: false,
      hasTouch: false,
      languages: ['en-US', 'en'],
      platform: 'MacIntel',
    },
  },
  {
    name: 'Desktop Linux Chrome',
    type: 'userAgent',
    config: {
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
      isMobile: false,
      hasTouch: false,
      languages: ['en-US', 'en'],
      platform: 'Linux x86_64',
    },
  },
]


