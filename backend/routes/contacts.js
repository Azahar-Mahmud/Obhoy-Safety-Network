const express = require('express');
const TrustedContact = require('../models/TrustedContact');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const MAX_CONTACTS = 5;

router.use(authMiddleware);

router.get('/', async (req, res) => {
  const contacts = await TrustedContact.find({ userId: req.userId }).sort({ createdAt: 1 });
  res.json(contacts);
});

router.post('/', async (req, res) => {
  const count = await TrustedContact.countDocuments({ userId: req.userId });
  if (count >= MAX_CONTACTS) {
    return res.status(400).json({ error: `Maximum ${MAX_CONTACTS} trusted contacts allowed.` });
  }
  const { name, phone, relationship } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required.' });
  }
  const contact = await TrustedContact.create({ userId: req.userId, name, phone, relationship });
  res.status(201).json(contact);
});

router.patch('/:id', async (req, res) => {
  const contact = await TrustedContact.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    req.body,
    { new: true }
  );
  if (!contact) return res.status(404).json({ error: 'Contact not found.' });
  res.json(contact);
});

router.delete('/:id', async (req, res) => {
  const result = await TrustedContact.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!result) return res.status(404).json({ error: 'Contact not found.' });
  res.json({ deleted: true });
});

module.exports = router;