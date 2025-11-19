import { Router } from 'express';
import * as userAgentController from '../controllers/userAgentController';

const router = Router();

router.get('/', userAgentController.findAll);
router.get('/:id', userAgentController.findById);
router.post('/', userAgentController.create);
router.put('/:id', userAgentController.update);
router.delete('/:id', userAgentController.remove);
router.get('/os/:os', userAgentController.findByOS);
router.get('/value/:value', userAgentController.findByValue);

export default router;

