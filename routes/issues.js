const express = require('express');
const router = express.Router();
const { protect, optionalAuth, requireMod } = require('../middleware/auth');
const { uploadIssueImage, uploadIssueMedia } = require('../config/cloudinary');
const {
  createIssue,
  getIssues,
  getIssue,
  upvoteIssue,
  verifyIssue,
  uploadAfterImage,
  moderatorAction,
  approveEscalation,
  getMyIssues,
} = require('../controllers/issueController');

// Feed + single issue (public with optional auth)
router.get('/', optionalAuth, getIssues);
router.get('/mine', protect, getMyIssues);
router.get('/:id', optionalAuth, getIssue);

// Post new issue with image and/or video
router.post('/', protect, uploadIssueMedia, createIssue);

// Community actions
router.post('/:id/upvote', protect, upvoteIssue);
router.post('/:id/verify', protect, verifyIssue);

// After image upload (reporter only, on resolution)
router.post('/:id/after-image', protect, uploadIssueImage.single('image'), uploadAfterImage);

// Moderator actions
router.put('/:id/moderate', protect, requireMod, moderatorAction);
router.post('/:id/escalate', protect, requireMod, approveEscalation);

module.exports = router;
