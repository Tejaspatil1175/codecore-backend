const Room = require('../models/Room');

const adminAuth = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required'
      });
    }

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
        message: 'Only room admin can perform this action'
      });
    }

    req.room = room;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = { adminAuth };
