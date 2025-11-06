import { Router } from 'express';
import * as fingerprintController from '../controllers/fingerprintController';

const router = Router();

router.get('/', fingerprintController.list);
router.post('/', fingerprintController.create);
router.delete('/:id', fingerprintController.remove);

export default router;


