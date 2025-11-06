import prisma from '../prismaClient'

function randomMacOnce(): string {
  const b = new Uint8Array(6)
  for (let i = 0; i < 6; i++) b[i] = Math.floor(Math.random() * 256)
  b[0] = (b[0] | 0x02) & 0xfe // local administered & unicast
  return Array.from(b).map((v) => v.toString(16).padStart(2, '0')).join(':')
}

export async function randomUnique(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const mac = randomMacOnce()
    try {
      const exists = await prisma.$queryRaw`SELECT id FROM profiles WHERE "macAddress" = ${mac} LIMIT 1` as any[]
      if (!exists || exists.length === 0) return mac
    } catch {
      // Field might not exist yet, skip uniqueness check
      return mac
    }
  }
  // extremely unlikely fallback
  return randomMacOnce()
}


