import { Router, Request, Response } from 'express';
import * as n8n from '../services/n8n.service';

const router = Router();

// Restrict to localhost by default
router.use((req, res, next) => {
  const allowed = (process.env.ALLOW_EXTERNAL_N8N === 'true') || isLocalRequest(req);
  if (!allowed) {
    return res.status(403).json({ message: 'Forbidden: local access only' });
  }
  next();
});

function isLocalRequest(req: Request): boolean {
  const host = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
  return (
    host.includes('127.0.0.1') ||
    host.includes('::1') ||
    host === '::ffff:127.0.0.1' ||
    host === '::ffff:localhost'
  );
}

// POST /api/n8n/webhook
router.post('/webhook', async (req: Request, res: Response) => {
  const { path, payload, headers } = req.body || {};
  if (!path) return res.status(400).json({ message: 'Missing path' });
  try {
    const data = await n8n.callWebhook(String(path), payload, headers);
    res.json(data);
  } catch (err: any) {
    res.status(err?.response?.status || 500).json({ message: err?.message || 'n8n webhook error', detail: err?.response?.data });
  }
});

// POST /api/n8n/workflows/:workflowId/execute
router.post('/workflows/:workflowId/execute', async (req: Request, res: Response) => {
  const { workflowId } = req.params;
  const { payload } = req.body || {};
  if (!workflowId) return res.status(400).json({ message: 'Missing workflowId' });
  try {
    const { executionId } = await n8n.execWorkflow(String(workflowId), payload);
    res.json({ executionId });
  } catch (err: any) {
    res.status(err?.response?.status || 500).json({ message: err?.message || 'n8n execute error', detail: err?.response?.data });
  }
});

// GET /api/n8n/executions/:id
router.get('/executions/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: 'Missing execution id' });
  try {
    const data = await n8n.getExecution(String(id));
    res.json(data);
  } catch (err: any) {
    res.status(err?.response?.status || 500).json({ message: err?.message || 'n8n get execution error', detail: err?.response?.data });
  }
});

export default router;


