import { Router } from 'express';
import * as jobController from '../controllers/jobController';

const router = Router();

router.get('/', jobController.getAll);
router.get('/:id', jobController.getById);
router.post('/', jobController.create);
router.put('/:id', jobController.update);
router.delete('/:id', jobController.remove);

export default router;

