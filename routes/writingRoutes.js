const router = require('express').Router();
const ctrl = require('../controllers/writingController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Public
router.get('/', ctrl.list);
router.get('/featured', ctrl.featured);
router.get('/:id', ctrl.getOne);
router.get('/:id/comments', ctrl.listComments);

// Auth
router.post('/', requireAuth, ctrl.create);
router.post('/:id/like', requireAuth, ctrl.like);
router.post('/:id/unlike', requireAuth, ctrl.unlike);
router.post('/:id/comments', requireAuth, ctrl.addComment);

// Admin
router.post('/:id/toggle-featured', requireAuth, requireRole('admin'), ctrl.toggleFeatured);

module.exports = router;
