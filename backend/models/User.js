const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  pinHash: { type: String, default: null },
  phoneVerified: { type: Boolean, default: false },
  otpHash: { type: String, default: null },
  otpExpiresAt: { type: Date, default: null },
  otpLastSentAt: { type: Date, default: null },
  failedPinAttempts: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);