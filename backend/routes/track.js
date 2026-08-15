const express = require('express');
const SosEvent = require('../models/SosEvent');
const JourneySession = require('../models/JourneySession');
const EvidenceSession = require('../models/EvidenceSession');
const User = require('../models/User'); // <--- ADDED

const router = express.Router();

router.get('/:token', async (req, res) => {
  const sos = await SosEvent.findOne({ trackingToken: req.params.token });
  if (sos) {
    const user = await User.findById(sos.userId);
    return res.json({
      kind: 'sos',
      status: sos.status,
      location: sos.location,
      updatedAt: sos.location?.updatedAt,
      language: user?.language || 'en', // <--- ADDED
    });
  }
  
  const journey = await JourneySession.findOne({ trackingToken: req.params.token });
  if (journey) {
    const user = await User.findById(journey.userId);
    return res.json({
      kind: 'journey',
      status: journey.status,
      location: journey.currentLocation,
      updatedAt: journey.currentLocation?.updatedAt,
      destinationLabel: journey.destinationLabel,
      geofence: journey.geofenceEnabled
        ? { center: journey.geofenceCenter, radiusMeters: journey.geofenceRadiusMeters, alerted: journey.geofenceAlerted }
        : null,
      lastTwoWayResponse: journey.lastTwoWayResponse,
      mode: journey.mode,
      scheduledDeadline: journey.scheduledDeadline,
      language: user?.language || 'en', // <--- ADDED
    });
  }
  
  const evidence = await EvidenceSession.findOne({ trackingToken: req.params.token });
  if (evidence) {
    const user = await User.findById(evidence.userId);
    return res.json({
      kind: 'evidence',
      status: evidence.status,
      location: evidence.location,
      updatedAt: evidence.location?.updatedAt,
      language: user?.language || 'en', // <--- ADDED
    });
  }

  return res.status(404).json({ error: 'Link not found or expired.' });
});

router.post('/:token/request-checkin', async (req, res) => {
  const journey = await JourneySession.findOne({ trackingToken: req.params.token, status: 'active' });
  if (!journey) return res.status(404).json({ error: 'Journey not found or not active.' });

  const cooldownMs = 2 * 60 * 1000;
  if (journey.pendingCheckinRequestedAt && Date.now() - journey.pendingCheckinRequestedAt.getTime() < cooldownMs) {
    return res.status(429).json({ error: 'A request was already sent recently.' });
  }

  journey.pendingCheckinRequest = true;
  journey.pendingCheckinRequestedAt = new Date();
  await journey.save();
  res.json({ requested: true });
});

module.exports = router;