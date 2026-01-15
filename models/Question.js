const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  questionNumber: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: [true, 'Question title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Question description is required']
  },
  inputFormat: {
    type: String,
    required: true
  },
  outputFormat: {
    type: String,
    required: true
  },
  constraints: {
    type: String
  },
  examples: [{
    input: String,
    output: String,
    explanation: String
  }],
  testCases: [{
    input: {
      type: String,
      required: true
    },
    expectedOutput: {
      type: String,
      required: true
    },
    isHidden: {
      type: Boolean,
      default: true
    }
  }],
  points: {
    type: Number,
    required: [true, 'Points are required'],
    min: [1, 'Points must be at least 1']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

questionSchema.index({ room: 1, questionNumber: 1 }, { unique: true });

module.exports = mongoose.model('Question', questionSchema);
