import { Router } from 'express'
import * as n8n from '../services/n8n.service'
import * as repo from '../services/workflowRepo'

const router = Router()

// List n8n workflows (separate endpoint to avoid conflict with local editor workflows)
router.get('/n8n-workflows', async (_req, res) => {
  const rows = await repo.listWorkflows()
  res.json(rows)
})

// Import/sync from n8n
router.post('/n8n-workflows/importFromN8n', async (_req, res) => {
  try {
    const list = await n8n.listWorkflows()
    if (!Array.isArray(list) || list.length === 0) {
      return res.json({ message: 'No workflows found in n8n', saved: [] })
    }
    const saved = await repo.upsertFromN8n(list)
    return res.json({ message: `Synced ${saved.length} workflow(s)`, saved })
  } catch (error: any) {
    console.error('Error syncing from n8n:', error)
    return res.status(500).json({ 
      message: error?.message || 'Failed to sync from n8n',
      error: error?.response?.data || error?.stack 
    })
  }
})

// Create n8n workflow
router.post('/n8n-workflows', async (req, res) => {
  const { name, n8nWorkflowId, description } = req.body || {}
  if (!name || !n8nWorkflowId) {
    return res.status(400).json({ message: 'name and n8nWorkflowId required' })
  }
  const wf = await repo.createWorkflow({ name, n8nWorkflowId, description })
  return res.status(201).json(wf)
})

// Update n8n workflow
router.put('/n8n-workflows/:id', async (req, res) => {
  const id = Number(req.params.id)
  const wf = await repo.updateWorkflow(id, req.body || {})
  res.json(wf)
})

// Delete n8n workflow
router.delete('/n8n-workflows/:id', async (req, res) => {
  const id = Number(req.params.id)
  await repo.deleteWorkflow(id)
  res.json({ success: true })
})

// Assign n8n workflow to profiles
router.post('/n8n-workflows/:id/assign', async (req, res) => {
  const id = Number(req.params.id)
  const { profileIds } = req.body || {}
  if (!Array.isArray(profileIds) || profileIds.length === 0) {
    return res.status(400).json({ message: 'profileIds required' })
  }
  const out = await repo.assignProfiles(id, profileIds)
  return res.json(out)
})

// Run n8n workflow for profiles (enqueue)
router.post('/n8n-workflows/:id/run', async (req, res) => {
  const workflowId = Number(req.params.id)
  const { profileIds, payload, vars } = req.body || {}
  if (!Array.isArray(profileIds) || profileIds.length === 0) {
    return res.status(400).json({ message: 'profileIds required' })
  }
  const created = [] as any[]
  for (const pid of profileIds) {
    const execPayload = { ...(payload || {}), ...(vars ? { vars } : {}) }
    const exec = await repo.createJobExecution({ profileId: Number(pid), workflowId, payload: execPayload })
    // TODO: enqueue to worker queue system here
    created.push(exec)
  }
  return res.json({ created })
})

// Executions list
router.get('/executions', async (req, res) => {
  const { profileId, workflowId, status, skip, take } = req.query as any
  const rows = await repo.listExecutions({
    profileId: profileId ? Number(profileId) : undefined,
    workflowId: workflowId ? Number(workflowId) : undefined,
    status: status ? String(status) : undefined,
  }, skip ? Number(skip) : 0, take ? Number(take) : 50)
  res.json(rows)
})

router.get('/executions/:id', async (req, res) => {
  const id = Number(req.params.id)
  const row = await repo.getExecutionById(id)
  if (!row) {
    return res.status(404).json({ message: 'Not found' })
  }
  return res.json(row)
})

// Get assignments for profile(s)
router.get('/n8n-workflows/assignments', async (req, res) => {
  try {
    const { profileId, profileIds } = req.query as any
    if (profileId) {
      const rows = await repo.getAssignmentsByProfileId(Number(profileId))
      return res.json(rows)
    }
    if (profileIds) {
      const ids = (Array.isArray(profileIds) ? profileIds : String(profileIds).split(',')).map(Number).filter(n => !isNaN(n))
      if (ids.length === 0) {
        return res.status(400).json({ message: 'Invalid profileIds' })
      }
      const rows = await repo.getAssignmentsByProfileIds(ids)
      return res.json(rows)
    }
    return res.status(400).json({ message: 'profileId or profileIds required' })
  } catch (error: any) {
    console.error('Error in /workflows/assignments:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

export default router


