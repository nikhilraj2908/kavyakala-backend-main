const mongoose = require('mongoose');

const PoetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    aka:  { type: String, trim: true, index: true },   // 👈 add this
    era:  { type: String, trim: true },
    avatarUrl: { type: String },
    bioShort: { type: String },
    bio: { type: String },

    languages: {
      type: [String],
      enum: ['hi', 'en'],
      default: ['hi']
    },

    featured: { type: Boolean, default: false, index: true },
    followersCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// keep the id transform
PoetSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => { ret.id = ret._id; delete ret._id; return ret; }
});
PoetSchema.set('toObject', { virtuals: true, versionKey: false });

module.exports = mongoose.model('Poet', PoetSchema);
