const express = require('express');
const mongoose = require('mongoose');
const FamilyLink = require('../models/FamilyLink');
const LiveLocation = require('../models/LiveLocation');
const LocationView = require('../models/LocationView');
const SosEvent = require('../models/SosEvent');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const { normalizePhone } = require('../utils/phone');
const { sendSms } = require('../utils/textbee'); // SMSGate
const { tSms } = require('../utils/i18n');

const router = express.Router();

const MAX_LINKS = 6;
const VIEW_LOG_DAYS = 7;
const VIEW_DEDUPE_MS = 15 * 60 * 1000;
const SOS_ACTIVE_WINDOW_MS = 60 * 60 * 1000;

async function activeLinkedIds(userId) {
  const links = await FamilyLink.find({
    status: 'active',
    $or: [{ requesterId: userId }, { recipientId: userId }],
  });
  return links.map((l) =>
    String(l.requesterId) === String(userId) ? l.recipientId : l.requesterId
  );
}

async function countLinks(userId) {
  return FamilyLink.countDocuments({
    status: 'active',
    $or: [{ requesterId: userId }, { recipientId: userId }],
  });
}

// ---------- invite ----------
router.post('/invite', authMiddleware, async (req, res) => {
  const phone = normalizePhone(req.body.phone || '');
  if (!phone) return res.status(400).json({ error: 'Invalid phone number.' });

  const me = await User.findById(req.userId);
  if (me.phone === phone) return res.status(400).json({ error: 'That is your own number.' });

  if ((await countLinks(req.userId)) >= MAX_LINKS) {
    return res.status(400).json({ error: 'Limit reached.' });
  }

  const other = await User.findOne({ phone });

  if (!other) {
    // Not an Obhoy user yet - send one SMS invite and stop.
    try {
      await sendSms(phone, tSms(me.language, 'sms.family_invite', { name: me.phone }));
    } catch (err) {
      console.error('Family invite SMS failed:', err.message);
    }
    return res.json({ invited: false, smsSent: true });
  }

  const existing = await FamilyLink.findOne({
    $or: [
      { requesterId: req.userId, recipientId: other._id },
      { requesterId: other._id, recipientId: req.userId },
    ],
  });
  if (existing) {
    return res.status(400).json({ error: 'Already linked or invited.' });
  }

  await FamilyLink.create({ requesterId: req.userId, recipientId: other._id });
  res.json({ invited: true, smsSent: false });
});

// ---------- respond ----------
router.post('/invite/:id/respond', authMiddleware, async (req, res) => {
  const { accept } = req.body;
  const link = await FamilyLink.findById(req.params.id);
  if (!link || String(link.recipientId) !== String(req.userId)) {
    return res.status(404).json({ error: 'Not found.' });
  }
  if (link.status !== 'pending') return res.status(400).json({ error: 'Already resolved.' });

  if (!accept) {
    await link.deleteOne();
    return res.json({ accepted: false });
  }

  if ((await countLinks(req.userId)) >= MAX_LINKS) {
    return res.status(400).json({ error: 'Limit reached.' });
  }

  link.status = 'active';
  link.acceptedAt = new Date();
  await link.save();
  res.json({ accepted: true });
});

// ---------- unlink ----------
router.delete('/link/:userId', authMiddleware, async (req, res) => {
  await FamilyLink.deleteOne({
    $or: [
      { requesterId: req.userId, recipientId: req.params.userId },
      { requesterId: req.params.userId, recipientId: req.userId },
    ],
  });
  res.json({ removed: true });
});

