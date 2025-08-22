// routes/authRoutes.js
const router = require('express').Router();
const {
  signup,
  login,
  me,
  createSubadmin,
  listUsers,
  verifyEmail,           // ✅ add
  resendVerification,    // ✅ add
} = require('../controllers/authController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.post('/signup', signup);
router.post('/login', login);

// NEW: verification endpoints
router.get('/verify/:token', verifyEmail);
router.post('/resend-verification', resendVerification);

router.get('/me', requireAuth, me);
router.post('/admin/create-subadmin', requireAuth, requireRole('admin'), createSubadmin);
router.get('/admin/users', requireAuth, requireRole('admin'), listUsers);

module.exports = router;
