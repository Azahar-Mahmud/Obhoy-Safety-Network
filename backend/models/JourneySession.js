const mongoose = require('mongoose');

const journeySessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  trackingToken: { type: String, required: true, unique: true },
  status: { type: String, enum: ['active', 'arrived', 'overdue_alerted', 'cancelled'], default: 'active' },
  destinationLabel: { type: String, default: '' },

  // --- STEP 1: Real Coordinates for Origin and Destination (Obhoy_48) ---
  destinationLat: { type: Number, default: null },
  destinationLng: { type: Number, default: null },
  originLat: { type: Number, default: null },
  originLng: { type: Number, default: null },
  // ----------------------------------------------------------------------

  currentLocation: {
    lat: Number,
    lng: Number,
    accuracy: Number,
    updatedAt: Date,
  },
  checkinIntervalMinutes: { type: Number, default: 30 },
  lastCheckinAt: { type: Date, default: Date.now },
  
  mode: { type: String, enum: ['interval', 'scheduled'], default: 'interval' },
  scheduledDeadline: { type: Date, default: null },

  contactsNotified: [{
    contactId: mongoose.Schema.Types.ObjectId,
    name: String,
    phone: String,
    status: { type: String, enum: ['sent', 'failed'], default: 'sent' },
  }],
  
  // Geofence Safety Alerts
  geofenceEnabled: { type: Boolean, default: false },
  geofenceRadiusMeters: { type: Number, default: null },
  geofenceCenter: { lat: Number, lng: Number },
  geofenceAlerted: { type: Boolean, default: false },

  // Two-Way Check-in Confirmation
  pendingCheckinRequest: { type: Boolean, default: false },
  pendingCheckinRequestedAt: { type: Date, default: null },
  lastTwoWayResponse: { type: String, enum: ['safe', 'help', null], default: null },
  lastTwoWayResponseAt: { type: Date, default: null },

}, { timestamps: true });

module.exports = mongoose.model('JourneySession', journeySessionSchema);