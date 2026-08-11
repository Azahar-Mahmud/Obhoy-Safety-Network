const express = require('express');
require('dotenv').config();
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const contactsRoutes = require('./routes/contacts');
const sosRoutes = require('./routes/sos');
const trackRoutes = require('./routes/track');
const journeyRoutes = require('./routes/journey');
const internalRoutes = require('./routes/internal');
const reportsRoutes = require('./routes/reports');
const evidenceRoutes = require('./routes/evidence'); 
const safetyCheckinsRoutes = require('./routes/safetyCheckins'); 
const communityAlertRoutes = require('./routes/communityAlerts'); // <--- ADDED for Obhoy_29

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Obhoy backend is running' });
});

app.use('/auth', authRoutes);
app.use('/contacts', contactsRoutes);
app.use('/sos', sosRoutes);
app.use('/medical-card', require('./routes/medicalCard'));
app.use('/track', trackRoutes);
app.use('/journey', journeyRoutes);
app.use('/internal', internalRoutes);
app.use('/reports', reportsRoutes);
app.use('/evidence', evidenceRoutes); 
app.use('/safety-checkins', safetyCheckinsRoutes); 
app.use('/community-alerts', communityAlertRoutes); // <--- ADDED for Obhoy_29

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.listen(PORT, () => {
  console.log(`Obhoy backend listening on port ${PORT}`);
});