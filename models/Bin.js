const mongoose = require('mongoose');

const binSchema = new mongoose.Schema({
  binId: { type: String, required: true, unique: true },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true } // [lng, lat]
  },
  fillLevel: { type: Number, default: 0 }, // 0 to 100
  status: { type: String, enum: ['normal', 'warning', 'full'], default: 'normal' },
  lastEmptied: { type: Date, default: Date.now }
}, { timestamps: true });

binSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Bin', binSchema);
