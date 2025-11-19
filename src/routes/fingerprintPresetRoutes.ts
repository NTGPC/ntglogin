import { Router } from 'express'
import * as presetController from '../controllers/fingerprintPresetController'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.get('/', requireAuth, presetController.getAll)
router.get('/os/:os', requireAuth, presetController.getByOS)
router.get('/:id', requireAuth, presetController.getById)
router.post('/', requireAuth, presetController.create)
router.patch('/:id', requireAuth, presetController.update)
router.delete('/:id', requireAuth, presetController.remove)

export default router

