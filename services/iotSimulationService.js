const Bin = require('../models/Bin');

const startSimulation = async (io) => {
  console.log('--- [Simulation] Smart Bin IoT simulation started ---');
  
  // Auto-seed if empty
  const count = await Bin.countDocuments();
  if (count === 0) {
    console.log('[Simulation] Seeding initial smart bins...');
    const centerLng = 77.5946;
    const centerLat = 12.9716;
    const bins = [];
    for (let i = 0; i < 30; i++) {
      const lng = centerLng + (Math.random() - 0.5) * 0.1;
      const lat = centerLat + (Math.random() - 0.5) * 0.1;
      bins.push({
        binId: `BIN-${1000 + i}`,
        location: { type: 'Point', coordinates: [lng, lat] },
        fillLevel: Math.floor(Math.random() * 40),
        status: 'normal'
      });
    }
    await Bin.insertMany(bins);
  }
  
  // Runs every 10 seconds to simulate real-time waste accumulation
  setInterval(async () => {
    try {
      const bins = await Bin.find().lean();
      if (bins.length === 0) return;

      const bulkOps = bins.map(bin => {
        let newFill = bin.fillLevel;
        let newStatus = bin.status;
        let lastEmptied = bin.lastEmptied;

        if (bin.fillLevel >= 90 && Math.random() > 0.85) {
          newFill = 0;
          newStatus = 'normal';
          lastEmptied = new Date();
        } else {
          const increment = Math.random() * 5 + 2;
          newFill = Math.min(100, bin.fillLevel + increment);
          
          if (newFill >= 90) newStatus = 'full';
          else if (newFill >= 70) newStatus = 'warning';
          else newStatus = 'normal';
        }

        if (newStatus === 'full' && bin.status !== 'full') {
          io.emit('bin:full', { binId: bin.binId, fillLevel: newFill });
        }

        return {
          updateOne: {
            filter: { _id: bin._id },
            update: { $set: { fillLevel: newFill, status: newStatus, lastEmptied } }
          }
        };
      });

      await Bin.bulkWrite(bulkOps);
      const updatedBins = await Bin.find().lean();
      io.emit('bins:update', updatedBins);
    } catch (error) {
      console.error('[Simulation Error]:', error.message);
    }
  }, 10000); // 10 seconds for fast demo
};

module.exports = { startSimulation };
