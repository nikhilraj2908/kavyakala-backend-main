const Writing = require('../models/Writing');

// GET /api/writings?q=&poetId=&categories=...,..&language=&featured=&sortBy=
exports.list = async (req, res) => {
  const { q, poetId, categories, language, featured, sortBy } = req.query;
  const filter = { visibility: 'public' };

  if (poetId) filter.poetId = poetId;
  if (language && language !== 'all') filter.language = language;
  if (featured !== undefined) filter.featured = featured === 'true';

  if (q) filter.$or = [
    { title: { $regex: q, $options: 'i' } },
    { body: { $regex: q, $options: 'i' } }
  ];

  if (categories) {
    const arr = String(categories).split(',').map(s => s.trim()).filter(Boolean);
    if (arr.length) filter.categories = { $in: arr };
  }

  let query = Writing.find(filter);
  if (sortBy === 'mostLiked') query = query.sort({ likes: -1, createdAt: -1 });
  else query = query.sort({ createdAt: -1 });

  const list = await query.lean();
  res.json(list.map(p => ({ id: p._id, ...p })));
};

// GET /api/writings/featured
exports.featured = async (_req, res) => {
  const items = await Writing.find({ featured: true, visibility: 'public' })
    .sort({ createdAt: -1 }).lean();
  res.json(items.map(p => ({ id: p._id, ...p })));
};

// GET /api/writings/:id
exports.getOne = async (req, res) => {
  const p = await Writing.findById(req.params.id).lean();
  if (!p) return res.status(404).json({ message: 'Writing not found' });
  res.json({ id: p._id, ...p });
};

// POST /api/writings  (auth) — user creates a poem
exports.create = async (req, res) => {
  const { title, body, language, categories, poetId, visibility } = req.body;
  if (!title || !body) return res.status(400).json({ message: 'Title and body are required' });

  const doc = await Writing.create({
    title, body,
    language: language || 'hi',
    categories: categories || [],
    poetId: poetId || undefined,           // can be empty for user-generated
    authorId: req.user.id,
    visibility: visibility || 'public',
  });
  res.status(201).json({ id: doc._id, ...doc.toObject() });
};

// POST /api/writings/:id/like  (auth)
exports.like = async (req, res) => {
  const w = await Writing.findById(req.params.id);
  if (!w) return res.status(404).json({ message: 'Writing not found' });

  const uid = req.user.id;
  if (!w.likedBy.some(id => id.equals(uid))) {
    w.likedBy.push(uid);
    w.likes = w.likedBy.length;
    await w.save();
  }
  res.json({ likes: w.likes });
};

// POST /api/writings/:id/unlike  (auth)
exports.unlike = async (req, res) => {
  const w = await Writing.findById(req.params.id);
  if (!w) return res.status(404).json({ message: 'Writing not found' });

  const uid = req.user.id;
  const before = w.likedBy.length;
  w.likedBy = w.likedBy.filter(id => !id.equals(uid));
  if (w.likedBy.length !== before) {
    w.likes = w.likedBy.length;
    await w.save();
  }
  res.json({ likes: w.likes });
};

// GET /api/writings/:id/comments
exports.listComments = async (req, res) => {
  const w = await Writing.findById(req.params.id).lean();
  if (!w) return res.status(404).json({ message: 'Writing not found' });
  res.json((w.comments || []).map(c => ({ id: c._id, ...c })));
};

// POST /api/writings/:id/comments  (auth)
exports.addComment = async (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ message: 'Content required' });

  const w = await Writing.findById(req.params.id);
  if (!w) return res.status(404).json({ message: 'Writing not found' });

  const c = { userId: req.user.id, userName: req.user.handle || 'User', content: content.trim() };
  w.comments.push(c);
  await w.save();

  const saved = w.comments[w.comments.length - 1];
  res.status(201).json({ id: saved._id, ...saved.toObject() });
};

// POST /api/writings/:id/toggle-featured (admin)
exports.toggleFeatured = async (req, res) => {
  const w = await Writing.findById(req.params.id);
  if (!w) return res.status(404).json({ message: 'Writing not found' });
  w.featured = !w.featured;
  await w.save();
  res.json(w.featured);
};
