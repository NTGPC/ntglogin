import { Router } from 'express'
import * as repo from '../services/workflowRepo'

const router = Router()

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
router.get('/workflows/assignments', async (req, res) => {
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


