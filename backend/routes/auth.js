const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { sendSms } = require('../utils/textbee');
const { normalizeToE164 } = require('../utils/phone');

const router = express.Router();

const otpRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many requests, please try again shortly.' },
});

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const OTP_TTL_MS = 90 * 1000; // 90 seconds
const MAX_PIN_ATTEMPTS = 5;

// Start signup: creates/reuses a pending user, sends the OTP
router.post('/signup/start', otpRateLimiter, async (req, res) => {
  try {
    const phone = normalizeToE164(req.body.phone || '');
    if (!/^\+880\d{10}$/.test(phone)) {
      return res.status(400).json({ error: 'Enter a valid Bangladesh phone number.' });
    }

    let user = await User.findOne({ phone });

    if (user && user.pinHash) {
      return res.status(409).json({ error: 'This number is already registered. Please log in.' });
    }
    if (!user) {
      user = new User({ phone });
    }
    if (user.otpLastSentAt && (Date.now() - user.otpLastSentAt.getTime()) < 60 * 1000) {
      return res.status(429).json({ error: 'Please wait a moment before requesting another code.' });
    }

    const otp = generateOtp();
    user.otpHash = await bcrypt.hash(otp, 10);
    user.otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
    user.otpLastSentAt = new Date();
    await user.save();

    try {
      await sendSms(phone, `Obhoy verification code: ${otp}`);
    } catch (err) {
      console.error('TextBee send failed:', err.message);
      // Not a fatal error — the mobile client's countdown falls through to PIN-only.
    }

    res.json({ phone, otpWindowSeconds: OTP_TTL_MS / 1000 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Verify the OTP code (optional path — skipped if it timed out)
router.post('/signup/verify-otp', async (req, res) => {
  try {
    const phone = normalizeToE164(req.body.phone || '');
    const { code } = req.body;
    const user = await User.findOne({ phone });

    if (!user || !user.otpHash || !user.otpExpiresAt) {
      return res.status(400).json({ error: 'No pending code for this number.' });
    }
    if (user.otpExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ error: 'Code expired.' });
    }
    const match = await bcrypt.compare(code || '', user.otpHash);
    if (!match) {
      return res.status(400).json({ error: 'Incorrect code.' });
    }

    user.phoneVerified = true;
    user.otpHash = null;
    user.otpExpiresAt = null;
    await user.save();

    res.json({ verified: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Set PIN — finishes signup whether or not the OTP step happened
router.post('/signup/set-pin', async (req, res) => {
  try {
    const phone = normalizeToE164(req.body.phone || '');
    const { pin } = req.body;

    if (!/^\d{4,6}$/.test(pin || '')) {
      return res.status(400).json({ error: 'PIN must be 4 to 6 digits.' });
    }
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ error: 'Start signup first.' });
    }

    user.pinHash = await bcrypt.hash(pin, 10);
    user.otpHash = null;
    user.otpExpiresAt = null;
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '90d' });
    res.json({ token, phoneVerified: user.phoneVerified });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Login — returning users
router.post('/login', async (req, res) => {
  try {
    const phone = normalizeToE164(req.body.phone || '');
    const { pin } = req.body;

    const user = await User.findOne({ phone });
    if (!user || !user.pinHash) {
      return res.status(404).json({ error: 'No account with this number. Please sign up.' });
    }
    if (user.failedPinAttempts >= MAX_PIN_ATTEMPTS) {
      return res.status(423).json({ error: 'Too many wrong attempts. This account is locked.' });
    }

    const match = await bcrypt.compare(pin || '', user.pinHash);
    if (!match) {
      user.failedPinAttempts += 1;
      await user.save();
      return res.status(401).json({
        error: 'Incorrect PIN.',
        attemptsRemaining: Math.max(MAX_PIN_ATTEMPTS - user.failedPinAttempts, 0),
      });
    }

    user.failedPinAttempts = 0;
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '90d' });
    res.json({ token, phoneVerified: user.phoneVerified });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;