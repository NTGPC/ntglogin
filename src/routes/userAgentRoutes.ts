import { Router } from 'express';
import * as userAgentController from '../controllers/userAgentController';

const router = Router();

router.get('/', userAgentController.getAll);
router.get('/os/:os', userAgentController.getByOS);
router.get('/value/:value', userAgentController.getByValue);
router.get('/:id', userAgentController.getById);
router.post('/', userAgentController.create);
router.put('/:id', userAgentController.update);
router.delete('/:id', userAgentController.remove);

export default router;

