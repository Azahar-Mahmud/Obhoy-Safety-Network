const express = require('express');
const JourneySession = require('../models/JourneySession');
const TrustedContact = require('../models/TrustedContact');
const User = require('../models/User');
const { sendSms } = require('../utils/smsGateway');

const router = express.Router();

router.post('/check-overdue-journeys', async (req, res) => {
  if (req.query.secret !== process.env.INTERNAL_CRON_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const now = Date.now();
  const activeJourneys = await JourneySession.find({ status: 'active' });
  let alerted = 0;

  for (const journey of activeJourneys) {
    
    // --- STEP 4: Branch the overdue check ---
    let deadline;
    if (journey.mode === 'scheduled') {
      if (!journey.scheduledDeadline) continue;
      deadline = journey.scheduledDeadline.getTime();
    } else {
      deadline = new Date(journey.lastCheckinAt).getTime() + journey.checkinIntervalMinutes * 60 * 1000;
    }

    if (now < deadline) continue;
    // ----------------------------------------

    const user = await User.findById(journey.userId);
    const contacts = await TrustedContact.find({ userId: journey.userId });
    const trackUrl = `${process.env.WEB_TRACKER_URL}/${journey.trackingToken}`;
    
    // --- STEP 4: Mode-specific alert message ---
    const message = journey.mode === 'scheduled'
      ? `Obhoy Alert: ${user.phone} did not confirm safety by their scheduled check-in time. Track live location: ${trackUrl}`
      : `Obhoy Alert: ${user.phone} missed a journey check-in. Track live location: ${trackUrl}`;
    // -------------------------------------------

    const notified = [];
    for (const contact of contacts) {
      try {
        await sendSms(contact.phone, message);
        notified.push({ contactId: contact._id, name: contact.name, phone: contact.phone, status: 'sent' });
      } catch (err) {
        notified.push({ contactId: contact._id, name: contact.name, phone: contact.phone, status: 'failed' });
      }
    }

    journey.status = 'overdue_alerted';
    journey.contactsNotified = notified;
    await journey.save();
    alerted += 1;
  }

  res.json({ checked: activeJourneys.length, alerted });
});

module.exports = router;