const mongoose = require('mongoose');

const reelSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  videoUrl:        { type: String, required: true },
  videoPublicId:   { type: String },
  thumbnailUrl:    { type: String },
  caption:         { type: String, maxlength: 300, default: '' },
  category: {
    type: String,
    enum: ['cleanup', 'tree_plantation', 'awareness', 'water_conservation', 'wildlife', 'recycling', 'other'],
    default: 'other',
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  },
  wardName:       { type: String, default: '' },
  likes:          [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likeCount:      { type: Number, default: 0 },
  viewCount:      { type: Number, default: 0 },
  duration:       { type: Number, default: 0 }, // seconds
}, { timestamps: true });

reelSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Reel', reelSchema);
