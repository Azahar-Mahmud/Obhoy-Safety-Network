const express = require('express');
const User = require('../models/User');

const router = express.Router();

// GET: Fetch the user's current medical card data
router.get('/', async (req, res) => {
  const user = await User.findById(req.userId);
  res.json(user.medicalCard || {});
});

// PUT: Update the medical card data
router.put('/', async (req, res) => {
  const { bloodType, allergies, notes } = req.body;
  
  const user = await User.findByIdAndUpdate(
    req.userId,
    { medicalCard: { bloodType, allergies, notes } },
    { new: true } // Returns the updated document
  );
  
  res.json(user.medicalCard);
});

module.exports = router;