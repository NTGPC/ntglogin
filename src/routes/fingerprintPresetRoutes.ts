import { Router } from 'express'
import * as presetController from '../controllers/fingerprintPresetController'

const router = Router()

router.get('/os/:os', presetController.getByOS)
router.get('/', presetController.getAll)
router.get('/:id', presetController.getById)
router.post('/', presetController.create)
router.patch('/:id', presetController.update)
router.delete('/:id', presetController.remove)

export default router

