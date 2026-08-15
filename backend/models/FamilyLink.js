const mongoose = require('mongoose');

const familyLinkSchema = new mongoose.Schema(
  {
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'active'], default: 'pending' },
    acceptedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Stops the same person being invited twice in the same direction.
familyLinkSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });
familyLinkSchema.index({ recipientId: 1, status: 1 });

module.exports = mongoose.model('FamilyLink', familyLinkSchema);