const express = require('express');
const router = express.Router();
const { protect, optionalAuth, requireMod } = require('../middleware/auth');
const { uploadIssueImage, uploadIssueMedia } = require('../config/cloudinary');
const { cacheMiddleware, clearCache } = require('../middleware/cache');
const {
  createIssue,
  getIssues,
  getIssue,
  upvoteIssue,
  dislikeIssue,
  verifyIssue,
  uploadAfterImage,
  moderatorAction,
  approveEscalation,
  getMyIssues,
} = require('../controllers/issueController');

// Feed + single issue (public with optional auth)
router.get('/', optionalAuth, cacheMiddleware(15), getIssues);
router.get('/mine', protect, getMyIssues);
router.get('/:id', optionalAuth, cacheMiddleware(30), getIssue);

// Post new issue (clears cache)
router.post('/', protect, uploadIssueMedia, (req, res, next) => {
  clearCache(); // Force refresh for everyone
  next();
}, createIssue);

// Community actions
router.post('/:id/upvote', protect, upvoteIssue);
router.post('/:id/dislike', protect, dislikeIssue);
router.post('/:id/verify', protect, verifyIssue);


// After image upload (reporter only, on resolution)
router.post('/:id/after-image', protect, uploadIssueImage.single('image'), uploadAfterImage);

// Moderator actions
router.put('/:id/moderate', protect, requireMod, moderatorAction);
router.post('/:id/escalate', protect, requireMod, approveEscalation);

module.exports = router;
