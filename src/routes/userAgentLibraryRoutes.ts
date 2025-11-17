import { Router } from 'express';
import * as userAgentLibraryController from '../controllers/userAgentLibraryController';

const router = Router();

router.get('/', userAgentLibraryController.getAll);
router.get('/value/:value', userAgentLibraryController.getByValue);
router.get('/os/:os', userAgentLibraryController.getByOS);

export default router;

