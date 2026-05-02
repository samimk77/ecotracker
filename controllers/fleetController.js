const Bin = require('../models/Bin');
const Issue = require('../models/Issue');

// GET /api/fleet/route
// Calculates an optimal collection route for full bins and critical issues
const getOptimalRoute = async (req, res) => {
  try {
    // 1. Identify "Targets" (Full bins and verified critical issues)
    const fullBins = await Bin.find({ status: 'full' });
    const criticalIssues = await Issue.find({ 
      urgencyLevel: 'critical', 
      status: 'verified' 
    });

    const waypoints = [
      ...fullBins.map(b => ({ 
        id: b.binId, 
        type: 'bin', 
        coords: b.location.coordinates,
        title: `Full Bin: ${b.binId}`
      })),
      ...criticalIssues.map(i => ({ 
        id: i._id, 
        type: 'issue', 
        coords: i.location.coordinates,
        title: `Critical Issue: ${i.title}`
      }))
    ];

    if (waypoints.length === 0) {
      return res.json({ 
        success: true, 
        route: [], 
        message: 'All sectors clear. No collection required.' 
      });
    }

    // 2. Nearest Neighbor Algorithm (Greedy TSP)
    // Starts from Bangalore City Center (Depot)
    let currentPos = [77.5946, 12.9716]; 
    const route = [];
    const unvisited = [...waypoints];

    while (unvisited.length > 0) {
      let nearestIdx = 0;
      let minDistance = Infinity;

      unvisited.forEach((p, idx) => {
        // Simple Euclidean distance for simulation
        const d = Math.sqrt(
          Math.pow(p.coords[0] - currentPos[0], 2) + 
          Math.pow(p.coords[1] - currentPos[1], 2)
        );
        if (d < minDistance) {
          minDistance = d;
          nearestIdx = idx;
        }
      });

      const nextPoint = unvisited.splice(nearestIdx, 1)[0];
      route.push(nextPoint);
      currentPos = nextPoint.coords;
    }

    res.json({ 
      success: true, 
      route,
      stats: {
        totalStops: route.length,
        estimatedTime: `${route.length * 15} mins`
      }
    });
  } catch (error) {
    console.error('Fleet Route Error:', error);
    res.status(500).json({ success: false, message: 'Optimization engine failure' });
  }
};

module.exports = { getOptimalRoute };
