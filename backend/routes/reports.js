const express = require('express');
const IncidentReport = require('../models/IncidentReport');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authMiddleware);

const DECAY_DAYS = 90;
const VALID_CATEGORIES = ['mugging', 'harassment', 'checkpost_harassment', 'poor_lighting', 'safe_spot'];

// --- STEP 1: The scoring function ---
const SEVERITY_WEIGHTS = {
  mugging: -3,
  harassment: -2.5,
  checkpost_harassment: -2,
  poor_lighting: -1,
  safe_spot: 2,
};

function computeAreaScore(reports) {
  if (reports.length === 0) {
    return { score: null, label: 'Not enough data', reportCount: 0 };
  }

  const now = Date.now();
  let rawScore = 0;
  for (const report of reports) {
    const ageDays = (now - new Date(report.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const recencyWeight = Math.max(0, 1 - ageDays / 90); // matches the existing 90-day decay window
    const severityWeight = SEVERITY_WEIGHTS[report.category] || 0;
    const verificationMultiplier = report.verifiedCount > 0 ? 1.5 : 1;
    rawScore += severityWeight * recencyWeight * verificationMultiplier;
  }

  const normalized = Math.max(1, Math.min(5, 3 + rawScore));
  const score = Math.round(normalized * 10) / 10;

  let label;
  if (score >= 4) label = 'Generally safe';
  else if (score >= 3) label = 'Some caution advised';
  else if (score >= 2) label = 'Exercise caution';
  else label = 'High caution advised';

  return { score, label, reportCount: reports.length };
}
// ------------------------------------

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

// --- STEP 2: The Area Score Route ---
router.get('/area-score', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radiusKm = parseFloat(req.query.radius) || 1;
    
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
    }).select('category createdAt verifiedBy');

    const summarized = reports.map((r) => ({
      category: r.category,
      createdAt: r.createdAt,
      verifiedCount: r.verifiedBy ? r.verifiedBy.length : 0,
    }));

    res.json(computeAreaScore(summarized));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});
// ------------------------------------

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

// --- STEP 2: Report Deletion (Supports 6s Undo) ---
router.delete('/:id', async (req, res) => {
  try {
    const report = await IncidentReport.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    // Ensure the user owns this report
    if (report.reportedBy.toString() !== req.userId) {
      return res.status(403).json({ error: 'You can only delete your own reports.' });
    }

    await report.deleteOne();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

module.exports = router;