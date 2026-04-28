const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['tree_plantation', 'cleanup', 'awareness', 'recycling', 'water_conservation',
           'wildlife', 'sustainability_workshop', 'other'],
    default: 'other',
  },

  image: { type: String, default: '' },
  imagePublicId: { type: String, default: '' },

  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Schedule
  date: { type: Date, required: true },
  endDate: { type: Date },

  // Location
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  address: { type: String, default: '' },
  ward: { type: mongoose.Schema.Types.ObjectId, ref: 'Ward' },
  wardName: { type: String, default: '' },

  // Capacity
  capacity: { type: Number, default: 0 }, // 0 = unlimited
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  participantCount: { type: Number, default: 0 },

  // Funding
  fundingGoal: { type: Number, default: 0 },
  fundsRaised: { type: Number, default: 0 },
  funders: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: { type: Number },
    fundedAt: { type: Date, default: Date.now },
  }],
  fundingGoalReached: { type: Boolean, default: false },
  fundingGoalReachedAt: { type: Date },

  // Updates (organizer can post)
  updates: [{
    content: { type: String },
    postedAt: { type: Date, default: Date.now },
  }],

  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming',
  },

}, { timestamps: true });

eventSchema.index({ location: '2dsphere' });
eventSchema.index({ date: 1 });
eventSchema.index({ ward: 1 });

module.exports = mongoose.model('Event', eventSchema);
