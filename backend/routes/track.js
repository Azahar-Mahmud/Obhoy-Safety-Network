const express = require('express');
const SosEvent = require('../models/SosEvent');
const JourneySession = require('../models/JourneySession');

const router = express.Router();

router.get('/:token', async (req, res) => {
  const sos = await SosEvent.findOne({ trackingToken: req.params.token });
  if (sos) {
    return res.json({ kind: 'sos', status: sos.status, location: sos.location, updatedAt: sos.location?.updatedAt });
  }
  const journey = await JourneySession.findOne({ trackingToken: req.params.token });
  if (journey) {
    return res.json({
      kind: 'journey',
      status: journey.status,
      location: journey.currentLocation,
      updatedAt: journey.currentLocation?.updatedAt,
      destinationLabel: journey.destinationLabel,
    });
  }
  return res.status(404).json({ error: 'Link not found or expired.' });
});

module.exports = router;