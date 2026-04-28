const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Issue = require('../models/Issue');
const Event = require('../models/Event');
const { protect } = require('../middleware/auth');

// GET /api/profile/:userId
router.get('/:userId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password -notifications')
      .populate('ward', 'name sustainabilityScore');

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Contribution history
    const issues = await Issue.find({ author: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title status urgencyLevel createdAt wardName');

    const events = await Event.find({ participants: user._id })
      .sort({ date: -1 })
      .limit(10)
      .select('title date status wardName');

    const organizedEvents = await Event.find({ organizer: user._id })
      .sort({ date: -1 })
      .limit(5)
      .select('title date status participantCount');

    const recentVerifiedActions = [
      { id: 1, title: 'Mangrove Reforestation Phase 4', location: 'Surat Thani, Thailand', verifiedBy: 'Satellite Imagery', metric: '+2.4T CO2', time: '2 HOURS AGO', avatar: 'https://i.pravatar.cc/150?img=11' },
      { id: 2, title: 'Urban Canopy Initiative', location: 'Berlin, Germany', verifiedBy: 'On-site IoT Sensors', metric: '+150 Trees', time: '5 HOURS AGO', avatar: 'https://i.pravatar.cc/150?img=5' },
      { id: 3, title: 'Solar Grid Integration', location: 'Cape Town, South Africa', verifiedBy: 'Blockchain Ledger', metric: '+420 kWh', time: 'YESTERDAY', avatar: 'https://i.pravatar.cc/150?img=68' }
    ];

    res.json({
      success: true,
      user,
      history: { issues, events, organizedEvents, recentVerifiedActions },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
