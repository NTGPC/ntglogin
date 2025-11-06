import { Router } from 'express';
import * as jobExecutionController from '../controllers/jobExecutionController';

const router = Router();

router.get('/', jobExecutionController.getAll);
router.get('/:id', jobExecutionController.getById);
router.post('/', jobExecutionController.create);
router.put('/:id', jobExecutionController.update);
router.delete('/:id', jobExecutionController.remove);

export default router;
