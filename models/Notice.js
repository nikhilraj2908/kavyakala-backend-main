const mongoose = require('mongoose');
const { Schema } = mongoose;

const NoticeSchema = new Schema({
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true },
  pinned: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notice', NoticeSchema);
