const Ward = require('../models/Ward');
const Issue = require('../models/Issue');
const Event = require('../models/Event');

/**
 * Recalculates sustainability score for all wards.
 * Score = (events × 10) + (issuesFiled × 2) + (issuesResolved × 15) + (fundsRaised / 100)
 * Normalized to 0–100 range after computing all wards.
 */
const recalculateWardScores = async () => {
  const wards = await Ward.find({});
  const rawScores = [];

  for (const ward of wards) {
    const eventsHeld = await Event.countDocuments({
      ward: ward._id,
      status: { $in: ['completed', 'upcoming', 'ongoing'] },
    });

    const issuesFiled = await Issue.countDocuments({ ward: ward._id });

    const issuesResolved = await Issue.countDocuments({
      ward: ward._id,
      status: 'resolved',
    });

    const fundingAgg = await Event.aggregate([
      { $match: { ward: ward._id } },
      { $group: { _id: null, total: { $sum: '$fundsRaised' } } },
    ]);
    const fundsRaised = fundingAgg[0]?.total || 0;

    const rawScore =
      eventsHeld * 10 +
      issuesFiled * 2 +
      issuesResolved * 15 +
      Math.floor(fundsRaised / 100);

    rawScores.push({
      wardId: ward._id,
      rawScore,
      eventsHeld,
      issuesFiled,
      issuesResolved,
      fundsRaised,
    });
  }

  // Normalize to 0–100
  const max = Math.max(...rawScores.map(s => s.rawScore), 1);

  const bulkOps = rawScores.map(s => ({
    updateOne: {
      filter: { _id: s.wardId },
      update: {
        $set: {
          sustainabilityScore: Math.round((s.rawScore / max) * 100),
          scoreBreakdown: {
            eventsHeld: s.eventsHeld,
            issuesFiled: s.issuesFiled,
            issuesResolved: s.issuesResolved,
            fundsRaised: s.fundsRaised,
          },
        },
      },
    },
  }));

  if (bulkOps.length > 0) await Ward.bulkWrite(bulkOps);
  return { updated: bulkOps.length };
};

module.exports = { recalculateWardScores };
