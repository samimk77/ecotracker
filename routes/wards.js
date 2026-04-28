// ===================== routes/wards.js =====================
const express = require('express');
const router = express.Router();
const Ward = require('../models/Ward');
const Issue = require('../models/Issue');
const { protect, requireAdmin, requireMod } = require('../middleware/auth');

// GET /api/wards — all wards with sustainability scores (for map overlay)
router.get('/', async (req, res) => {
  try {
    const wards = await Ward.find({})
      .select('name sustainabilityScore scoreBreakdown center boundary city')
      .populate('moderator', 'name');
    res.json({ success: true, wards });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/wards/:id — single ward detail
router.get('/:id', async (req, res) => {
  try {
    const ward = await Ward.findById(req.params.id).populate('moderator', 'name avatar');
    if (!ward) return res.status(404).json({ success: false, message: 'Ward not found.' });

    const openIssues = await Issue.countDocuments({ ward: ward._id, status: 'open' });
    const resolvedIssues = await Issue.countDocuments({ ward: ward._id, status: 'resolved' });

    res.json({ success: true, ward, stats: { openIssues, resolvedIssues } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/wards — create ward (admin only)
router.post('/', protect, requireAdmin, async (req, res) => {
  try {
    const ward = await Ward.create(req.body);
    res.status(201).json({ success: true, ward });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/wards/:id — update ward authority email (admin/mod)
router.put('/:id', protect, requireMod, async (req, res) => {
  try {
    const allowed = ['authorityEmail', 'authorityName', 'moderator'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const ward = await Ward.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ success: true, ward });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
