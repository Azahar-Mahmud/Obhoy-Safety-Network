const express = require('express');
require('dotenv').config();
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const contactsRoutes = require('./routes/contacts');
const sosRoutes = require('./routes/sos');
const trackRoutes = require('./routes/track');

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
app.use('/track', trackRoutes);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.listen(PORT, () => {
  console.log(`Obhoy backend listening on port ${PORT}`);
});