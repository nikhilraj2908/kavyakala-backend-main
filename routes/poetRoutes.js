const router = require('express').Router();
const ctrl = require('../controllers/poetController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Public
router.get('/', ctrl.list);
router.get('/featured', ctrl.featured);
router.get('/:id', ctrl.getOne);

// Auth actions
router.post('/:id/follow', requireAuth, ctrl.follow);
router.post('/:id/unfollow', requireAuth, ctrl.unfollow);

// Admin
router.post('/', requireAuth, requireRole('admin'), ctrl.create);
router.patch('/:id', requireAuth, requireRole('admin'), ctrl.update);
router.delete('/:id', requireAuth, requireRole('admin'), ctrl.remove);
router.post('/:id/toggle-featured', requireAuth, requireRole('admin'), ctrl.toggleFeatured);

module.exports = router;
