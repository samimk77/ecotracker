const mongoose = require('mongoose');

// Tracks upvotes on issues (prevents double-voting)
const voteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  issue: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true },
  createdAt: { type: Date, default: Date.now },
});

voteSchema.index({ user: 1, issue: 1 }, { unique: true });

// Tracks resident verifications/disputes
const verificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  issue: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true },
  type: { type: String, enum: ['verify', 'dispute'], required: true },
  note: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

verificationSchema.index({ user: 1, issue: 1 }, { unique: true });

// Tracks community dislikes (prevents double-disliking)
const dislikeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  issue: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true },
  createdAt: { type: Date, default: Date.now },
});

dislikeSchema.index({ user: 1, issue: 1 }, { unique: true });

const Vote = mongoose.model('Vote', voteSchema);
const Verification = mongoose.model('Verification', verificationSchema);
const Dislike = mongoose.model('Dislike', dislikeSchema);

module.exports = { Vote, Verification, Dislike };
