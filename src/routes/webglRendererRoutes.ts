import { Router } from 'express';
import * as webglRendererController from '../controllers/webglRendererController';

const router = Router();

router.get('/', webglRendererController.findAll);
router.get('/:id', webglRendererController.findById);
router.post('/', webglRendererController.create);
router.put('/:id', webglRendererController.update);
router.delete('/:id', webglRendererController.remove);
router.get('/os/:os', webglRendererController.findByOS);
router.get('/vendor/:vendor', webglRendererController.findByVendor);

export default router;

