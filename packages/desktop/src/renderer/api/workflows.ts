export interface Workflow {
  id: number
  name: string
  data: any // React Flow graph {nodes, edges}
  createdAt: string
  updatedAt: string
}

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:3000'

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...init,
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    const msg = res.status === 401 || res.status === 403 ? `Auth error (${res.status}). Check CORS or dev login.` : body || `HTTP ${res.status}`
    throw new Error(msg)
  }
  const data = await res.json().catch(() => null)
  return (data?.data ?? data) as T
}

export const workflowsApi = {
  list: () => http<Workflow[]>('/api/workflows'),
  get: (id: number) => http<Workflow>(`/api/workflows/${id}`),
  create: (data: Partial<Workflow>) => http<Workflow>('/api/workflows', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Workflow>) => http<Workflow>(`/api/workflows/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: number) => http<void>(`/api/workflows/${id}`, { method: 'DELETE' }),
}

