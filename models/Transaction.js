const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  type: {
    type: String,
    enum: ['code_purchase', 'question_solve', 'initial_allocation'],
    required: true
  },
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  },
  unlockCode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UnlockCode'
  },
  description: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

transactionSchema.index({ room: 1, createdAt: -1 });
transactionSchema.index({ to: 1, room: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
