const express = require('express');
const crypto = require('crypto');
const JourneySession = require('../models/JourneySession');
const User = require('../models/User'); 
const TrustedContact = require('../models/TrustedContact'); 
const { sendSms } = require('../utils/smsGateway'); 
const { tSms } = require('../utils/i18n'); // <--- ADDED
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authMiddleware);

// Helper function to calculate distance in meters
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
    const { 
      destinationLabel, checkinIntervalMinutes, lat, lng, accuracy, 
      geofenceEnabled, geofenceRadiusMeters, mode, scheduledDeadline,
      destinationLat, destinationLng, originLat, originLng // <--- Added for Obhoy_48
    } = req.body;
    
    const trackingToken = crypto.randomBytes(16).toString('hex');
    
    const journey = await JourneySession.create({
      userId: req.userId,
      trackingToken,
      destinationLabel: destinationLabel || '',
      // Store real coordinates
      destinationLat: typeof destinationLat === 'number' ? destinationLat : null,
      destinationLng: typeof destinationLng === 'number' ? destinationLng : null,
      originLat: typeof originLat === 'number' ? originLat : (typeof lat === 'number' ? lat : null),
      originLng: typeof originLng === 'number' ? originLng : (typeof lng === 'number' ? lng : null),
      mode: mode || 'interval',
      scheduledDeadline: mode === 'scheduled' && scheduledDeadline ? new Date(scheduledDeadline) : null,
      checkinIntervalMinutes: checkinIntervalMinutes || 30,
      lastCheckinAt: new Date(),
      currentLocation: lat && lng ? { lat, lng, accuracy, updatedAt: new Date() } : undefined,
      geofenceEnabled: !!geofenceEnabled,
      geofenceRadiusMeters: geofenceEnabled ? geofenceRadiusMeters : null,
      geofenceCenter: geofenceEnabled && typeof lat === 'number' ? { lat, lng } : undefined,
    });
    
    // --- BYPASS CARRIER SPAM FILTERS ---
    // Remove https:// so the telecom doesn't flag it as a spam link
    const rawUrl = process.env.WEB_TRACKER_URL.replace(/^https?:\/\//, '');
    const trackUrl = `${rawUrl}/${trackingToken}`;
    
    const contacts = await TrustedContact.find({ userId: req.userId });
    const user = await User.findById(req.userId);
    
    console.log(`[JOURNEY] Starting journey for ${user.phone}. Found ${contacts.length} trusted contacts.`);

    if (contacts.length > 0) {
      // Added random ID at the end so the telecom doesn't block duplicate messages
      const randomSalt = Math.floor(Math.random() * 10000);
      const startMessage = `Obhoy Alert: ${user.phone} started a journey${destinationLabel ? ' to ' + destinationLabel : ''}. Track here: ${trackUrl} (ID:${randomSalt})`;
      
      for (const contact of contacts) {
        try {
          await sendSms(contact.phone, startMessage);
          console.log(`[JOURNEY] SMS sent to ${contact.phone}`);
        } catch (err) {
          console.error(`[JOURNEY] SMS failed for ${contact.phone}:`, err.message);
        }
      }
    }
    // -----------------------------------

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

  // Geofence checking logic
  let insideGeofence = null;
  if (journey.geofenceEnabled && journey.geofenceCenter) {
    const distance = distanceMeters(journey.geofenceCenter.lat, journey.geofenceCenter.lng, lat, lng);
    insideGeofence = distance <= journey.geofenceRadiusMeters;
    const resetMarginMeters = 25;

    if (!insideGeofence && !journey.geofenceAlerted) {
      journey.geofenceAlerted = true;
      const contacts = await TrustedContact.find({ userId: req.userId });
      const user = await User.findById(req.userId);
      const trackUrl = `${process.env.WEB_TRACKER_URL}/${journey.trackingToken}`;
      const message = tSms(user.language, 'sms.geofence', { name: user.phone, link: trackUrl });
      
      contacts.forEach(contact => {
        sendSms(contact.phone, message).catch(err => 
          console.error('Geofence alert SMS failed for', contact.phone, err.message)
        );
      });
    } else if (insideGeofence && journey.geofenceAlerted && distance <= journey.geofenceRadiusMeters - resetMarginMeters) {
      journey.geofenceAlerted = false;
    }
  }

  await journey.save();
  
  res.json({ updated: true, insideGeofence, pendingCheckinRequest: journey.pendingCheckinRequest });
});

// The traveler's response route
router.patch('/:id/checkin-response', async (req, res) => {
  const { response } = req.body; // 'safe' or 'help'
  const journey = await JourneySession.findOne({ _id: req.params.id, userId: req.userId, status: 'active' });
  if (!journey) return res.status(404).json({ error: 'No active journey found.' });

  journey.pendingCheckinRequest = false;
  journey.lastTwoWayResponse = response;
  journey.lastTwoWayResponseAt = new Date();

  if (response === 'safe') {
    journey.lastCheckinAt = new Date();
    await journey.save();
    return res.json({ recorded: true });
  }

  const user = await User.findById(req.userId);
  const contacts = await TrustedContact.find({ userId: req.userId });
  const trackUrl = `${process.env.WEB_TRACKER_URL}/${journey.trackingToken}`;
  const message = tSms(user.language, 'sms.two_way_help', { name: user.phone, link: trackUrl });
  for (const contact of contacts) {
    try {
      await sendSms(contact.phone, message);
    } catch (err) {
      console.error('Two-way help alert SMS failed for', contact.phone, err.message);
    }
  }
  await journey.save();
  res.json({ recorded: true, escalated: true });
});

router.patch('/:id/checkin', async (req, res) => {
  const journey = await JourneySession.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId, status: 'active' },
    { lastCheckinAt: new Date() },
    { returnDocument: 'after' } // <--- CHANGED THIS
  );
  if (!journey) return res.status(404).json({ error: 'No active journey found.' });
  res.json({ checkedIn: true, lastCheckinAt: journey.lastCheckinAt });
});

router.patch('/:id/arrive', async (req, res) => {
  const journey = await JourneySession.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { status: 'arrived' },
    { returnDocument: 'after' } // <--- CHANGED THIS
  );
  if (!journey) return res.status(404).json({ error: 'Journey not found.' });
  res.json({ arrived: true });
});

router.patch('/:id/cancel', async (req, res) => {
  const journey = await JourneySession.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { status: 'cancelled' },
    { returnDocument: 'after' } // <--- CHANGED THIS
  );
  if (!journey) return res.status(404).json({ error: 'Journey not found.' });
  res.json({ cancelled: true });
});

router.get('/active', async (req, res) => {
  const journey = await JourneySession.findOne({ userId: req.userId, status: 'active' });
  res.json(journey);
});

module.exports = router;