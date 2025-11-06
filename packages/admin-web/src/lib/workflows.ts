import { apiClient } from './api'

export interface Workflow {
  id: number
  name: string
  data: any // React Flow graph {nodes, edges}
  createdAt: string
  updatedAt: string
}

export const workflowsApi = {
  list: async (): Promise<Workflow[]> => {
    try {
      const response = await apiClient.get('/api/workflows')
      return response.data.data || response.data || []
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        throw new Error('Cannot connect to backend server. Please make sure the backend is running on http://127.0.0.1:3000')
      }
      throw error
    }
  },
  get: async (id: number): Promise<Workflow> => {
    try {
      const response = await apiClient.get(`/api/workflows/${id}`)
      return response.data.data || response.data
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        throw new Error('Cannot connect to backend server. Please make sure the backend is running on http://127.0.0.1:3000')
      }
      throw error
    }
  },
  create: async (data: Partial<Workflow>): Promise<Workflow> => {
    try {
      const response = await apiClient.post('/api/workflows', data)
      return response.data.data || response.data
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        throw new Error('Cannot connect to backend server. Please make sure the backend is running on http://127.0.0.1:3000')
      }
      if (error.response?.status === 404) {
        throw new Error('Workflow API endpoint not found. Please check if the backend has /api/workflows route registered.')
      }
      throw error
    }
  },
  update: async (id: number, data: Partial<Workflow>): Promise<Workflow> => {
    try {
      const response = await apiClient.put(`/api/workflows/${id}`, data)
      return response.data.data || response.data
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        throw new Error('Cannot connect to backend server. Please make sure the backend is running on http://127.0.0.1:3000')
      }
      if (error.response?.status === 404) {
        throw new Error('Workflow API endpoint not found. Please check if the backend has /api/workflows route registered.')
      }
      throw error
    }
  },
  remove: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`/api/workflows/${id}`)
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        throw new Error('Cannot connect to backend server. Please make sure the backend is running on http://127.0.0.1:3000')
      }
      throw error
    }
  },
  test: async (id: number): Promise<{ success: boolean; message: string; issues: string[]; stats: any }> => {
    try {
      const response = await apiClient.post(`/api/workflows/${id}/test`)
      return response.data.data || response.data
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        throw new Error('Cannot connect to backend server. Please make sure the backend is running on http://127.0.0.1:3000')
      }
      throw error
    }
  },
  execute: async (id: number, profileIds: number[]): Promise<any> => {
    try {
      const response = await apiClient.post(`/api/workflows/${id}/execute`, { profileIds })
      return response.data.data || response.data
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        throw new Error('Cannot connect to backend server. Please make sure the backend is running on http://127.0.0.1:3000')
      }
      throw error
    }
  },
}

