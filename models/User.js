const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  avatar: { type: String, default: '' },
  organization: { type: String, default: '' },

  // Location
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
  },
  ward: { type: mongoose.Schema.Types.ObjectId, ref: 'Ward' },
  wardName: { type: String, default: '' },

  // Role
  role: { type: String, enum: ['user', 'resident', 'moderator', 'admin'], default: 'user' },
  moderatorWard: { type: mongoose.Schema.Types.ObjectId, ref: 'Ward', default: null },

  // Impact stats
  stats: {
    eventsJoined: { type: Number, default: 0 },
    eventsOrganized: { type: Number, default: 0 },
    issuesRaised: { type: Number, default: 0 },
    issuesVerified: { type: Number, default: 0 },
    issuesResolved: { type: Number, default: 0 },
    totalFunded: { type: Number, default: 0 },
    impactScore: { type: Number, default: 0 },
    cleanups: { type: Number, default: 0 },
    upvotesReceived: { type: Number, default: 0 },
  },

  // Notifications
  notifications: [{
    type: { type: String },
    message: { type: String },
    relatedId: { type: mongoose.Schema.Types.ObjectId },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  }],

  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

userSchema.index({ location: '2dsphere' });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
