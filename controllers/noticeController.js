const Notice = require('../models/Notice');

// GET /api/notices (public)
exports.list = async (_req, res) => {
  const notices = await Notice.find().sort({ pinned: -1, createdAt: -1 }).lean();
  res.json(notices.map(n => ({ id: n._id, ...n })));
};

// POST /api/notices (admin)
exports.create = async (req, res) => {
  const n = await Notice.create(req.body);
  res.status(201).json({ id: n._id, ...n.toObject() });
};

// PATCH /api/notices/:id (admin)
exports.update = async (req, res) => {
  const n = await Notice.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
  if (!n) return res.status(404).json({ message: 'Notice not found' });
  res.json({ id: n._id, ...n });
};

// DELETE /api/notices/:id (admin)
exports.remove = async (req, res) => {
  const r = await Notice.findByIdAndDelete(req.params.id).lean();
  if (!r) return res.status(404).json({ message: 'Notice not found' });
  res.json({ deleted: true });
};
