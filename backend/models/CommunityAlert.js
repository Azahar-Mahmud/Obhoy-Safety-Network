const mongoose = require('mongoose');

const communityAlertSchema = new mongoose.Schema({
  category: { type: String, enum: ['mugging', 'harassment', 'checkpost_harassment'], required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

// Geospatial index for nearby searching
communityAlertSchema.index({ location: '2dsphere' });
// TTL index to automatically delete the record after 45 minutes
communityAlertSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('CommunityAlert', communityAlertSchema);