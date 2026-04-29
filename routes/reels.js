const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const { uploadReel, cloudinary } = require('../config/cloudinary');
const Reel = require('../models/Reel');
const User = require('../models/User');

// GET /api/reels — paginated feed
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, category } = req.query;
    const filter = {};
    if (category && category !== 'all') filter.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const reels = await Reel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name avatar');

    const total = await Reel.countDocuments(filter);

    const withLiked = reels.map(r => ({
      ...r.toObject(),
      hasLiked: req.user ? r.likes.some(id => id.toString() === req.user._id.toString()) : false,
    }));

    res.json({ success: true, reels: withLiked, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/reels — upload a reel
router.post('/', protect, uploadReel.single('video'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Video file required.' });

    const { caption, category, lat, lng, wardName } = req.body;

    const reel = new Reel({
      user: req.user._id,
      videoUrl: req.file.path,
      videoPublicId: req.file.filename,
      caption: caption || '',
      category: category || 'other',
      wardName: wardName || '',
    });

    if (lat && lng) {
      reel.location = { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] };
    }

    await reel.save();

    // Award points
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.impactScore': 15 },
    });

    const populated = await reel.populate('user', 'name avatar');
    res.status(201).json({ success: true, reel: populated, pointsGained: 15 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/reels/:id/like — toggle like
router.post('/:id/like', protect, async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ success: false, message: 'Reel not found.' });

    const userId = req.user._id.toString();
    const hasLiked = reel.likes.some(id => id.toString() === userId);

    if (hasLiked) {
      reel.likes = reel.likes.filter(id => id.toString() !== userId);
      reel.likeCount = Math.max(0, reel.likeCount - 1);
    } else {
      reel.likes.push(req.user._id);
      reel.likeCount += 1;
    }

    await reel.save();
    res.json({ success: true, liked: !hasLiked, likeCount: reel.likeCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/reels/:id/view — increment view count
router.post('/:id/view', async (req, res) => {
  try {
    await Reel.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/reels/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ success: false, message: 'Not found.' });
    if (reel.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    if (reel.videoPublicId) {
      await cloudinary.uploader.destroy(reel.videoPublicId, { resource_type: 'video' });
    }
    await reel.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
