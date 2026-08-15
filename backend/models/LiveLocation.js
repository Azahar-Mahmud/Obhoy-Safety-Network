const mongoose = require('mongoose');

const liveLocationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: undefined },
    },
    accuracy: { type: Number, default: null },
    batteryLevel: { type: Number, default: null },
    sharingPaused: { type: Boolean, default: false },
    refreshRequestedAt: { type: Date, default: null },
    liveUntil: { type: Date, default: null },
    lastPublishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LiveLocation', liveLocationSchema);