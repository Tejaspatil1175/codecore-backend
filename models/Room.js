const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    unique: true,
    length: 6,
    uppercase: true
  },
  roomName: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  initialPoints: {
    type: Number,
    default: 500,
    min: [0, 'Initial points cannot be negative']
  },
  status: {
    type: String,
    enum: ['active', 'closed'],
    default: 'active'
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    teamName: String,
    currentPoints: {
      type: Number,
      default: 0
    },
    isBanned: {
      type: Boolean,
      default: false
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});


roomSchema.index({ admin: 1 });

module.exports = mongoose.model('Room', roomSchema);
