import { Router } from 'express';

import { EditorController } from '../controllers/editorController';

const router = Router();

router.get('/scan', EditorController.scanFiles);
router.post('/render', EditorController.renderVideo);

export default router;

