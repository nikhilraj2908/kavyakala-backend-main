const router = require('express').Router();
const { signup, login, me, createSubadmin, listUsers } = require('../controllers/authController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.post('/signup', signup);
router.post('/login', login);

router.get('/me', requireAuth, me);
router.post('/admin/create-subadmin', requireAuth, requireRole('admin'), createSubadmin);
router.get('/admin/users', requireAuth, requireRole('admin'), listUsers);

module.exports = router;
