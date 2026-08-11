const express = require('express');
const CommunityAlert = require('../models/CommunityAlert');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const ALERT_LIFESPAN_MS = 45 * 60 * 1000; // 45 minutes
const VALID_CATEGORIES = ['mugging', 'harassment', 'checkpost_harassment'];

router.post('/', authMiddleware, async (req, res) => {
  const { lat, lng, category } = req.body;
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'Location required.' });
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'Invalid category.' });
  }
  
  await CommunityAlert.create({
    category,
    location: { type: 'Point', coordinates: [lng, lat] },
    expiresAt: new Date(Date.now() + ALERT_LIFESPAN_MS),
  });
  
  res.json({ broadcast: true });
});

router.get('/nearby', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const radiusKm = parseFloat(req.query.radius) || 2; // Default 2km search radius

  const alerts = await CommunityAlert.find({
    expiresAt: { $gt: new Date() }, // Failsafe in case MongoDB TTL cleanup is delayed by a few seconds
    location: {
      $near: { 
        $geometry: { type: 'Point', coordinates: [lng, lat] }, 
        $maxDistance: radiusKm * 1000 
      },
    },
  });

  res.json(alerts.map((a) => ({
    id: a._id,
    category: a.category,
    lat: a.location.coordinates[1],
    lng: a.location.coordinates[0],
    createdAt: a.createdAt,
  })));
});

module.exports = router;