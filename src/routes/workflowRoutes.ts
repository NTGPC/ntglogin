import { Router } from 'express';
import * as workflowController from '../controllers/workflowController';

const router = Router();

router.get('/', workflowController.getAll);
router.get('/:id', workflowController.getById);
router.post('/', workflowController.create);
router.put('/:id', workflowController.update);
router.delete('/:id', workflowController.remove);
router.post('/:id/test', workflowController.test);
router.post('/:id/execute', workflowController.execute);
router.post('/run-for-profile', workflowController.runWorkflowForProfile);

export default router;

