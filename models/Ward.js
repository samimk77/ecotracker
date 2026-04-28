const mongoose = require('mongoose');

const wardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  number: { type: Number },
  district: { type: String },
  city: { type: String },
  state: { type: String },

  // Authority contact for escalation emails
  authorityEmail: { type: String, default: '' },
  authorityName: { type: String, default: '' },

  // GeoJSON polygon for ward boundary
  boundary: {
    type: { type: String, enum: ['Polygon'], default: 'Polygon' },
    coordinates: { type: [[[Number]]], default: [] },
  },

  // Center point
  center: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
  },

  // Sustainability score (computed by cron)
  sustainabilityScore: { type: Number, default: 0 },
  scoreBreakdown: {
    eventsHeld: { type: Number, default: 0 },
    issuesFiled: { type: Number, default: 0 },
    issuesResolved: { type: Number, default: 0 },
    fundsRaised: { type: Number, default: 0 },
  },

  moderator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

wardSchema.index({ center: '2dsphere' });
wardSchema.index({ boundary: '2dsphere' });

module.exports = mongoose.model('Ward', wardSchema);
