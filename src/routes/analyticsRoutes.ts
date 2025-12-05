import { Router } from 'express';

import * as controller from '../controllers/analyticsController'; // <-- PHẢI IMPORT ĐÚNG

const router = Router();

// Các hàm này phải tồn tại trong controller

router.post('/create', controller.createSession);

router.get('/list', controller.getSessions);

router.post('/scan', controller.runScan);

router.delete('/:id', controller.deleteSession);

router.put('/video/:id', controller.updateVideoStatus);

router.put('/:id', controller.updateSession); // <--- THÊM DÒNG NÀY (API SỬA)

router.get('/:id', controller.getSessionDetail); // Dòng này để cuối cùng

export default router;
