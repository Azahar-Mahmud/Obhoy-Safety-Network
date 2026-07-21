const mongoose = require('mongoose');

const sosEventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  trackingToken: { type: String, required: true, unique: true },
  status: { type: String, enum: ['active', 'resolved', 'cancelled'], default: 'active' },
  location: {
    lat: Number,
    lng: Number,
    accuracy: Number,
    updatedAt: Date,
  },
  channelUsed: { type: String, enum: ['backend', 'native'], default: 'backend' },
  contactsNotified: [{
    contactId: mongoose.Schema.Types.ObjectId,
    name: String,
    phone: String,
    status: { type: String, enum: ['sent', 'failed'], default: 'sent' },
  }],
  resolvedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('SosEvent', sosEventSchema);