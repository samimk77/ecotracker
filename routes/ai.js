const express = require('express');
const router = express.Router();
const { classifyWaste } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

// POST /api/ai/classify
// Protect middleware ensures user is logged in
router.post('/classify', protect, classifyWaste);

module.exports = router;
