const express = require('express');
const crypto = require('crypto');
const SosEvent = require('../models/SosEvent');
const TrustedContact = require('../models/TrustedContact');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const { sendSms } = require('../utils/textbee');

const router = express.Router();
router.use(authMiddleware);

router.post('/trigger', async (req, res) => {
  try {
    const { lat, lng, accuracy } = req.body;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ error: 'Location required.' });
    }

    const user = await User.findById(req.userId);
    const contacts = await TrustedContact.find({ userId: req.userId });
    const trackingToken = crypto.randomBytes(16).toString('hex');

    const sosEvent = await SosEvent.create({
      userId: req.userId,
      trackingToken,
      location: { lat, lng, accuracy, updatedAt: new Date() },
      channelUsed: 'backend',
      contactsNotified: [],
    });

    const trackUrl = `${process.env.WEB_TRACKER_URL}/${trackingToken}`;
    const message = `Obhoy Alert: ${user.phone} needs help. Track live location: ${trackUrl}`;

    const notified = [];
    for (const contact of contacts) {
      try {
        await sendSms(contact.phone, message);
        notified.push({ contactId: contact._id, name: contact.name, phone: contact.phone, status: 'sent' });
      } catch (err) {
        console.error('SOS SMS failed for', contact.phone, err.message);
        notified.push({ contactId: contact._id, name: contact.name, phone: contact.phone, status: 'failed' });
      }
    }

    sosEvent.contactsNotified = notified;
    await sosEvent.save();

    res.json({ sosEventId: sosEvent._id, trackingToken, trackUrl, contactsNotified: notified });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.patch('/:id/location', async (req, res) => {
  const { lat, lng, accuracy } = req.body;
  const sosEvent = await SosEvent.findOne({ _id: req.params.id, userId: req.userId, status: 'active' });
  if (!sosEvent) return res.status(404).json({ error: 'No active SOS found.' });
  sosEvent.location = { lat, lng, accuracy, updatedAt: new Date() };
  await sosEvent.save();
  res.json({ updated: true });
});

router.patch('/:id/resolve', async (req, res) => {
  const sosEvent = await SosEvent.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { status: 'resolved', resolvedAt: new Date() },
    { new: true }
  );
  if (!sosEvent) return res.status(404).json({ error: 'SOS not found.' });
  res.json({ resolved: true });
});

module.exports = router;