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

function fromUserAgentsLib(params: UAParams): string | undefined {
  try {
    const opts: any = {}
    if (params?.browser) opts.browserName = params.browser
    if (params?.os) opts.platform = params.os
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
  for (let i = 0; i < 10; i++) {
    let ua = fromUserAgentsLib(params)
    if (!ua) ua = fromRandomUseragent(params)
    if (!ua) ua = await tryExternalAPI()
    if (!ua) ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'

    try {
      const exist = await prisma.$queryRaw`SELECT id FROM profiles WHERE "userAgent" = ${ua} LIMIT 1` as any[]
      if (!exist || exist.length === 0) return ua
    } catch {
      // Field might not exist yet, skip uniqueness check
      return ua
    }
  }
  // As a last resort, append a space (mostly harmless for parsers) to avoid duplicates
  return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36 '
}


