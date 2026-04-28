const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },

  // AI-filled category (user can override)
  category: {
    type: String,
    enum: ['garbage', 'waterlogging', 'deforestation', 'air_pollution', 'noise_pollution',
           'sewage', 'road_damage', 'illegal_dumping', 'water_scarcity', 'other'],
    default: 'other',
  },
  categoryConfidence: { type: Number, default: 0 }, // AI confidence score

  // Media
  beforeImage: { type: String, default: '' },   // Cloudinary URL
  afterImage: { type: String, default: '' },    // Uploaded on resolution
  beforeImagePublicId: { type: String, default: '' },
  afterImagePublicId: { type: String, default: '' },
  video: { type: String, default: '' },         // Cloudinary URL
  videoPublicId: { type: String, default: '' },

  // Location
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  address: { type: String, default: '' },

  // Ward
  ward: { type: mongoose.Schema.Types.ObjectId, ref: 'Ward' },
  wardName: { type: String, default: '' },

  // Author
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Engagement
  upvoteCount: { type: Number, default: 0 },
  dislikeCount: { type: Number, default: 0 },
  verificationCount: { type: Number, default: 0 },
  disputeCount: { type: Number, default: 0 },


  // Urgency
  urgencyScore: { type: Number, default: 0 },
  urgencyLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low',
  },

  // Status
  status: {
    type: String,
    enum: ['open', 'verified', 'escalated', 'resolved', 'rejected', 'duplicate'],
    default: 'open',
  },

  // Escalation
  escalatedAt: { type: Date },
  escalationEmailSent: { type: Boolean, default: false },
  escalationEmailContent: { type: String, default: '' },

  // Resolution
  resolvedAt: { type: Date },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolutionNote: { type: String, default: '' },
  afterImageUploadedAt: { type: Date },

  // Mod fields
  flagged: { type: Boolean, default: false },
  flagReason: { type: String, default: '' },
  duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', default: null },

}, { timestamps: true });

issueSchema.index({ location: '2dsphere' });
issueSchema.index({ urgencyScore: -1 });
issueSchema.index({ ward: 1, status: 1 });
issueSchema.index({ category: 1 });

module.exports = mongoose.model('Issue', issueSchema);
