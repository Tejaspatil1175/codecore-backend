const Transaction = require('../models/Transaction');
const Room = require('../models/Room');

const getMyTransactions = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const participant = room.participants.find(
      p => p.user.toString() === req.user._id.toString()
    );

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant of this room'
      });
    }

    const transactions = await Transaction.find({
      room: roomId,
      $or: [
        { from: req.user._id },
        { to: req.user._id }
      ]
    })
      .populate('from', 'username teamName')
      .populate('to', 'username teamName')
      .populate('question', 'title questionNumber')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const getRoomTransactions = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    if (room.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only room admin can view all transactions'
      });
    }

    const transactions = await Transaction.find({ room: roomId })
      .populate('from', 'username teamName')
      .populate('to', 'username teamName')
      .populate('question', 'title questionNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  getMyTransactions,
  getRoomTransactions
};
