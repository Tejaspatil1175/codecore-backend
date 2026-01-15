const Room = require('../models/Room');
const Transaction = require('../models/Transaction');

const joinRoom = async (req, res) => {
  try {
    const { roomCode } = req.body;

    if (!roomCode) {
      return res.status(400).json({
        success: false,
        message: 'Room code is required'
      });
    }

    const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Invalid room code'
      });
    }

    if (room.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'This room is closed'
      });
    }

    const alreadyJoined = room.participants.find(
      p => p.user.toString() === req.user._id.toString()
    );

    if (alreadyJoined) {
      return res.status(400).json({
        success: false,
        message: 'You have already joined this room'
      });
    }

    room.participants.push({
      user: req.user._id,
      teamName: req.user.teamName,
      currentPoints: room.initialPoints
    });

    await room.save();

    await Transaction.create({
      room: room._id,
      type: 'initial_allocation',
      to: req.user._id,
      points: room.initialPoints,
      description: 'Initial points allocation'
    });

    res.status(200).json({
      success: true,
      message: 'Successfully joined the room',
      data: {
        roomId: room._id,
        roomName: room.roomName,
        currentPoints: room.initialPoints
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const getMyRooms = async (req, res) => {
  try {
    const rooms = await Room.find({
      'participants.user': req.user._id,
      status: 'active'
    }).select('roomCode roomName initialPoints participants');

    const myRooms = rooms.map(room => {
      const participant = room.participants.find(
        p => p.user.toString() === req.user._id.toString()
      );

      return {
        roomId: room._id,
        roomCode: room.roomCode,
        roomName: room.roomName,
        currentPoints: participant.currentPoints,
        isBanned: participant.isBanned,
        joinedAt: participant.joinedAt
      };
    });

    res.status(200).json({
      success: true,
      data: myRooms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const getRoomDetails = async (req, res) => {
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

    if (participant.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'You are banned from this room'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        roomId: room._id,
        roomCode: room.roomCode,
        roomName: room.roomName,
        currentPoints: participant.currentPoints,
        status: room.status
      }
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
  joinRoom,
  getMyRooms,
  getRoomDetails
};
