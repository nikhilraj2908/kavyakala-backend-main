const mongoose = require('mongoose');
const { Schema } = mongoose;

const CommentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  content: { type: String, required: true, trim: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

const WritingSchema = new Schema({
  poetId: { type: Schema.Types.ObjectId, ref: 'Poet' }, // optional for user-generated
  authorId: { type: Schema.Types.ObjectId, ref: 'User' }, // set for user-generated poems
  title: { type: String, required: true, trim: true },
  body: { type: String, required: true },
  language: { type: String, enum: ['hi', 'en'], default: 'hi' },
  categories: [{ type: String, trim: true }], // e.g., gazal, dohe, kavita
  visibility: { type: String, enum: ['public', 'followers', 'private'], default: 'public' },

  // likes
  likedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  likes: { type: Number, default: 0 },

  featured: { type: Boolean, default: false },

  comments: [CommentSchema],
}, { timestamps: true });

module.exports = mongoose.model('Writing', WritingSchema);
