// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { Schema } = mongoose;

const UserSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  handle: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['user', 'subadmin', 'admin'], default: 'user', index: true },
  isActive: { type: Boolean, default: true },

  // NEW: follow & like helpers
  followingPoets: [{ type: Schema.Types.ObjectId, ref: 'Poet' }],
  likedWritings: [{ type: Schema.Types.ObjectId, ref: 'Writing' }],
}, { timestamps: true });

UserSchema.pre('save', async function(next){
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', UserSchema);
