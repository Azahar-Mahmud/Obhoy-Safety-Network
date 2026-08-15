const mongoose = require('mongoose');

const locationViewSchema = new mongoose.Schema(
  {
    viewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    viewedId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    kind: { type: String, enum: ['opened', 'pinged'], default: 'opened' },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

locationViewSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
locationViewSchema.index({ viewedId: 1, createdAt: -1 });

module.exports = mongoose.model('LocationView', locationViewSchema);