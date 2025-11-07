import prisma from '../prismaClient'
import UserAgents from 'user-agents'
import randomUseragent from 'random-useragent'
import axios from 'axios'

export type UAParams = {
  browser?: 'chrome' | 'firefox' | 'edge' | 'safari'
  versionHint?: number
  os?: string
}

async function tryExternalAPI(): Promise<string | undefined> {
  const url = process.env.UA_API_URL
  if (!url) return undefined
  try {
    const res = await axios.get(url, { timeout: 6000 })
    const ua = (res.data?.userAgent || res.data?.ua || res.data) as string
    if (typeof ua === 'string' && ua.length > 20) return ua
  } catch {}
  return undefined
}

function normalizeOS(os: string): string {
  if (!os) return 'Windows'
  const lower = os.toLowerCase()
  if (lower.includes('mac') || lower.includes('macos')) return 'Mac OS'
  if (lower.includes('linux')) return 'Linux'
  if (lower.includes('android')) return 'Android'
  if (lower.includes('ios')) return 'iOS'
  if (lower.includes('windows')) return 'Windows'
  return os
}

function fromUserAgentsLib(params: UAParams): string | undefined {
  try {
    const opts: any = {}
    if (params?.browser) opts.browserName = params.browser
    if (params?.os) {
      opts.platform = normalizeOS(params.os)
    }
    const ua = new (UserAgents as any)(opts).toString()
    if (ua && typeof ua === 'string') return ua
  } catch {}
  return undefined
}

function fromRandomUseragent(params: UAParams): string | undefined {
  try {
    if (params?.browser) {
      const ua = randomUseragent.getRandom((ua: any) => ua.browserName?.toLowerCase().includes(params.browser!))
      if (ua) return ua
    }
    return randomUseragent.getRandom()
  } catch {}
  return undefined
}

export async function getUniqueUA(params: UAParams = {}): Promise<string> {
  const normalizedParams = {
    ...params,
    os: params.os ? normalizeOS(params.os) : params.os
  }
  
  const isMac = normalizedParams.os?.toLowerCase().includes('mac')
  const defaultUA = isMac
    ? 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'
    : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'
  
  for (let i = 0; i < 10; i++) {
    let ua = fromUserAgentsLib(normalizedParams)
    if (!ua) ua = fromRandomUseragent(normalizedParams)
    if (!ua) ua = await tryExternalAPI()
    if (!ua) ua = defaultUA

    try {
      const exist = await prisma.$queryRaw`SELECT id FROM profiles WHERE "userAgent" = ${ua} LIMIT 1` as any[]
      if (!exist || exist.length === 0) return ua
    } catch {
      // Field might not exist yet, skip uniqueness check
      return ua
    }
  }
  // As a last resort, append a space (mostly harmless for parsers) to avoid duplicates
  return defaultUA + ' '
}


