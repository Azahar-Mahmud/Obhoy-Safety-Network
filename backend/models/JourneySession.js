const mongoose = require('mongoose');

const journeySessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  trackingToken: { type: String, required: true, unique: true },
  status: { type: String, enum: ['active', 'arrived', 'overdue_alerted', 'cancelled'], default: 'active' },
  destinationLabel: { type: String, default: '' },
  currentLocation: {
    lat: Number,
    lng: Number,
    accuracy: Number,
    updatedAt: Date,
  },
  checkinIntervalMinutes: { type: Number, default: 30 },
  lastCheckinAt: { type: Date, default: Date.now },
  contactsNotified: [{
    contactId: mongoose.Schema.Types.ObjectId,
    name: String,
    phone: String,
    status: { type: String, enum: ['sent', 'failed'], default: 'sent' },
  }],
}, { timestamps: true });

module.exports = mongoose.model('JourneySession', journeySessionSchema);