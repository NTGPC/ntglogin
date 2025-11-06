import axios, { AxiosInstance } from 'axios';

const N8N_URL = process.env.N8N_URL || 'http://127.0.0.1:5678';
const N8N_USER = process.env.N8N_USER || 'admin';
const N8N_PASS = process.env.N8N_PASS || 'admin123';

function createClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: N8N_URL,
    auth: {
      username: N8N_USER,
      password: N8N_PASS,
    },
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });
  return instance;
}

const client = createClient();

export async function execWorkflow(
  workflowId: string,
  payload: any
): Promise<{ executionId: string }> {
  const { data } = await client.post(`/rest/workflows/${encodeURIComponent(workflowId)}/run`, {
    workflowId,
    runData: payload ?? {},
  });

  // n8n returns an execution id under data.id in many versions
  const executionId = data?.id || data?.executionId || data?.data?.executionId;
  if (!executionId) {
    throw new Error('Failed to start n8n workflow: missing execution id');
  }
  return { executionId: String(executionId) };
}

export async function getExecution(
  executionId: string
): Promise<{
  status: 'waiting' | 'new' | 'running' | 'success' | 'error';
  data?: any;
}> {
  const { data } = await client.get(`/rest/executions/${encodeURIComponent(executionId)}`);
  const status = (data?.status || data?.data?.status || '').toLowerCase();
  if (status === 'success' || status === 'finished') {
    return { status: 'success', data: data?.data ?? data };
  }
  if (status === 'error' || status === 'failed') {
    return { status: 'error', data: data?.data ?? data };
  }
  if (status === 'running' || status === 'active') {
    return { status: 'running' };
  }
  if (status === 'new' || status === 'waiting') {
    return { status: 'waiting' };
  }
  // Fallback
  return { status: 'running' };
}

export async function callWebhook(
  relativePath: string,
  payload: any,
  headers?: Record<string, string>
): Promise<any> {
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  const { data } = await client.post(path, payload ?? {}, { headers });
  return data;
}

export async function listWorkflows(): Promise<Array<{ id: string; name: string; active: boolean }>> {
  const { data } = await client.get('/rest/workflows');
  const arr = Array.isArray(data) ? data : (data?.data || []);
  return arr.map((w: any) => ({ id: String(w.id), name: w.name || 'Untitled', active: !!w.active }));
}

export default { execWorkflow, getExecution, callWebhook };


