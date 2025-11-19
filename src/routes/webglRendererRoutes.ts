import { Router } from 'express';
import * as webglRendererController from '../controllers/webglRendererController';

const router = Router();

router.get('/', webglRendererController.getAll);
router.get('/:id', webglRendererController.getById);
router.post('/', webglRendererController.create);
router.put('/:id', webglRendererController.update);
router.delete('/:id', webglRendererController.remove);
router.get('/os/:os', webglRendererController.getByOS);
router.get('/vendor/:vendor', webglRendererController.getByVendor);

export default router;

