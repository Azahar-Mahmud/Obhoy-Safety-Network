const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const DEMO_ACCOUNTS = [
  { phone: '+8801700000001', pin: '1234' },
  { phone: '+8801700000002', pin: '1234' },
  { phone: '+8801700000003', pin: '1234' },
];

async function seed() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in .env');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB. Seeding demo accounts...\n');

    for (const acct of DEMO_ACCOUNTS) {
      const pinHash = await bcrypt.hash(acct.pin, 10);
      await User.findOneAndUpdate(
        { phone: acct.phone },
        {
          phone: acct.phone,
          pinHash,
          phoneVerified: true,
          failedPinAttempts: 0,
        },
        { upsert: true, new: true }
      );
      console.log(`✓ Seeded Demo Account: ${acct.phone} | PIN: ${acct.pin}`);
    }

    console.log('\nAll demo accounts seeded successfully!');
  } catch (err) {
    console.error('Seeding failed:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

seed();