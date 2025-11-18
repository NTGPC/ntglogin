import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000'

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Token interceptor (prepare for future auth)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Track if we're currently attempting auto-login to avoid infinite loops
let isAutoLoggingIn = false

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      const token = localStorage.getItem('auth_token')
      
      // If no token and not already trying to auto-login, attempt auto-login
      if (!token && !isAutoLoggingIn) {
        isAutoLoggingIn = true
        try {
          // Try to auto-login with default credentials
          await api.login('admin', 'admin123')
          // Retry the original request after successful login
          const originalRequest = error.config
          if (originalRequest) {
            const newToken = localStorage.getItem('auth_token')
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`
              return apiClient(originalRequest)
            }
          }
        } catch (loginError) {
          console.error('Auto-login failed:', loginError)
          // Clear token if exists
          localStorage.removeItem('auth_token')
        } finally {
          isAutoLoggingIn = false
        }
      } else if (token && (error.response?.status === 401)) {
        // Token exists but is invalid/expired, clear it
        localStorage.removeItem('auth_token')
      }
    }
    return Promise.reject(error)
  }
)

// Types
export interface Profile {
  id: number
  name: string
  user_agent?: string
  fingerprint?: any
  workflowId?: number | null // ID của workflow được gán
  workflow?: any | null // Thông tin workflow đã được gán (từ include)
  created_at: string
}

export interface Proxy {
  id: number
  host: string
  port: number
  username?: string
  password?: string
  type: string
  active: boolean
  created_at: string
}

export interface ProxyCheckResult {
  live: boolean
  latencyMs?: number | null
  error?: string
}

export interface Session {
  id: number
  profile_id: number
  proxy_id?: number
  status: string
  started_at?: string
  stopped_at?: string
  meta?: any
  profile?: Profile
  proxy?: Proxy
}

export interface Fingerprint {
  id: number
  name: string
  data: any
  created_at: string
}

export interface Job {
  id: number
  type: string
  payload: any
  status: string
  attempts: number
  scheduled_at?: string
  created_at: string
}

export interface JobExecution {
  id: number
  job_id: number
  profile_id: number
  session_id?: number
  status: string
  started_at?: string
  completed_at?: string
  result?: any
  error?: string
  created_at: string
}

export interface Stats {
  profiles?: number
  proxies?: number
  sessions?: number
  jobs?: number
}

// API Functions
export const api = {
  // Auth
  async login(username: string, password: string): Promise<{ token: string; user: any }> {
    const response = await apiClient.post('/api/auth/login', { username, password })
    const token = response.data.data?.token || response.data.token
    const user = response.data.data?.user || response.data.user
    if (token) {
      localStorage.setItem('auth_token', token)
    }
    return { token, user }
  },

  async register(username: string, password: string): Promise<{ token: string; user: any }> {
    const response = await apiClient.post('/api/auth/register', { username, password })
    const token = response.data.data?.token || response.data.token
    const user = response.data.data?.user || response.data.user
    if (token) {
      localStorage.setItem('auth_token', token)
    }
    return { token, user }
  },

  // Stats
  async getStats(): Promise<Stats> {
    try {
      const response = await apiClient.get('/api/stats')
      return response.data.data || response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn('Stats endpoint not found - this is expected if backend does not implement /api/stats')
        return {}
      }
      throw error
    }
  },

  // Profiles
  async getProfiles(): Promise<Profile[]> {
    const response = await apiClient.get('/api/profiles')
    return response.data.data || response.data || []
  },

  async getProfile(id: number): Promise<Profile> {
    const response = await apiClient.get(`/api/profiles/${id}`)
    return response.data.data || response.data
  },

  async createProfile(data: Partial<Profile>): Promise<Profile> {
    const response = await apiClient.post('/api/profiles', data)
    return response.data.data || response.data
  },

  async updateProfile(id: number, data: Partial<Profile>): Promise<Profile> {
    const response = await apiClient.put(`/api/profiles/${id}`, data)
    return response.data.data || response.data
  },

  async deleteProfile(id: number): Promise<void> {
    await apiClient.delete(`/api/profiles/${id}`)
  },

  async getProfileFingerprint(id: number): Promise<any> {
    const response = await apiClient.get(`/api/profiles/${id}/fingerprint`)
    return response.data.data || response.data
  },

  async updateProfileFingerprint(id: number, data: any): Promise<any> {
    const response = await apiClient.put(`/api/profiles/${id}/fingerprint`, data)
    return response.data.data || response.data
  },

  // Proxies
  async getProxies(): Promise<Proxy[]> {
    const response = await apiClient.get('/api/proxies')
    return response.data.data || response.data || []
  },

  async getProxy(id: number): Promise<Proxy> {
    const response = await apiClient.get(`/api/proxies/${id}`)
    return response.data.data || response.data
  },

  async createProxy(data: Partial<Proxy>): Promise<Proxy> {
    const response = await apiClient.post('/api/proxies', data)
    return response.data.data || response.data
  },

  async updateProxy(id: number, data: Partial<Proxy>): Promise<Proxy> {
    const response = await apiClient.put(`/api/proxies/${id}`, data)
    return response.data.data || response.data
  },

  async deleteProxy(id: number): Promise<void> {
    await apiClient.delete(`/api/proxies/${id}`)
  },

  async checkProxy(id: number): Promise<ProxyCheckResult> {
    const response = await apiClient.post(`/api/proxies/${id}/check`)
    return response.data.data || response.data
  },

  // Profiles helpers (new)
  async getUserAgent(params?: { browser?: string; versionHint?: number; os?: string }): Promise<string> {
    const response = await apiClient.post('/api/profiles/user-agent', params || {})
    return response.data.userAgent || response.data.data || response.data
  },

  async generateFingerprint(body?: any): Promise<any> {
    const response = await apiClient.post('/api/profiles/generate-fingerprint', body || {})
    return response.data.data || response.data
  },

  // Sessions
  async getSessions(): Promise<Session[]> {
    const response = await apiClient.get('/api/sessions')
    return response.data.data || response.data || []
  },

  async getSession(id: number): Promise<Session> {
    const response = await apiClient.get(`/api/sessions/${id}`)
    return response.data.data || response.data
  },

  async createSession(data: { profileId: number; proxyId?: number }): Promise<Session> {
    const response = await apiClient.post('/api/sessions', {
      profile_id: data.profileId,
      proxy_id: data.proxyId,
    })
    return response.data.data || response.data
  },

  async startProfileWithWorkflow(profileId: number, data?: { proxyId?: number; vars?: Record<string, any> }): Promise<any> {
    const response = await apiClient.post(`/api/profiles/${profileId}/start-with-workflow`, {
      proxyId: data?.proxyId,
      vars: data?.vars,
    })
    return response.data
  },

  async stopSession(id: number): Promise<void> {
    try {
      await apiClient.post(`/api/sessions/${id}/stop`)
    } catch (error: any) {
      // If stop endpoint doesn't exist, try PUT with status
      if (error.response?.status === 404) {
        await apiClient.put(`/api/sessions/${id}`, { status: 'stopped' })
      } else {
        throw error
      }
    }
  },

  async deleteSession(id: number): Promise<void> {
    await apiClient.delete(`/api/sessions/${id}`)
  },

  // Fingerprints
  async getFingerprints(): Promise<Fingerprint[]> {
    try {
      const response = await apiClient.get('/api/fingerprints')
      return response.data.data || response.data || []
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn('Fingerprints endpoint not found')
        return []
      }
      throw error
    }
  },

  async createFingerprint(data: { name: string; data: any }): Promise<Fingerprint> {
    const response = await apiClient.post('/api/fingerprints', data)
    return response.data.data || response.data
  },

  async updateFingerprint(id: number, data: { name?: string; data?: any }): Promise<Fingerprint> {
    const response = await apiClient.put(`/api/fingerprints/${id}`, data)
    return response.data.data || response.data
  },

  async deleteFingerprint(id: number): Promise<void> {
    await apiClient.delete(`/api/fingerprints/${id}`)
  },

  // Jobs
  async getJobs(): Promise<Job[]> {
    const response = await apiClient.get('/api/jobs')
    return response.data.data || response.data || []
  },

  async getJob(id: number): Promise<Job> {
    const response = await apiClient.get(`/api/jobs/${id}`)
    return response.data.data || response.data
  },

  async createJob(data: { type: string; payload: any; profile_ids?: number[]; workflow_id?: number }): Promise<Job> {
    const response = await apiClient.post('/api/jobs', {
      type: data.type,
      payload: data.payload,
      profile_ids: data.profile_ids,
      workflow_id: data.workflow_id,
    })
    return response.data.data || response.data
  },

  async updateJob(id: number, data: Partial<Job>): Promise<Job> {
    const response = await apiClient.put(`/api/jobs/${id}`, data)
    return response.data.data || response.data
  },

  async deleteJob(id: number): Promise<void> {
    await apiClient.delete(`/api/jobs/${id}`)
  },

  // Job Executions
  async getJobExecutions(jobId?: number): Promise<JobExecution[]> {
    const url = jobId ? `/api/job-executions?jobId=${jobId}` : '/api/job-executions'
    try {
      const response = await apiClient.get(url)
      return response.data.data || response.data || []
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn('Job executions endpoint not found')
        return []
      }
      throw error
    }
  },

  // Workflows
  async getWorkflows(fields?: string): Promise<any[]> {
    try {
      const url = fields ? `/api/workflows?fields=${fields}` : '/api/workflows'
      const response = await apiClient.get(url)
      return response.data.data || response.data || []
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn('Workflows endpoint not found')
        return []
      }
      throw error
    }
  },

  // GPU
  async getGPUList(): Promise<any[]> {
    try {
      const response = await apiClient.get('/api/gpus')
      return response.data.data || response.data || []
    } catch (error: any) {
      console.error('Failed to load GPU list:', error)
      return []
    }
  },

  async getGPUByAngle(angle: string): Promise<any> {
    try {
      const encodedAngle = encodeURIComponent(angle)
      const response = await apiClient.get(`/api/gpus/angle/${encodedAngle}`)
      return response.data.data || response.data
    } catch (error: any) {
      console.error('Failed to get GPU by angle:', error)
      return null
    }
  },

  async getGPUsByBrand(brand: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`/api/gpus/brand/${brand}`)
      return response.data.data || response.data || []
    } catch (error: any) {
      console.error('Failed to get GPUs by brand:', error)
      return []
    }
  },

  // User-Agent Library
  async getUserAgentList(): Promise<any[]> {
    try {
      const response = await apiClient.get('/api/user-agents')
      return response.data.data || response.data || []
    } catch (error: any) {
      console.error('Failed to load User-Agent list:', error)
      return []
    }
  },

  async getUserAgentByValue(value: string): Promise<any> {
    try {
      const encodedValue = encodeURIComponent(value)
      const response = await apiClient.get(`/api/user-agents/value/${encodedValue}`)
      return response.data.data || response.data
    } catch (error: any) {
      console.error('Failed to get User-Agent by value:', error)
      return null
    }
  },

  async getUserAgentsByOS(os: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`/api/user-agents/os/${os}`)
      return response.data.data || response.data || []
    } catch (error: any) {
      console.error('Failed to get User-Agents by OS:', error)
      return []
    }
  },
}

