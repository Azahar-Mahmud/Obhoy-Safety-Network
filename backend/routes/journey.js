const express = require('express');
const crypto = require('crypto');
const JourneySession = require('../models/JourneySession');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authMiddleware);

router.post('/start', async (req, res) => {
  try {
    const { destinationLabel, checkinIntervalMinutes, lat, lng, accuracy } = req.body;
    const trackingToken = crypto.randomBytes(16).toString('hex');
    const journey = await JourneySession.create({
      userId: req.userId,
      trackingToken,
      destinationLabel: destinationLabel || '',
      checkinIntervalMinutes: checkinIntervalMinutes || 30,
      lastCheckinAt: new Date(),
      currentLocation: lat && lng ? { lat, lng, accuracy, updatedAt: new Date() } : undefined,
    });
    const trackUrl = `${process.env.WEB_TRACKER_URL}/${trackingToken}`;
    res.json({ journeyId: journey._id, trackingToken, trackUrl, checkinIntervalMinutes: journey.checkinIntervalMinutes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.patch('/:id/location', async (req, res) => {
  const { lat, lng, accuracy } = req.body;
  const journey = await JourneySession.findOne({ _id: req.params.id, userId: req.userId, status: 'active' });
  if (!journey) return res.status(404).json({ error: 'No active journey found.' });
  journey.currentLocation = { lat, lng, accuracy, updatedAt: new Date() };
  await journey.save();
  res.json({ updated: true });
});

router.patch('/:id/checkin', async (req, res) => {
  const journey = await JourneySession.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId, status: 'active' },
    { lastCheckinAt: new Date() },
    { new: true }
  );
  if (!journey) return res.status(404).json({ error: 'No active journey found.' });
  res.json({ checkedIn: true, lastCheckinAt: journey.lastCheckinAt });
});

router.patch('/:id/arrive', async (req, res) => {
  const journey = await JourneySession.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { status: 'arrived' },
    { new: true }
  );
  if (!journey) return res.status(404).json({ error: 'Journey not found.' });
  res.json({ arrived: true });
});

router.patch('/:id/cancel', async (req, res) => {
  const journey = await JourneySession.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { status: 'cancelled' },
    { new: true }
  );
  if (!journey) return res.status(404).json({ error: 'Journey not found.' });
  res.json({ cancelled: true });
});

router.get('/active', async (req, res) => {
  const journey = await JourneySession.findOne({ userId: req.userId, status: 'active' });
  res.json(journey);
});

module.exports = router;