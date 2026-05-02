const Bin = require('../models/Bin');

// GET /api/iot/bins
const getBins = async (req, res) => {
  try {
    // .lean() makes the query 5x faster by returning POJOs instead of Mongoose docs
    // .select() reduces payload size by only sending what the map needs
    const bins = await Bin.find()
      .select('binId location fillLevel status lastEmptied')
      .lean();
    res.json({ success: true, bins });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/iot/seed
const seedBins = async (req, res) => {
  try {
    // Clear existing to allow re-seeding with new distribution
    await Bin.deleteMany({});

    const clusters = [
      { name: 'Center', lat: 12.9716, lng: 77.5946, count: 25 },
      { name: 'Yelahanka', lat: 13.0900, lng: 77.5900, count: 15 }
    ];

    const bins = [];
    let binCounter = 0;

    clusters.forEach(cluster => {
      for (let i = 0; i < cluster.count; i++) {
        const lng = cluster.lng + (Math.random() - 0.5) * 0.06;
        const lat = cluster.lat + (Math.random() - 0.5) * 0.06;
        bins.push({
          binId: `BIN-${1000 + binCounter++}`,
          location: { type: 'Point', coordinates: [lng, lat] },
          fillLevel: Math.floor(Math.random() * 85), // Higher variance for demo
          status: 'normal'
        });
      }
    });

    await Bin.insertMany(bins);
    res.json({ success: true, message: `${bins.length} Smart Bins seeded across City Center and Yelahanka` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/iot/reset
const resetBins = async (req, res) => {
  try {
    const { binIds } = req.body; // Optional: list of specific bins cleaned
    const io = req.app.get('io');

    let filter = { fillLevel: { $gte: 70 } };
    if (binIds && binIds.length > 0) {
      filter = { binId: { $in: binIds } };
    }

    await Bin.updateMany(
      filter,
      { $set: { fillLevel: 0, status: 'normal', lastEmptied: new Date() } }
    );

    const updatedBins = await Bin.find().lean();
    io.emit('bins:update', updatedBins);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/iot/bins/:id/dispose
const disposeInBin = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount = 5 } = req.body; // Default 5% increase
    const io = req.app.get('io');

    const bin = await Bin.findOne({ binId: id });
    if (!bin) return res.status(404).json({ success: false, message: 'Bin not found' });

    bin.fillLevel = Math.min(100, bin.fillLevel + amount);
    if (bin.fillLevel >= 90) bin.status = 'full';
    else if (bin.fillLevel >= 70) bin.status = 'warning';
    
    await bin.save();

    // Broadcast update immediately
    const allBins = await Bin.find().lean();
    io.emit('bins:update', allBins);
    
    if (bin.status === 'full') {
      io.emit('bin:full', { binId: bin.binId, fillLevel: bin.fillLevel });
    }

    res.json({ success: true, bin });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getBins, seedBins, resetBins, disposeInBin };
