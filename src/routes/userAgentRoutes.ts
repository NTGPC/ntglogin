import { Router } from 'express';
import * as userAgentController from '../controllers/userAgentController';

const router = Router();

router.get('/', userAgentController.getAll);
router.get('/:id', userAgentController.getById);
router.post('/', userAgentController.create);
router.patch('/:id', userAgentController.update);
router.delete('/:id', userAgentController.remove);

export default router;

