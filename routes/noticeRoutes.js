const router = require('express').Router();
const ctrl = require('../controllers/noticeController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/', ctrl.list);
router.post('/', requireAuth, requireRole('admin'), ctrl.create);
router.patch('/:id', requireAuth, requireRole('admin'), ctrl.update);
router.delete('/:id', requireAuth, requireRole('admin'), ctrl.remove);

module.exports = router;
