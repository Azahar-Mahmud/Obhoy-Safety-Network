const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.patch('/language', authMiddleware, async (req, res) => {
  const { language } = req.body;
  if (language !== 'en' && language !== 'bn') {
    return res.status(400).json({ error: 'Invalid language.' });
  }
  await User.findByIdAndUpdate(req.userId, { language });
  res.json({ language });
});

module.exports = router;