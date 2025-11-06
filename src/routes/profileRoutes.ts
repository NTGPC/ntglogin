import { Router } from 'express';
import * as profileController from '../controllers/profileController';

const router = Router();

router.get('/', profileController.getAll);
router.get('/:id', profileController.getById);
router.get('/:id/fingerprint', profileController.getFingerprint);
router.post('/', profileController.create);
router.put('/:id', profileController.update);
router.put('/:id/fingerprint', profileController.updateFingerprint);
router.delete('/:id', profileController.remove);

export default router;

