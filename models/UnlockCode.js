const mongoose = require('mongoose');

const unlockCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    length: 8
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
  nextQuestion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  canSell: {
    type: Boolean,
    default: true
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  usedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sellingPrice: {
    type: Number,
    default: 0,
    min: [0, 'Selling price cannot be negative']
  },
  isForSale: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});


unlockCodeSchema.index({ room: 1, owner: 1 });
unlockCodeSchema.index({ room: 1, question: 1 });

module.exports = mongoose.model('UnlockCode', unlockCodeSchema);
