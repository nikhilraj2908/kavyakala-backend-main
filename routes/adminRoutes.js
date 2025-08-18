// routes/adminRoutes.js
const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/adminController');

// All routes here are admin-only
router.use(requireAuth, requireRole('admin'));

router.post('/create-subadmin', ctrl.createSubadmin);
router.get('/users', ctrl.listUsers);

router.patch('/users/:id/activate', ctrl.activateUser);
router.patch('/users/:id/deactivate', ctrl.deactivateUser);
router.patch('/users/:id/role', ctrl.changeRole);
router.delete('/users/:id', ctrl.deleteUser);

module.exports = router;
