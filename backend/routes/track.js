const express = require('express');
const SosEvent = require('../models/SosEvent');

const router = express.Router();

router.get('/:token', async (req, res) => {
  const sosEvent = await SosEvent.findOne({ trackingToken: req.params.token });
  if (!sosEvent) return res.status(404).json({ error: 'Link not found or expired.' });
  res.json({
    status: sosEvent.status,
    location: sosEvent.location,
    updatedAt: sosEvent.updatedAt,
  });
});

module.exports = router;