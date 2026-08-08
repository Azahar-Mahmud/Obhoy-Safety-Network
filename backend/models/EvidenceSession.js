const mongoose = require('mongoose');

const evidenceSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  trackingToken: { type: String, required: true, unique: true },
  status: { type: String, enum: ['recording', 'stopped'], default: 'recording' },
  location: { lat: Number, lng: Number, updatedAt: Date },
  contactsNotified: [{ name: String, phone: String, status: { type: String, enum: ['sent', 'failed'] } }],
}, { timestamps: true });

module.exports = mongoose.model('EvidenceSession', evidenceSessionSchema);