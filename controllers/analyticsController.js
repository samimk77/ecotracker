const Issue = require('../models/Issue');
const { resolveWardFromCoords } = require('../services/geocodingService');

// GET /api/analytics/forecast
// Generates mock predictive heatmap data based on historical hotspots
const getTrashForecast = async (req, res) => {
  try {
    // 1. Fetch all unresolved or high-urgency issues to act as "seeds"
    const seeds = await Issue.find({ status: { $in: ['verified', 'escalated'] } }).limit(50);
    
    const forecastPoints = [];
    
    // 2. Generate random "predicted" points around the seeds
    // This simulates an ML model predicting future dump sites based on current clusters
    seeds.forEach(seed => {
      const [lng, lat] = seed.location.coordinates;
      
      // Add the seed itself with high intensity
      forecastPoints.push({
        lat,
        lng,
        intensity: Math.random() * 0.5 + 0.5, // 0.5 to 1.0
        predictionConfidence: 95
      });

      // Generate 3-5 satellite points around the seed
      const numSatellites = Math.floor(Math.random() * 3) + 3;
      for (let i = 0; i < numSatellites; i++) {
        // Random offset between -0.01 and 0.01 degrees (roughly 1km radius)
        const latOffset = (Math.random() - 0.5) * 0.02;
        const lngOffset = (Math.random() - 0.5) * 0.02;
        
        forecastPoints.push({
          lat: lat + latOffset,
          lng: lng + lngOffset,
          intensity: Math.random() * 0.6, // 0.0 to 0.6
          predictionConfidence: Math.floor(Math.random() * 40) + 40 // 40-80%
        });
      }
    });

    res.json({
      success: true,
      message: 'Predictive ML forecast generated successfully',
      data: forecastPoints,
      modelUsed: 'EcoPredict-v2.1 (Simulated)'
    });
  } catch (error) {
    console.error('Forecast generation error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate forecast' });
  }
};

module.exports = {
  getTrashForecast
};
