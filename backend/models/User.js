const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  name: { type: String, default: '' },   // <--- ADDED
  email: { type: String, default: '' },  // <--- ADDED
  pinHash: { type: String, default: null },
  phoneVerified: { type: Boolean, default: false },
  otpHash: { type: String, default: null },
  otpExpiresAt: { type: Date, default: null },
  otpLastSentAt: { type: Date, default: null },
  failedPinAttempts: { type: Number, default: 0 },
  language: { type: String, enum: ['en', 'bn'], default: 'en' },
  medicalCard: {
    bloodType: { type: String, default: null },
    weight: { type: String, default: null }, // Added to support your new medical UI
    allergies: { type: String, default: null },
    notes: { type: String, default: null },
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);