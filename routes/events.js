const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const { uploadEventImage } = require('../config/cloudinary');
const Event = require('../models/Event');
const User = require('../models/User');
const { resolveWardFromCoords } = require('../services/geocodingService');
const { cacheMiddleware, clearCache } = require('../middleware/cache');

// GET /api/events — list events with geo filter
router.get('/', optionalAuth, cacheMiddleware(60), async (req, res) => {
  try {
    const { lat, lng, radius = 10000, category, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (lat && lng) {
      filter.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius),
        },
      };
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const events = await Event.find(filter)
      .sort({ date: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('organizer', 'name avatar')
      .populate('ward', 'name')
      .select('-participants -funders -updates') // Exclude heavy arrays for list view
      .lean();
      
    const total = await Event.countDocuments(filter);

    // Attach joined status using a separate efficient check
    let userJoins = new Set();
    if (req.user) {
      const eventIds = events.map(e => e._id);
      // We check the participants list by searching for the user in those specific events
      // Since we excluded 'participants' from the main query, we do this check separately
      const joinedEvents = await Event.find({
        _id: { $in: eventIds },
        participants: req.user._id
      }).select('_id').lean();
      joinedEvents.forEach(e => userJoins.add(e._id.toString()));
    }

    const withJoined = events.map(e => ({
      ...e,
      hasJoined: userJoins.has(e._id.toString()),
    }));

    res.json({ success: true, events: withJoined, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/events/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name avatar')
      .populate('ward', 'name')
      .populate('funders.user', 'name avatar')
      .populate('participants', 'name email avatar');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
    res.json({ success: true, event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/events — create event (clears cache)
router.post('/', protect, uploadEventImage.single('image'), async (req, res, next) => {
  clearCache(); 
  next();
}, async (req, res) => {
  try {
    const io = req.app.get('io');
    const { title, description, category, date, endDate, capacity, fundingGoal, lat, lng, address } = req.body;
    if (!lat || !lng) return res.status(400).json({ success: false, message: 'Location required.' });

    const event = new Event({
      title, description,
      category: category || 'other',
      date: new Date(date),
      endDate: endDate ? new Date(endDate) : undefined,
      capacity: parseInt(capacity) || 0,
      fundingGoal: parseFloat(fundingGoal) || 0,
      organizer: req.user._id,
      location: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
      address: address || '',
    });

    if (req.file) { event.image = req.file.path; event.imagePublicId = req.file.filename; }

    const ward = await resolveWardFromCoords(parseFloat(lat), parseFloat(lng));
    if (ward) { event.ward = ward._id; event.wardName = ward.name; }

    await event.save();

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.eventsOrganized': 1, 'stats.impactScore': 10 },
    });

    io.emit('event:new', { eventId: event._id, wardName: event.wardName });
    res.status(201).json({ success: true, event, pointsGained: 10 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/events/:id/join
router.post('/:id/join', protect, async (req, res) => {
  try {
    const io = req.app.get('io');
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    const joined = event.participants.some(p => p.toString() === req.user._id.toString());
    if (joined) {
      // Leave
      event.participants = event.participants.filter(p => p.toString() !== req.user._id.toString());
      event.participantCount = Math.max(0, event.participantCount - 1);
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { 'stats.eventsJoined': -1, 'stats.impactScore': -5 },
      });
    } else {
      if (event.capacity > 0 && event.participants.length >= event.capacity) {
        return res.status(400).json({ success: false, message: 'Event is full.' });
      }
      event.participants.push(req.user._id);
      event.participantCount += 1;
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { 'stats.eventsJoined': 1, 'stats.impactScore': 5 },
      });
    }

    await event.save();

    io.to(`event:${event._id}`).emit('event:participants', {
      eventId: event._id,
      participantCount: event.participantCount,
    });

    res.json({ 
      success: true, 
      joined: !joined, 
      participantCount: event.participantCount,
      pointsGained: !joined ? 5 : 0 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/events/:id/fund
router.post('/:id/fund', protect, async (req, res) => {
  try {
    const io = req.app.get('io');
    const { amount } = req.body;
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount required.' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    const fundAmount = parseFloat(amount);
    event.fundsRaised += fundAmount;
    event.funders.push({ user: req.user._id, amount: fundAmount });

    if (!event.fundingGoalReached && event.fundsRaised >= event.fundingGoal && event.fundingGoal > 0) {
      event.fundingGoalReached = true;
      event.fundingGoalReachedAt = new Date();
      // Notify organizer
      io.to(`user:${event.organizer}`).emit('event:funded', {
        eventId: event._id,
        title: event.title,
        message: `Your event "${event.title}" has reached its funding goal!`,
      });
    }

    await event.save();

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.totalFunded': fundAmount, 'stats.impactScore': Math.floor(fundAmount / 100) },
    });

    io.to(`event:${event._id}`).emit('event:funding', {
      eventId: event._id,
      fundsRaised: event.fundsRaised,
      fundingGoalReached: event.fundingGoalReached,
    });

    res.json({ success: true, fundsRaised: event.fundsRaised, fundingGoalReached: event.fundingGoalReached });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/events/:id/update — organizer posts an update
router.post('/:id/update', protect, async (req, res) => {
  try {
    const { content } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Not found.' });
    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only organizer can post updates.' });
    }
    event.updates.push({ content });
    await event.save();
    res.json({ success: true, updates: event.updates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
