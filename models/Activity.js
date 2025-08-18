const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema(
  {
    type: { type: String, required: true },            // 'poet' | 'poem' | 'user' | 'notice' | ...
    action: { type: String, required: true },          // 'create' | 'update' | 'delete' | 'feature' ...
    title: { type: String, required: true },           // human readable (e.g., "नया कवि जोड़ा गया")
    entity: { type: String },                          // collection/entity
    entityId: { type: String },
    userName: { type: String },                        // actor
  },
  { timestamps: true }
);

ActivitySchema.set('toJSON', {
  virtuals: true, versionKey: false,
  transform: (_doc, ret) => { ret.id = ret._id; delete ret._id; return ret; }
});

module.exports = mongoose.model('Activity', ActivitySchema);
