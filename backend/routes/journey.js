const express = require('express');
const crypto = require('crypto');
const JourneySession = require('../models/JourneySession');
const User = require('../models/User'); // NEW: Needed for Step 3 alerts
const TrustedContact = require('../models/TrustedContact'); // NEW: Needed for Step 3 alerts
const { sendSms } = require('../utils/smsGateway'); // NEW: Needed for Step 3 alerts (Verify this path matches your project structure!)
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authMiddleware);

// NEW: Helper function to calculate distance in meters (Step 3)
function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

router.post('/start', async (req, res) => {
  try {
    // Added geofenceEnabled and geofenceRadiusMeters to extracted body fields (Step 2)
    const { destinationLabel, checkinIntervalMinutes, lat, lng, accuracy, geofenceEnabled, geofenceRadiusMeters } = req.body;
    const trackingToken = crypto.randomBytes(16).toString('hex');
    
    const journey = await JourneySession.create({
      userId: req.userId,
      trackingToken,
      destinationLabel: destinationLabel || '',
      checkinIntervalMinutes: checkinIntervalMinutes || 30,
      lastCheckinAt: new Date(),
      currentLocation: lat && lng ? { lat, lng, accuracy, updatedAt: new Date() } : undefined,
      // NEW: Set geofence variables on creation (Step 2)
      geofenceEnabled: !!geofenceEnabled,
      geofenceRadiusMeters: geofenceEnabled ? geofenceRadiusMeters : null,
      geofenceCenter: geofenceEnabled && typeof lat === 'number' ? { lat, lng } : undefined,
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

  // NEW: Geofence checking logic (Step 3)
  let insideGeofence = null;
  if (journey.geofenceEnabled && journey.geofenceCenter) {
    const distance = distanceMeters(journey.geofenceCenter.lat, journey.geofenceCenter.lng, lat, lng);
    insideGeofence = distance <= journey.geofenceRadiusMeters;
    const resetMarginMeters = 25; // Hysteresis margin to prevent alert spam right on the edge

    if (!insideGeofence && !journey.geofenceAlerted) {
      journey.geofenceAlerted = true;
      const contacts = await TrustedContact.find({ userId: req.userId });
      const user = await User.findById(req.userId);
      const trackUrl = `${process.env.WEB_TRACKER_URL}/${journey.trackingToken}`;
      const message = `Obhoy Alert: ${user.phone} left their safe zone. Live location: ${trackUrl}`;
      
      for (const contact of contacts) {
        try {
          await sendSms(contact.phone, message);
        } catch (err) {
          console.error('Geofence alert SMS failed for', contact.phone, err.message);
        }
      }
    } else if (insideGeofence && journey.geofenceAlerted && distance <= journey.geofenceRadiusMeters - resetMarginMeters) {
      // User is comfortably back inside the safe zone, reset the alert flag
      journey.geofenceAlerted = false;
    }
  }

  await journey.save();
  // We return insideGeofence to the mobile app so it knows if it needs to show a banner
  res.json({ updated: true, insideGeofence });
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