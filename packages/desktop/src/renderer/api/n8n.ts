import axios from 'axios'

const api = axios.create({
  baseURL: '/api/n8n',
  withCredentials: true,
})

export async function callWebhook(path: string, payload: any, headers?: Record<string, string>) {
  const { data } = await api.post('/webhook', { path, payload, headers })
  return data
}

export async function execWorkflow(workflowId: string, payload: any): Promise<{ executionId: string }> {
  const { data } = await api.post(`/workflows/${encodeURIComponent(workflowId)}/execute`, { payload })
  return data
}

export async function getExecution(id: string) {
  const { data } = await api.get(`/executions/${encodeURIComponent(id)}`)
  return data
}

export default { callWebhook, execWorkflow, getExecution }


