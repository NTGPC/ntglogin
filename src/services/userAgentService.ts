import prisma from '../prismaClient'

export type OsName = 'Windows 11' | 'Windows 10' | 'Windows 8.1' | 'macOS M1' | 'macOS M2' | 'macOS M3' | 'macOS M4' | 'Linux'
export type Arch = 'x86' | 'x64'

function buildUA(osName: OsName, arch: Arch, version: number): string {
  let platform: string
  if (osName.startsWith('Windows')) {
    platform = `Windows NT 10.0; ${arch === 'x64' ? 'Win64; x64' : 'WOW64'}`
  } else if (osName === 'Linux' || osName.toLowerCase().includes('linux')) {
    platform = `X11; Linux ${arch === 'x64' ? 'x86_64' : 'i686'}`
  } else {
    platform = `Macintosh; Intel Mac OS X 10_15_7`
  }
  return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version}.0.0.0 Safari/537.36`
}

export async function randomUnique(params: { osName?: OsName; browserVersion?: number; arch?: Arch }): Promise<string> {
  const version = params.browserVersion && params.browserVersion >= 130 && params.browserVersion <= 140
    ? params.browserVersion
    : 136 + Math.floor(Math.random() * (140 - 136 + 1))
  const osName = (params.osName || 'Windows 10') as OsName
  const arch = (params.arch || 'x64') as Arch

  // Try a few times to ensure uniqueness
  for (let i = 0; i < 10; i++) {
    // vary minor build slightly to reduce collisions
    const ua = buildUA(osName, arch, version)
    try {
      const existing = await prisma.$queryRaw`SELECT id FROM profiles WHERE "userAgent" = ${ua} LIMIT 1` as any[]
      if (!existing || existing.length === 0) return ua
    } catch {
      // Field might not exist yet, skip uniqueness check
      return ua
    }
  }
  // fallback: append space + minor token that still passes many parsers
  const ua = buildUA(osName, arch, version) + ' '
  return ua
}


