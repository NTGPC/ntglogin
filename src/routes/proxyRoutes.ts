import { Router } from 'express';
import * as proxyController from '../controllers/proxyController';

const router = Router();

router.get('/', proxyController.getAll);
router.get('/:id', proxyController.getById);
router.post('/', proxyController.create);
router.put('/:id', proxyController.update);
router.delete('/:id', proxyController.remove);

export default router;

