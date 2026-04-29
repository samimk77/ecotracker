const Issue = require('../models/Issue');
const { Vote, Verification, Dislike } = require('../models/VoteVerification');
const User = require('../models/User');
const { generateEscalationEmail, triageImage } = require('../services/aiService');
const { resolveWardFromCoords, getAddressFromCoords } = require('../services/geocodingService');
const { calculateUrgencyScore } = require('../services/urgencyService');
const { sendEscalationEmail } = require('../services/emailService');
const { getDistanceInMeters } = require('../utils/geo');
const Notification = require('../models/Notification');



// POST /api/issues
const createIssue = async (req, res) => {
  try {
    const { title, description, category, lat, lng, address } = req.body;
    const io = req.app.get('io');

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Location is required.' });
    }

    const issue = new Issue({
      title,
      description,
      category: category || 'other',
      author: req.user._id,
      location: {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)],
      },
      address: address || '',
    });

    // Auto-resolve address if missing
    if (!issue.address) {
      issue.address = await getAddressFromCoords(parseFloat(lat), parseFloat(lng));
    }

    // Resolve ward from coordinates
    const ward = await resolveWardFromCoords(parseFloat(lat), parseFloat(lng));
    if (ward) {
      issue.ward = ward._id;
      issue.wardName = ward.name;
    }

    // Media handling (AI triage if image uploaded)
    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        const imageFile = req.files.image[0];
        issue.beforeImage = imageFile.path;
        issue.beforeImagePublicId = imageFile.filename;

        // Only override category if user didn't explicitly set one
        try {
          const triage = await triageImage(imageFile.path);
          issue.category = triage.category;
          issue.categoryConfidence = triage.confidence;
        } catch (aiErr) {
          console.warn('AI triage failed, using user category:', aiErr.message);
        }
      }

      if (req.files.video && req.files.video[0]) {
        const videoFile = req.files.video[0];
        issue.video = videoFile.path;
        issue.videoPublicId = videoFile.filename;
      }
    }

    await issue.save();

    // Update user stats (removed impact score gain - only on verification now)
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.issuesRaised': 1 },
    });

    // Broadcast to ward room
    io.to(`ward:${issue.wardName}`).emit('issue:new', {
      issueId: issue._id,
      wardName: issue.wardName,
    });

    res.status(201).json({ success: true, issue, pointsGained: 5 });
  } catch (err) {
    console.error('Create issue error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/issues
const getIssues = async (req, res) => {
  try {
    const {
      category, status, ward, urgencyLevel,
      lat, lng, radius = 10000,
      sort = 'urgency', page = 1, limit = 20,
    } = req.query;

    const isMod = req.user && (req.user.role === 'moderator' || req.user.role === 'admin');
    
    let filter = {};
    if (!isMod) {
      // Regular users only see approved/active content
      filter.status = { $in: ['verified', 'escalated', 'resolved'] };
    } else {
      // Moderators see everything except rejected by default, unless they specifically ask for it
      filter.status = { $ne: 'rejected' };
    }

    if (category) filter.category = category;
    
    // Status handling: Direct status request overrides role defaults, but we restrict for non-mods
    if (status) {
      if (isMod) {
        filter.status = status;
      } else {
        // Non-mods can only filter within the approved statuses
        if (['verified', 'escalated', 'resolved'].includes(status)) {
          filter.status = status;
        } else {
          // If they ask for something like 'open', we force the 'approved only' filter
          filter.status = { $in: ['verified', 'escalated', 'resolved'] };
        }
      }
    }
    if (ward) filter.ward = ward;
    if (urgencyLevel) filter.urgencyLevel = urgencyLevel;

    // Geo filter
    if (lat && lng) {
      filter.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius),
        },
      };
    }

    const sortOptions = sort === 'urgency'
      ? { urgencyScore: -1 }
      : sort === 'recent'
        ? { createdAt: -1 }
        : { urgencyScore: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const issues = await Issue.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'name avatar')
      .populate('ward', 'name');

    const total = await Issue.countDocuments(filter);

    // Attach user's vote/verification status
    let userVotes = {};
    let userVerifications = {};
    let userDislikes = {};

    if (req.user) {
      const issuesIds = issues.map(i => i._id);
      const votes = await Vote.find({ user: req.user._id, issue: { $in: issuesIds } });
      const verifs = await Verification.find({ user: req.user._id, issue: { $in: issuesIds } });
      const dislikes = await Dislike.find({ user: req.user._id, issue: { $in: issuesIds } });
      
      votes.forEach(v => { userVotes[v.issue.toString()] = true; });
      verifs.forEach(v => { userVerifications[v.issue.toString()] = v.type; });
      dislikes.forEach(d => { userDislikes[d.issue.toString()] = true; });
    }

    const issuesWithStatus = issues.map(issue => ({
      ...issue.toObject(),
      hasUpvoted: !!userVotes[issue._id.toString()],
      hasDisliked: !!userDislikes[issue._id.toString()],
      userVerification: userVerifications[issue._id.toString()] || null,
    }));

    res.json({
      success: true,
      issues: issuesWithStatus,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/issues/:id
const getIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('author', 'name avatar wardName')
      .populate('ward', 'name authorityEmail')
      .populate('resolvedBy', 'name');

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found.' });
    }

    let hasUpvoted = false;
    let userVerification = null;
    if (req.user) {
      const vote = await Vote.findOne({ user: req.user._id, issue: issue._id });
      const verif = await Verification.findOne({ user: req.user._id, issue: issue._id });
      hasUpvoted = !!vote;
      userVerification = verif?.type || null;
    }

    res.json({ success: true, issue: { ...issue.toObject(), hasUpvoted, userVerification } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/issues/:id/upvote
const upvoteIssue = async (req, res) => {
  try {
    const io = req.app.get('io');
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found.' });

    // ONLY normal users can vote. Moderators/Authorities are neutral.
    if (req.user.role !== 'user') {
      return res.status(403).json({ success: false, message: 'Neutral oversight: Moderators cannot vote.' });
    }

    // Toggle vote
    const existing = await Vote.findOne({ user: req.user._id, issue: issue._id });
    if (existing) {
      await existing.deleteOne();
      issue.upvoteCount = Math.max(0, issue.upvoteCount - 1);
    } else {
      await Vote.create({ user: req.user._id, issue: issue._id });
      issue.upvoteCount += 1;
    }

    // Recalculate urgency
    const ageInDays = (Date.now() - issue.createdAt) / (1000 * 60 * 60 * 24);
    const { score, level } = calculateUrgencyScore(
      issue.upvoteCount,
      issue.verificationCount,
      ageInDays
    );
    issue.urgencyScore = score;
    issue.urgencyLevel = level;

    await issue.save();

    // Broadcast live count
    io.to(`issue:${issue._id}`).emit('issue:upvote', {
      issueId: issue._id,
      upvoteCount: issue.upvoteCount,
      urgencyScore: issue.urgencyScore,
      urgencyLevel: issue.urgencyLevel,
    });

    res.json({
      success: true,
      upvoted: !existing,
      upvoteCount: issue.upvoteCount,
      urgencyScore: issue.urgencyScore,
      urgencyLevel: issue.urgencyLevel,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Already upvoted.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/issues/:id/dislike
const dislikeIssue = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const io = req.app.get('io');

    if (!lat || !lng || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
      return res.status(400).json({ success: false, message: 'Current location is required for disliking.' });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found.' });

    // PROXIMITY CHECK: Must be within 1km
    const distance = getDistanceInMeters(
      parseFloat(lat),
      parseFloat(lng),
      issue.location.coordinates[1],
      issue.location.coordinates[0]
    );

    if (distance > 1000) {
      return res.status(403).json({
        success: false,
        message: `Too far! You must be within 1km to dislike. (Distance: ${Math.round(distance)}m)`
      });
    }

    // ONLY normal users can dislike.
    if (req.user.role !== 'user') {
      return res.status(403).json({ success: false, message: 'Neutral oversight: Moderators cannot dislike.' });
    }

    // Toggle dislike logic
    const existingDislike = await Dislike.findOne({ user: req.user._id, issue: issue._id });
    if (existingDislike) {
      await existingDislike.deleteOne();
      issue.dislikeCount = Math.max(0, issue.dislikeCount - 1);
    } else {
      await Dislike.create({ user: req.user._id, issue: issue._id });
      issue.dislikeCount += 1;
    }

    // AUTO-DELETE LOGIC: Delete if dislikes > 20 within 1km
    if (issue.dislikeCount >= 20) {
      await issue.deleteOne();
      io.emit('issue:deleted', { issueId: req.params.id, reason: 'High community dislike threshold reached.' });
      return res.json({ success: true, message: 'Issue automatically deleted due to community feedback.', deleted: true });
    }

    await issue.save();
    
    io.to(`issue:${issue._id}`).emit('issue:dislike', {
      issueId: issue._id,
      dislikeCount: issue.dislikeCount,
    });

    res.json({ success: true, dislikeCount: issue.dislikeCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/issues/:id/verify
const verifyIssue = async (req, res) => {
  try {
    const { type, note, lat, lng } = req.body; // type: 'verify' | 'dispute'
    if (!['verify', 'dispute'].includes(type)) {
      return res.status(400).json({ success: false, message: 'type must be verify or dispute' });
    }

    if (!lat || !lng || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
      return res.status(400).json({ success: false, message: 'Current location is required for verification.' });
    }


    const io = req.app.get('io');
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found.' });

    // PROXIMITY CHECK: Must be within 1km
    const distance = getDistanceInMeters(
      parseFloat(lat), 
      parseFloat(lng), 
      issue.location.coordinates[1], 
      issue.location.coordinates[0]
    );

    console.log(`[PROXIMITY CHECK]`);
    console.log(`User Coords: ${lat}, ${lng}`);
    console.log(`Issue Coords: ${issue.location.coordinates[1]}, ${issue.location.coordinates[0]}`);
    console.log(`Calculated Distance: ${distance}m`);

    if (distance > 1000) {
      return res.status(403).json({ 
        success: false, 
        message: `Too far! You must be within 1km of the issue to verify it. (Distance: ${Math.round(distance)}m)` 
      });
    }

    // Check if user already verified/disputed
    const existing = await Verification.findOne({ user: req.user._id, issue: issue._id });
    if (existing) {
      // Update existing
      const oldType = existing.type;
      existing.type = type;
      existing.note = note || '';
      await existing.save();

      // Adjust counts
      if (oldType === 'verify' && type === 'dispute') {
        issue.verificationCount = Math.max(0, issue.verificationCount - 1);
        issue.disputeCount += 1;
      } else if (oldType === 'dispute' && type === 'verify') {
        issue.disputeCount = Math.max(0, issue.disputeCount - 1);
        issue.verificationCount += 1;
      }
    } else {
      await Verification.create({ user: req.user._id, issue: issue._id, type, note: note || '' });
      if (type === 'verify') issue.verificationCount += 1;
      else issue.disputeCount += 1;
    }

    // Flag if more disputes than verifications
    if (issue.disputeCount > issue.verificationCount) {
      issue.flagged = true;
      issue.flagReason = 'More disputes than verifications';
    }

    // Recalculate urgency
    const ageInDays = (Date.now() - issue.createdAt) / (1000 * 60 * 60 * 24);
    const { score, level } = calculateUrgencyScore(
      issue.upvoteCount,
      issue.verificationCount,
      ageInDays
    );
    issue.urgencyScore = score;
    issue.urgencyLevel = level;

    await issue.save();

    // Update user stats
    let pointsGained = 0;
    if (type === 'verify' && !existing) {
      pointsGained = 5;
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { 'stats.issuesVerified': 1, 'stats.impactScore': pointsGained },
      });
    }

    // Notify mod if critical
    if (level === 'critical' || issue.flagged) {
      io.to(`ward:${issue.wardName}:mods`).emit('mod:review-needed', {
        issueId: issue._id,
        reason: level === 'critical' ? 'Critical urgency threshold crossed' : 'Issue flagged',
      });
    }

    io.to(`issue:${issue._id}`).emit('issue:verify', {
      issueId: issue._id,
      verificationCount: issue.verificationCount,
      disputeCount: issue.disputeCount,
      urgencyScore: issue.urgencyScore,
      urgencyLevel: issue.urgencyLevel,
    });

    res.json({
      success: true,
      verificationCount: issue.verificationCount,
      disputeCount: issue.disputeCount,
      urgencyScore: issue.urgencyScore,
      pointsGained
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/issues/:id/after-image
const uploadAfterImage = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found.' });

    // Only the original reporter can upload the after image
    if (issue.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the reporter can upload the after image.' });
    }

    if (issue.status !== 'resolved') {
      return res.status(400).json({ success: false, message: 'Issue must be resolved first.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image provided.' });
    }

    issue.afterImage = req.file.path;
    issue.afterImagePublicId = req.file.filename;
    issue.afterImageUploadedAt = new Date();
    await issue.save();

    res.json({ success: true, afterImage: issue.afterImage, message: 'After image uploaded! It will appear on the Impact Wall.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/issues/:id/moderate  (mod only)
const moderatorAction = async (req, res) => {
  try {
    const { action, note, lat, lng } = req.body;
    // action: 'resolve' | 'reject' | 'duplicate' | 'spam' | 'verify' | 'unflag'
    const io = req.app.get('io');

    const issue = await Issue.findById(req.params.id).populate('author', 'name');
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found.' });

    // PROXIMITY CHECK for Moderators/Authorities (10km limit for approval)
    if (['approve', 'verify'].includes(action)) {
      if (!lat || !lng) {
        return res.status(400).json({ success: false, message: 'Moderator location required for validation.' });
      }
      const distance = getDistanceInMeters(
        parseFloat(lat),
        parseFloat(lng),
        issue.location.coordinates[1],
        issue.location.coordinates[0]
      );
      if (distance > 10000) {
        return res.status(403).json({ 
          success: false, 
          message: `Operational Limit Exceeded: You must be within 10km to approve this report. (Current: ${(distance/1000).toFixed(1)}km)` 
        });
      }
    }

    // Moderators can act globally for now (or assigned ward check can be re-enabled later)
    /*
    if (
      req.user.role === 'moderator' &&
      req.user.moderatorWard?.toString() !== issue.ward?.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Not your ward.' });
    }
    */

    // Role-based permission check
    if (action === 'resolve' && req.user.role !== 'authority') {
      return res.status(403).json({ success: false, message: 'Only Resolving Authorities can mark issues as resolved.' });
    }

    if (action === 'verify' && !['moderator', 'authority'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only Moderators or Authorities can approve posts.' });
    }

    switch (action) {

      case 'resolve':
        issue.status = 'resolved';
        issue.resolvedAt = new Date();
        issue.resolvedBy = req.user._id;
        issue.resolutionNote = note || '';
        // Notify reporter to upload after image
        io.to(`user:${issue.author._id}`).emit('issue:resolved', {
          issueId: issue._id,
          title: issue.title,
          message: 'Your issue has been resolved! Please upload an after photo to show the impact.',
        });
        await User.findByIdAndUpdate(issue.author._id, {
          $inc: { 'stats.issuesResolved': 1, 'stats.impactScore': 10 },
        });
        break;
      case 'reject':
      case 'flag':
        issue.status = 'rejected';
        issue.flagReason = note || 'Rejected by moderator';
        break;
      case 'duplicate':
        issue.status = 'duplicate';
        issue.duplicateOf = req.body.duplicateOf || null;
        break;
      case 'spam':
        issue.flagged = true;
        issue.flagReason = 'Marked as spam';
        issue.status = 'rejected';
        break;
      case 'verify':
      case 'approve':
        issue.status = 'verified';
        issue.flagged = false;
        
        // AWARD POINTS ON VERIFICATION
        await User.findByIdAndUpdate(issue.author._id, {
          $inc: { 'stats.impactScore': 10 }
        });

        // CREATE NOTIFICATION
        await Notification.create({
          user: issue.author._id,
          title: 'Report Verified!',
          message: `Your report "${issue.title}" has been verified by sector command. +10 Impact Points awarded.`,
          type: 'issue_verified',
          relatedId: issue._id
        });

        // Live notification via socket
        io.to(`user:${issue.author._id}`).emit('notification:new', {
          title: 'Report Verified!',
          message: `Your report "${issue.title}" has been verified.`,
          pointsGained: 10
        });
        break;
      case 'unflag':
        issue.flagged = false;
        issue.flagReason = '';
        break;
      default:
        return res.status(400).json({ success: false, message: 'Unknown action.' });
    }

    await issue.save();
    res.json({ success: true, issue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/issues/:id/escalate  (mod only)
const approveEscalation = async (req, res) => {
  try {
    const io = req.app.get('io');
    const issue = await Issue.findById(req.params.id)
      .populate('ward', 'name authorityEmail authorityName')
      .populate('author', 'name');

    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found.' });
    if (issue.status === 'escalated') {
      return res.status(400).json({ success: false, message: 'Already escalated.' });
    }

    const ward = issue.ward;
    if (!ward?.authorityEmail) {
      return res.status(400).json({
        success: false,
        message: 'No authority email configured for this ward. Add it in the ward settings.',
      });
    }

    // Generate email content via LLM
    const emailContent = await generateEscalationEmail(issue);

    // Send the email
    await sendEscalationEmail({
      to: ward.authorityEmail,
      subject: `[EcoTrack] Urgent: ${issue.title} — ${ward.name}`,
      html: emailContent,
      authorityName: ward.authorityName,
      imageUrl: issue.beforeImage,
    });

    issue.status = 'escalated';
    issue.escalatedAt = new Date();
    issue.escalationEmailSent = true;
    issue.escalationEmailContent = emailContent;
    await issue.save();

    io.to(`ward:${issue.wardName}`).emit('issue:escalated', {
      issueId: issue._id,
      wardName: issue.wardName,
    });

    res.json({ success: true, message: 'Issue escalated. Authority email sent.', issue });
  } catch (err) {
    console.error('Escalation error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/issues/mine
const getMyIssues = async (req, res) => {
  try {
    const issues = await Issue.find({ author: req.user._id })
      .sort({ createdAt: -1 })
      .populate('ward', 'name');
    res.json({ success: true, issues });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createIssue,
  getIssues,
  getIssue,
  getMyIssues,
  upvoteIssue,
  dislikeIssue,
  verifyIssue,
  moderatorAction,
  approveEscalation,
  uploadAfterImage,
};
