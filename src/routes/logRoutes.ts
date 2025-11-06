import { Router } from 'express';
import * as logController from '../controllers/logController';

const router = Router();

router.get('/', logController.getAll);
router.post('/', logController.create);

export default router;

