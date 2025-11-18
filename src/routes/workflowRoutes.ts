import { Router } from 'express';
import * as workflowController from '../controllers/workflowController';
import * as repo from '../services/workflowRepo';

const router = Router();

router.get('/', workflowController.getAll);
router.get('/:id', workflowController.getById);
router.post('/', workflowController.create);
router.put('/:id', workflowController.update);
router.delete('/:id', workflowController.remove);
router.post('/:id/test', workflowController.test);
router.post('/:id/execute', workflowController.execute);
router.post('/run-for-profile', workflowController.runWorkflowForProfile);

router.post('/:id/assign', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { profileIds } = req.body || {};
    if (!Array.isArray(profileIds) || profileIds.length === 0) {
      return res.status(400).json({ message: 'profileIds required' });
    }
    const out = await repo.assignProfiles(id, profileIds);
    return res.json(out);
  } catch (error: any) {
    console.error('Error assigning workflow:', error);
    return res.status(500).json({ message: error?.message || 'Internal server error' });
  }
});

export default router;

