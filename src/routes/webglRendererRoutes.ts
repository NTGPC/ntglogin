import { Router } from 'express';
import * as webglRendererController from '../controllers/webglRendererController';

const router = Router();

router.get('/', webglRendererController.getAll);
router.get('/:id', webglRendererController.getById);
router.post('/', webglRendererController.create);
router.patch('/:id', webglRendererController.update);
router.delete('/:id', webglRendererController.remove);

export default router;

