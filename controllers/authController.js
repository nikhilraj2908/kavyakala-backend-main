const User = require('../models/User');
const { signToken } = require('../middleware/auth');

// POST /api/signup  (public)
exports.signup = async (req, res) => {
  try {
    const { name, email, handle, password } = req.body;
    if (!name || !email || !handle || !password)
      return res.status(400).json({ message: 'All fields are required' });

    const exists = await User.findOne({ $or: [{ email }, { handle }] });
    if (exists) return res.status(409).json({ message: 'Email or handle already in use' });

    const user = await User.create({ name, email, handle, password, role: 'user' });
    const token = signToken({ id: user._id, role: user.role });

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, handle: user.handle, role: user.role }
    });
  } catch (err) {
    console.error('signup error:', err);
    res.status(500).json({ message: 'Signup failed' });
  }
};

// POST /api/login  (public)
exports.login = async (req, res) => {
  try {
    const { emailOrHandle, password } = req.body;
    if (!emailOrHandle || !password) return res.status(400).json({ message: 'Missing credentials' });

    const user = await User.findOne({
      $or: [{ email: emailOrHandle.toLowerCase() }, { handle: emailOrHandle.toLowerCase() }]
    }).select('+password');

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    if (!user.isActive) return res.status(403).json({ message: 'Account disabled' });

    const token = signToken({ id: user._id, role: user.role });

    res.json({
      token,
      user: { id: user._id, name: user.name, handle: user.handle, role: user.role }
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ message: 'Login failed' });
  }
};

// GET /api/me  (auth)
exports.me = async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  if (!user) return res.status(404).json({ message: 'Not found' });
  res.json({ id: user._id, name: user.name, handle: user.handle, role: user.role });
};

// POST /api/admin/create-subadmin  (admin only)
exports.createSubadmin = async (req, res) => {
  const { name, email, handle, password } = req.body;
  if (!name || !email || !handle || !password)
    return res.status(400).json({ message: 'All fields are required' });

  const exists = await User.findOne({ $or: [{ email }, { handle }] });
  if (exists) return res.status(409).json({ message: 'Email or handle already in use' });

  const sub = await User.create({ name, email, handle, password, role: 'subadmin' });
  res.status(201).json({ id: sub._id, name: sub.name, handle: sub.handle, role: sub.role });
};

// GET /api/admin/users  (admin only)
exports.listUsers = async (_req, res) => {
  const users = await User.find().select('name email handle role isActive createdAt').sort({ createdAt: -1 });
  res.json(users);
};
