const mongoose = require('mongoose');

const safetyCheckinSchema = new mongoose.Schema({
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

// 2dsphere index for fast geospatial queries
safetyCheckinSchema.index({ location: '2dsphere' });
// TTL index to automatically delete the check-in after it expires
safetyCheckinSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('SafetyCheckin', safetyCheckinSchema);