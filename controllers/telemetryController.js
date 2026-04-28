const Issue = require('../models/Issue');

// GET /api/telemetry
const getTelemetryDashboard = async (req, res) => {
  try {
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);

    // 1. Generate Heatmap Data from real issues
    const issuesList = await Issue.find({ createdAt: { $gte: oneYearAgo } }).select('createdAt');
    
    const activityMap = {};
    issuesList.forEach(issue => {
      const dateStr = issue.createdAt.toISOString().split('T')[0];
      activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
    });

    const heatmap = [];
    for (let i = 365; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = activityMap[dateStr] || 0;
      
      let val = 0;
      if (count === 1) val = 1;
      else if (count === 2) val = 2;
      else if (count >= 3 && count <= 5) val = 3;
      else if (count > 5) val = 4;

      heatmap.push({ date: dateStr, value: val });
    }

    // 2. Incident Logs (Recent critical/high issues)
    const recentIssues = await Issue.find()
      .sort({ createdAt: -1 })
      .limit(5);

    const logs = recentIssues.map(issue => ({
      id: issue._id.toString(),
      title: issue.title,
      description: issue.description.substring(0, 50) + '...',
      aiTag: issue.category.toUpperCase(),
      status: issue.status === 'resolved' ? 'STABILIZED' : (issue.urgencyLevel === 'critical' ? 'CRITICAL' : 'OPTIMAL'),
      time: issue.createdAt.toISOString().split('T')[1].substring(0, 5) + ' GMT'
    }));

    // 3. Network Health (Calculate based on resolved vs open issues)
    const totalIssues = await Issue.countDocuments();
    const resolvedIssues = await Issue.countDocuments({ status: 'resolved' });
    
    let networkHealth = 100;
    if (totalIssues > 0) {
      // 90% base + 10% based on resolution rate
      networkHealth = 90 + ((resolvedIssues / totalIssues) * 10);
    }

    res.json({
      success: true,
      data: {
        heatmap,
        logs: logs.length > 0 ? logs : [
          { id: 'log-1', title: 'System Online', description: 'EcoTrack Telemetry activated.', aiTag: 'SYSTEM', status: 'OPTIMAL', time: '00:00 GMT' }
        ],
        networkHealth: networkHealth.toFixed(1)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getTelemetryDashboard
};
