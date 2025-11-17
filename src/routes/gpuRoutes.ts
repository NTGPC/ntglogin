import { Router } from 'express';
import * as gpuController from '../controllers/gpuController';

const router = Router();

router.get('/', gpuController.getAll);
router.get('/angle/:angle', gpuController.getByAngle);
router.get('/brand/:brand', gpuController.getByBrand);

export default router;

