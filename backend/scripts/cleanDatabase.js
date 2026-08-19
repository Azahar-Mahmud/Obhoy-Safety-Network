const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const TrustedContact = require('../models/TrustedContact');
const IncidentReport = require('../models/IncidentReport');
const JourneySession = require('../models/JourneySession');
const SosEvent = require('../models/SosEvent');
const SafetyCheckin = require('../models/SafetyCheckin');
const CommunityAlert = require('../models/CommunityAlert');

async function cleanDatabase() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in .env');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB. Purging test and placeholder data...\n');

    // 1. Clear test contacts
    const contactsResult = await TrustedContact.deleteMany({});
    console.log(`✓ Deleted ${contactsResult.deletedCount} old test contacts.`);

    // 2. Clear test incident reports
    const reportsResult = await IncidentReport.deleteMany({});
    console.log(`✓ Deleted ${reportsResult.deletedCount} test incident reports.`);

    // 3. Clear old test journeys
    const journeysResult = await JourneySession.deleteMany({});
    console.log(`✓ Deleted ${journeysResult.deletedCount} test journey sessions.`);

    // 4. Clear test SOS events
    const sosResult = await SosEvent.deleteMany({});
    console.log(`✓ Deleted ${sosResult.deletedCount} test SOS events.`);

    // 5. Clear safety check-ins and community alerts
    await SafetyCheckin.deleteMany({});
    await CommunityAlert.deleteMany({});
    console.log(`✓ Purged temporary check-ins and alerts.`);

    console.log('\n✅ Database is now 100% clean and ready for real data!');
  } catch (err) {
    console.error('Cleanup failed:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

cleanDatabase();