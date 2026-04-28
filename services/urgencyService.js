const Issue = require('../models/Issue');

const W1 = parseFloat(process.env.W1) || 1;    // upvotes weight
const W2 = parseFloat(process.env.W2) || 3;    // verifications weight
const W3 = parseFloat(process.env.W3) || 0.5;  // age weight

const THRESHOLD_MEDIUM   = parseInt(process.env.THRESHOLD_MEDIUM)   || 21;
const THRESHOLD_HIGH     = parseInt(process.env.THRESHOLD_HIGH)     || 51;
const THRESHOLD_CRITICAL = parseInt(process.env.THRESHOLD_CRITICAL) || 100;

/**
 * Calculate urgency score for given inputs.
 * Returns { score, level }
 */
const calculateUrgencyScore = (upvotes, verifications, ageInDays) => {
  const score = Math.round(
    (upvotes * W1) + (verifications * W2) + (ageInDays * W3)
  );

  let level = 'low';
  if (score >= THRESHOLD_CRITICAL) level = 'critical';
  else if (score >= THRESHOLD_HIGH) level = 'high';
  else if (score >= THRESHOLD_MEDIUM) level = 'medium';

  return { score, level };
};

/**
 * Cron job: recalculate urgency scores for all open issues.
 */
const recalculateAllUrgencyScores = async () => {
  const issues = await Issue.find({
    status: { $in: ['open', 'verified', 'escalated'] },
  });

  const bulkOps = issues.map(issue => {
    const ageInDays = (Date.now() - issue.createdAt) / (1000 * 60 * 60 * 24);
    const { score, level } = calculateUrgencyScore(
      issue.upvoteCount,
      issue.verificationCount,
      ageInDays
    );
    return {
      updateOne: {
        filter: { _id: issue._id },
        update: { $set: { urgencyScore: score, urgencyLevel: level } },
      },
    };
  });

  if (bulkOps.length > 0) {
    await Issue.bulkWrite(bulkOps);
  }

  return { updated: bulkOps.length };
};

module.exports = { calculateUrgencyScore, recalculateAllUrgencyScores };
