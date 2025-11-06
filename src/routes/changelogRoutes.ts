import { Router } from 'express';
import * as changelogController from '../controllers/changelogController';

const router = Router();

// Get all changelogs
router.get('/', changelogController.getAll);

// Get changelogs by version
router.get('/version/:version', changelogController.getByVersion);

// Get changelogs by type
router.get('/type', changelogController.getByType);

// Get changelogs by category
router.get('/category', changelogController.getByCategory);

// Create changelog
router.post('/', changelogController.create);

// Update changelog
router.put('/:id', changelogController.update);

// Delete changelog
router.delete('/:id', changelogController.remove);

export default router;

