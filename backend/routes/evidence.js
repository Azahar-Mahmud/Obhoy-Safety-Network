const express = require('express');
const crypto = require('crypto');
const EvidenceSession = require('../models/EvidenceSession');
const TrustedContact = require('../models/TrustedContact');
const authMiddleware = require('../middleware/authMiddleware');
const { sendSms } = require('../utils/smsGateway'); // <--- FIXED HERE

const router = express.Router();
router.use(authMiddleware);

router.post('/start', async (req, res) => {
  try {
    const contacts = await TrustedContact.find({ userId: req.userId });
    const trackingToken = crypto.randomBytes(16).toString('hex');
    const session = await EvidenceSession.create({ userId: req.userId, trackingToken, contactsNotified: [] });

    const trackUrl = `${process.env.WEB_TRACKER_URL || 'https://obhoy-tracker.onrender.com'}/${trackingToken}`;
    const message = `Obhoy: recording started. Live location: ${trackUrl}`;
    const notified = [];
    for (const contact of contacts) {
      try {
        await sendSms(contact.phone, message);
        notified.push({ name: contact.name, phone: contact.phone, status: 'sent' });
      } catch {
        notified.push({ name: contact.name, phone: contact.phone, status: 'failed' });
      }
    }
    session.contactsNotified = notified;
    await session.save();
    res.json({ id: session._id, trackingToken });
  } catch (err) {
    console.error('[EVIDENCE BACKEND ERROR]', err);
    res.status(500).json({ error: 'Failed to start evidence session' });
  }
});

router.patch('/:id/location', async (req, res) => {
  try {
    const { lat, lng } = req.body;
    await EvidenceSession.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { location: { lat, lng, updatedAt: new Date() } }
    );
    res.json({ updated: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update location' });
  }
});

router.patch('/:id/stop', async (req, res) => {
  try {
    await EvidenceSession.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, { status: 'stopped' });
    res.json({ stopped: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to stop session' });
  }
});

module.exports = router;