// ---------- publish my location ----------
router.post('/location', authMiddleware, async (req, res) => {
  const { lat, lng, accuracy, batteryLevel } = req.body;
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'Location required.' });
  }

  const doc = await LiveLocation.findOneAndUpdate(
    { userId: req.userId },
    {
      $set: {
        location: { type: 'Point', coordinates: [lng, lat] },
        accuracy: typeof accuracy === 'number' ? accuracy : null,
        batteryLevel: typeof batteryLevel === 'number' ? batteryLevel : null,
        lastPublishedAt: new Date(),
        refreshRequestedAt: null, // publishing satisfies any outstanding request
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.json({ published: true, sharingPaused: doc.sharingPaused });
});

// ---------- ask someone for a fresh fix ----------
router.post('/ping/:userId', authMiddleware, async (req, res) => {
  const linked = await activeLinkedIds(req.userId);
  if (!linked.some((id) => String(id) === String(req.params.userId))) {
    return res.status(403).json({ error: 'Not linked.' });
  }

  await LiveLocation.findOneAndUpdate(
    { userId: req.params.userId },
    { $set: { refreshRequestedAt: new Date() } },
    { upsert: true, setDefaultsOnInsert: true }
  );

  await LocationView.create({
    viewerId: req.userId,
    viewedId: req.params.userId,
    kind: 'pinged',
    expiresAt: new Date(Date.now() + VIEW_LOG_DAYS * 86400000),
  });

  res.json({ requested: true });
});

// ---------- pause / resume ----------
router.patch('/sharing', authMiddleware, async (req, res) => {
  const paused = !!req.body.paused;
  await LiveLocation.findOneAndUpdate(
    { userId: req.userId },
    { $set: { sharingPaused: paused } },
    { upsert: true, setDefaultsOnInsert: true }
  );
  res.json({ sharingPaused: paused });
});

// ---------- time-boxed live mode (Part D) ----------
const MAX_LIVE_MINUTES = 60;
router.patch('/live', authMiddleware, async (req, res) => {
  const minutes = Math.min(Number(req.body.minutes) || 0, MAX_LIVE_MINUTES);
  await LiveLocation.findOneAndUpdate(
    { userId: req.userId },
    { $set: { liveUntil: minutes > 0 ? new Date(Date.now() + minutes * 60000) : null } },
    { upsert: true, setDefaultsOnInsert: true }
  );
  res.json({ liveUntil: minutes > 0 ? new Date(Date.now() + minutes * 60000) : null });
});

// ---------- full family state ----------
router.get('/state', authMiddleware, async (req, res) => {
  const linkedIds = await activeLinkedIds(req.userId);

  const [users, locations, mine, pendingLinks, sosEvents] = await Promise.all([
    User.find({ _id: { $in: linkedIds } }).select('_id phone language'),
    LiveLocation.find({ userId: { $in: linkedIds } }),
    LiveLocation.findOne({ userId: req.userId }),
    FamilyLink.find({ recipientId: req.userId, status: 'pending' }),
    SosEvent.find({
      userId: { $in: linkedIds },
      createdAt: { $gt: new Date(Date.now() - SOS_ACTIVE_WINDOW_MS) },
    }).select('userId createdAt'),
  ]);

  const locByUser = new Map(locations.map((l) => [String(l.userId), l]));
  const sosByUser = new Set(sosEvents.map((e) => String(e.userId)));

  const members = users.map((u) => {
    const loc = locByUser.get(String(u._id));
    const paused = loc ? loc.sharingPaused : false;
    const hasFix = !!(loc && loc.location && loc.location.coordinates && loc.location.coordinates.length === 2);
    return {
      userId: u._id,
      phone: u.phone,
      sharingPaused: paused,
      lat: !paused && hasFix ? loc.location.coordinates[1] : null,
      lng: !paused && hasFix ? loc.location.coordinates[0] : null,
      accuracy: !paused && hasFix ? loc.accuracy : null,
      batteryLevel: !paused && hasFix ? loc.batteryLevel : null,
      lastPublishedAt: !paused && hasFix ? loc.lastPublishedAt : null,
      sosActive: sosByUser.has(String(u._id)),
    };
  });

  if (req.query.opened === '1' && linkedIds.length) {
    const since = new Date(Date.now() - VIEW_DEDUPE_MS);
    const recent = await LocationView.find({
      viewerId: req.userId,
      viewedId: { $in: linkedIds },
      createdAt: { $gt: since },
    }).select('viewedId');
    const already = new Set(recent.map((v) => String(v.viewedId)));
    const toLog = linkedIds.filter((id) => !already.has(String(id)));
    if (toLog.length) {
      await LocationView.insertMany(
        toLog.map((id) => ({
          viewerId: req.userId,
          viewedId: id,
          kind: 'opened',
          expiresAt: new Date(Date.now() + VIEW_LOG_DAYS * 86400000),
        }))
      );
    }
  }

  const invitesFrom = await User.find({
    _id: { $in: pendingLinks.map((l) => l.requesterId) },
  }).select('_id phone');
  const phoneById = new Map(invitesFrom.map((u) => [String(u._id), u.phone]));

  res.json({
    members,
    invites: pendingLinks.map((l) => ({
      id: l._id,
      fromPhone: phoneById.get(String(l.requesterId)) || '',
    })),
    me: {
      sharingPaused: mine ? mine.sharingPaused : false,
      refreshRequested: !!(mine && mine.refreshRequestedAt),
      liveUntil: mine ? mine.liveUntil : null,
    },
    linkLimit: MAX_LINKS,
  });
});

// ---------- who looked at me ----------
router.get('/viewers', authMiddleware, async (req, res) => {
  const views = await LocationView.find({ viewedId: req.userId })
    .sort({ createdAt: -1 })
    .limit(20);
  const viewers = await User.find({
    _id: { $in: views.map((v) => v.viewerId) },
  }).select('_id phone');
  const phoneById = new Map(viewers.map((u) => [String(u._id), u.phone]));

  res.json(
    views.map((v) => ({
      phone: phoneById.get(String(v.viewerId)) || '',
      kind: v.kind,
      at: v.createdAt,
    }))
  );
});

module.exports = router;