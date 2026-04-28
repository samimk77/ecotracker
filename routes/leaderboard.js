const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Ward = require('../models/Ward');

// GET /api/leaderboard?scope=global|ward&wardId=xxx&period=week|month|all
router.get('/', async (req, res) => {
  try {
    const { scope = 'global', wardId, period = 'all', limit = 20 } = req.query;

    const filter = {};
    if (scope === 'ward' && wardId) filter.ward = wardId;

    // For period filtering we'd need timestamps on stats entries
    // For now, rank by total impactScore (extend later with time-scoped collection)
    const users = await User.find(filter)
      .sort({ 'stats.impactScore': -1 })
      .limit(parseInt(limit))
      .select('name avatar wardName stats organization');

    const ranked = users.map((u, i) => ({
      rank: i + 1,
      id: u._id,
      name: u.name,
      avatar: u.avatar,
      wardName: u.wardName,
      organization: u.organization,
      impactScore: u.stats.impactScore,
      eventsJoined: u.stats.eventsJoined,
      issuesRaised: u.stats.issuesRaised,
      issuesResolved: u.stats.issuesResolved,
    }));

    // Ward leaderboard (by sustainability score)
    let wardLeaderboard = [];
    if (scope === 'global') {
      wardLeaderboard = await Ward.find({})
        .sort({ sustainabilityScore: -1 })
        .limit(10)
        .select('name sustainabilityScore scoreBreakdown city');
    }

    res.json({ success: true, users: ranked, wards: wardLeaderboard });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
