import React from 'react'

const OS_OPTIONS = [
  'Windows 11',
  'Windows 10',
  'Windows 8.1',
  'macOS M1',
  'macOS M2',
  'macOS M3',
  'macOS M4',
  'Linux',
]

// Tạo số ngẫu nhiên hợp lệ cho browserVersion (130-140) - phải match với backend validation max(140)
const BROWSER_VERSIONS = Array.from({ length: 11 }, (_, i) => 130 + i) // 130..140
const RESOLUTIONS = [
  '1366x768',
  '1536x864',
  '1600x900',
  '1920x1080',
  '1920x1200',
  '2560x1440',
  '3440x1440',
  '3840x2160',
]

const CANVAS_MODES = ['Noise', 'Off', 'Block'] as const
const CLIENT_RECTS = ['Off', 'Noise'] as const
const AUDIO_CTX = ['Off', 'Noise'] as const
const WEBGL_IMG = ['Off', 'Noise'] as const
const WEBGL_META = ['Mask', 'Real'] as const

function randomFrom<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function padHex(n: number) {
  return n.toString(16).padStart(2, '0')
}

// generate locally-random MAC (locally-administered, unicast)
function genRandomMac() {
  const bytes = new Uint8Array(6)
  for (let i = 0; i < 6; i++) bytes[i] = randomInt(0, 255)
  bytes[0] = (bytes[0] & 0xfe) | 0x02 // local-admin & unicast
  return Array.from(bytes)
    .map((b) => padHex(b))
    .join(':')
}

// build UA basic template (Chrome-like). Not a perfect fingerprint but OK for profile use.
// You can call backend to ensure uniqueness if needed.
function buildUA({ os, arch = 'x64', version }: { os: string; arch?: string; version: number }) {
  let platform: string
  if (os.startsWith('Windows')) {
    platform = `Windows NT 10.0; ${arch === 'x64' ? 'Win64; x64' : 'WOW64'}`
  } else if (os === 'Linux' || os.toLowerCase().includes('linux')) {
    platform = `X11; Linux ${arch === 'x64' ? 'x86_64' : 'i686'}`
  } else {
    platform = `Macintosh; Intel Mac OS X 10_15_7`
  }
  return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version}.0.0.0 Safari/537.36`
}

export function generateRandomFingerprint(): any {
  const os = randomFrom(OS_OPTIONS)
  const arch = os.startsWith('macOS') ? '64' : Math.random() < 0.85 ? '64' : '32' // macOS -> 64 forced
  const version = randomFrom(BROWSER_VERSIONS)
  const screen = randomFrom(RESOLUTIONS)
    .split('x')
    .map((s) => parseInt(s, 10))
  const ua = buildUA({ os, arch: arch === '64' ? 'x64' : 'x86', version })
  const mac = genRandomMac()

  const fingerprint = {
    os: { name: os, arch: arch === '64' ? 'x64' : 'x86' },
    ua,
    browser: { version },
    screen: { width: screen[0], height: screen[1], dpr: 1 },
    canvas: { mode: randomFrom([...CANVAS_MODES]) },
    clientRects: { mode: randomFrom([...CLIENT_RECTS]) },
    audioContext: { mode: randomFrom([...AUDIO_CTX]) },
    webgl: { imageMode: randomFrom([...WEBGL_IMG]), metaMode: randomFrom([...WEBGL_META]) },
    geo: { enabled: Math.random() < 0.2 }, // 20% on
    webrtc: { useMainIP: Math.random() < 0.3 }, // 30% use main IP
    proxy: null,
    mac,
  }

  return fingerprint
}

export default function RandomButton({ onSet }: { onSet: (fp: any) => void }) {
  return (
    <button
      type="button"
      className="rounded border px-2 py-1 text-sm hover:bg-muted"
      onClick={() => {
        const fp = generateRandomFingerprint()
        onSet(fp)
      }}
    >
      Randomize all
    </button>
  )
}


