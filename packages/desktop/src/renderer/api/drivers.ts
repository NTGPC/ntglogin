export interface Driver {
  id: number
  name: string
  type: string
  description?: string
  config: any
  created_at?: string
}

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:3000'

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json().catch(() => null)
  return (data?.data ?? data) as T
}

export const driversApi = {
  list: () => http<Driver[]>('/api/drivers'),
  create: (data: Partial<Driver>) => http<Driver>('/api/drivers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Driver>) => http<Driver>(`/api/drivers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: number) => http<void>(`/api/drivers/${id}`, { method: 'DELETE' }),
}

import { playwrightPresets } from './playwrightPresets'
import { regionPresets } from './regionPresets'

export function getPresets() {
  return [
    {
      name: 'Windows/Chrome US',
      type: 'userAgent',
      config: {
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1366, height: 768, deviceScaleFactor: 1 },
        languages: ['en-US', 'en'],
        timezoneId: 'America/Los_Angeles',
      },
    },
    { name: 'Canvas Noise (0.03)', type: 'canvas', config: { canvas: { mode: 'noise', seed: '0.03' } } },
    { name: 'WebGL Mask NVIDIA', type: 'webgl', config: { webgl: { metadata: 'mask', vendor: 'NVIDIA', renderer: 'GeForce GTX' } } },
    { name: 'Audio mute + noise', type: 'audio', config: { audioContext: { mode: 'noise' } } },
    { name: 'Fonts mask basic', type: 'fonts', config: { fonts: { mask: true, list: ['Arial', 'Tahoma'] } } },
    ...playwrightPresets,
    ...regionPresets,
  ]
}


