const express = require('express');
const SafetyCheckin = require('../models/SafetyCheckin');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const CHECKIN_LIFESPAN_MS = 3 * 60 * 60 * 1000; // 3 hours

router.post('/', authMiddleware, async (req, res) => {
  const { lat, lng } = req.body;
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'Location required.' });
  }
  await SafetyCheckin.create({
    location: { type: 'Point', coordinates: [lng, lat] },
    expiresAt: new Date(Date.now() + CHECKIN_LIFESPAN_MS),
  });
  res.json({ broadcast: true });
});

router.get('/nearby', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const radiusKm = parseFloat(req.query.radius) || 5;

  const checkins = await SafetyCheckin.find({
    expiresAt: { $gt: new Date() }, // Failsafe in case MongoDB's auto-delete is running a few seconds late
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: radiusKm * 1000,
      },
    },
  });

  res.json(checkins.map((c) => ({
    id: c._id,
    lat: c.location.coordinates[1],
    lng: c.location.coordinates[0],
    createdAt: c.createdAt,
  })));
});

module.exports = router;