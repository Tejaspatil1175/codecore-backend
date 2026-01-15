const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  userOutput: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['correct', 'incorrect'],
    required: true
  },
  pointsEarned: {
    type: Number,
    default: 0
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

submissionSchema.index({ user: 1, room: 1, question: 1 });
submissionSchema.index({ room: 1, question: 1, status: 1 });

module.exports = mongoose.model('Submission', submissionSchema);
