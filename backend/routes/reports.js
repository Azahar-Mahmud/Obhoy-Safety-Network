const express = require('express');
const IncidentReport = require('../models/IncidentReport');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authMiddleware);

const DECAY_DAYS = 90;
const VALID_CATEGORIES = ['mugging', 'harassment', 'checkpost_harassment', 'poor_lighting', 'safe_spot'];

router.post('/', async (req, res) => {
  try {
    const { category, lat, lng, description } = req.body;
    if (!VALID_CATEGORIES.includes(category)) return res.status(400).json({ error: 'Invalid category.' });
    if (typeof lat !== 'number' || typeof lng !== 'number') return res.status(400).json({ error: 'Location required.' });
    
    const report = await IncidentReport.create({
      category,
      location: { type: 'Point', coordinates: [lng, lat] },
      description: description || '',
      reportedBy: req.userId,
    });
    res.status(201).json({ id: report._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

router.get('/nearby', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radiusKm = parseFloat(req.query.radius) || 5;
    
    if (isNaN(lat) || isNaN(lng)) return res.status(400).json({ error: 'lat and lng are required.' });
    
    const cutoff = new Date(Date.now() - DECAY_DAYS * 24 * 60 * 60 * 1000);

    const reports = await IncidentReport.find({
      createdAt: { $gte: cutoff },
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radiusKm * 1000,
        },
      },
    }).select('category location description createdAt verifiedBy');

    res.json(reports.map((r) => ({
      id: r._id,
      category: r.category,
      lat: r.location.coordinates[1],
      lng: r.location.coordinates[0],
      description: r.description,
      createdAt: r.createdAt,
      verifiedCount: r.verifiedBy.length,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

router.post('/:id/verify', async (req, res) => {
  try {
    const report = await IncidentReport.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found.' });
    if (report.verifiedBy.some((id) => id.toString() === req.userId)) {
      return res.status(400).json({ error: 'Already confirmed by you.' });
    }
    
    report.verifiedBy.push(req.userId);
    await report.save();
    res.json({ verifiedCount: report.verifiedBy.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

module.exports = router;