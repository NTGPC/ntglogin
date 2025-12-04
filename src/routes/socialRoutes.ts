import { Router } from 'express';
import * as socialController from '../controllers/socialController';

const router = Router();

router.post('/scan', socialController.scan);
router.get('/list', socialController.list);
router.put('/:id/status', socialController.updateStatus);

export default router;

