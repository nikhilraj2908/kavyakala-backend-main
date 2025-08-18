// controllers/adminController.js
const User = require('../models/User');

// Helper: forbid actions on admins unless caller is super-admin (here: any admin) but keep safety checks
async function ensureNotLastAdmin(targetUserId) {
  const target = await User.findById(targetUserId).lean();
  if (!target) return { ok: false, status: 404, msg: 'User not found' };

  if (target.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
    if (adminCount <= 1) {
      return { ok: false, status: 400, msg: 'Cannot modify/delete the last active admin' };
    }
  }
  return { ok: true, target };
}

// POST /api/admin/create-subadmin
exports.createSubadmin = async (req, res) => {
  try {
    const { name, email, handle, password } = req.body;
    if (!name || !email || !handle || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const exists = await User.findOne({ $or: [{ email }, { handle }] });
    if (exists) return res.status(409).json({ message: 'Email or handle already in use' });

    const sub = await User.create({ name, email, handle, password, role: 'subadmin' });
    return res.status(201).json({
      id: sub._id, name: sub.name, email: sub.email, handle: sub.handle, role: sub.role, isActive: sub.isActive
    });
  } catch (e) {
    console.error('createSubadmin error:', e);
    return res.status(500).json({ message: 'Failed to create subadmin' });
  }
};

// GET /api/admin/users
exports.listUsers = async (_req, res) => {
  const users = await User.find()
    .select('name email handle role isActive createdAt')
    .sort({ createdAt: -1 })
    .lean();
  return res.json(users.map(u => ({ id: u._id, ...u })));
};

// PATCH /api/admin/users/:id/activate
exports.activateUser = async (req, res) => {
  const { id } = req.params;
  const chk = await ensureNotLastAdmin(id);
  if (!chk.ok) return res.status(chk.status).json({ message: chk.msg });

  const user = await User.findByIdAndUpdate(id, { isActive: true }, { new: true }).lean();
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json({ id: user._id, isActive: user.isActive });
};

// PATCH /api/admin/users/:id/deactivate
exports.deactivateUser = async (req, res) => {
  const { id } = req.params;
  const chk = await ensureNotLastAdmin(id);
  if (!chk.ok) return res.status(chk.status).json({ message: chk.msg });

  const user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean();
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json({ id: user._id, isActive: user.isActive });
};

// PATCH /api/admin/users/:id/role
// body: { role: 'user' | 'subadmin' }  (admins cannot be created here; only via seed or manual op)
exports.changeRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  if (!['user', 'subadmin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role. Only user/subadmin allowed here.' });
  }

  const chk = await ensureNotLastAdmin(id);
  if (!chk.ok) return res.status(chk.status).json({ message: chk.msg });

  const user = await User.findByIdAndUpdate(id, { role }, { new: true }).lean();
  if (!user) return res.status(404).json({ message: 'User not found' });

  return res.json({ id: user._id, role: user.role });
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  const chk = await ensureNotLastAdmin(id);
  if (!chk.ok) return res.status(chk.status).json({ message: chk.msg });

  const result = await User.findByIdAndDelete(id).lean();
  if (!result) return res.status(404).json({ message: 'User not found' });

  return res.json({ deleted: true, id });
};
