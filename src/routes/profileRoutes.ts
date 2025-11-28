import { Router } from 'express';
import * as profileController from '../controllers/profileController';

const router = Router();

// Route import phải đặt TRƯỚC route /:id để tránh conflict
router.post('/import', profileController.importProfiles);
router.post('/run-bulk', profileController.runBulkProfiles);

router.get('/', profileController.getAll);
router.get('/:id', profileController.getById);
router.get('/:id/fingerprint', profileController.getFingerprint);
router.post('/generate-fingerprint', profileController.generateFingerprint);
router.post('/user-agent', profileController.getUserAgent);
router.post('/', profileController.create);
router.put('/:id', profileController.update);
router.post('/update/:id', profileController.update); // Route POST mới để cập nhật profile (tránh lỗi CORS)
router.post('/:id/start-with-workflow', profileController.startProfileWithWorkflow); // Route mới để start profile và tự động chạy workflow
router.put('/:id/fingerprint', profileController.updateFingerprint);
router.delete('/:id', profileController.remove);

export default router;

