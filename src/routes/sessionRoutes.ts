import { Router } from 'express';
import * as sessionController from '../controllers/sessionController';

const router = Router();

router.get('/', sessionController.getAll);
router.get('/:id', sessionController.getById);
router.post('/', sessionController.create);
router.put('/:id', sessionController.update);
router.delete('/:id', sessionController.remove);
router.post('/:id/capture-tabs', sessionController.captureTabs);

export default router;

