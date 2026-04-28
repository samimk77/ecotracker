const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');

// GET /api/impact-wall — resolved issues with before/after images
router.get('/', async (req, res) => {
  try {
    const { ward, category, page = 1, limit = 20 } = req.query;

    const filter = {
      status: 'resolved',
      afterImage: { $ne: '' }, // Only show if after image uploaded
    };
    if (ward) filter.ward = ward;
    if (category) filter.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const issues = await Issue.find(filter)
      .sort({ resolvedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('title category wardName beforeImage afterImage resolvedAt createdAt author address')
      .populate('author', 'name');

    const total = await Issue.countDocuments(filter);

    // Calculate resolution time for each
    const cards = issues.map(issue => ({
      id: issue._id,
      title: issue.title,
      category: issue.category,
      wardName: issue.wardName,
      address: issue.address,
      beforeImage: issue.beforeImage,
      afterImage: issue.afterImage,
      resolvedAt: issue.resolvedAt,
      resolutionDays: issue.resolvedAt
        ? Math.round((issue.resolvedAt - issue.createdAt) / (1000 * 60 * 60 * 24))
        : null,
      reporter: issue.author?.name || 'Anonymous',
    }));

    res.json({
      success: true,
      cards,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
