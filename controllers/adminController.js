const Room = require('../models/Room');
const Question = require('../models/Question');
const Submission = require('../models/Submission');
const Transaction = require('../models/Transaction');
const UnlockCode = require('../models/UnlockCode');
const { generateUniqueRoomCode } = require('../utils/codeGenerator');

const createRoom = async (req, res) => {
  try {
    const { roomName, initialPoints } = req.body;

    if (!roomName) {
      return res.status(400).json({
        success: false,
        message: 'Room name is required'
      });
    }

    const roomCode = await generateUniqueRoomCode(Room);

    const room = await Room.create({
      roomCode,
      roomName,
      admin: req.user._id,
      initialPoints: initialPoints || 500
    });

    res.status(201).json({
      success: true,
      data: room
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const deleteRoom = async (req, res) => {
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
        message: 'Only room admin can delete the room'
      });
    }

    await Question.deleteMany({ room: roomId });
    await Submission.deleteMany({ room: roomId });
    await Transaction.deleteMany({ room: roomId });
    await UnlockCode.deleteMany({ room: roomId });
    await Room.findByIdAndDelete(roomId);

    res.status(200).json({
      success: true,
      message: 'Room and all associated data deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const banUser = async (req, res) => {
  try {
    const { roomId, userId } = req.params;

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const participant = room.participants.find(
      p => p.user.toString() === userId
    );

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'User not found in this room'
      });
    }

    participant.isBanned = true;
    await room.save();

    res.status(200).json({
      success: true,
      message: 'User banned successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const unbanUser = async (req, res) => {
  try {
    const { roomId, userId } = req.params;

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const participant = room.participants.find(
      p => p.user.toString() === userId
    );

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'User not found in this room'
      });
    }

    participant.isBanned = false;
    await room.save();

    res.status(200).json({
      success: true,
      message: 'User unbanned successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findById(roomId).populate('participants.user', 'username teamName');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const leaderboard = room.participants
      .filter(p => !p.isBanned)
      .map(p => ({
        userId: p.user._id,
        username: p.user.username,
        teamName: p.teamName,
        currentPoints: p.currentPoints,
        isBanned: p.isBanned
      }))
      .sort((a, b) => b.currentPoints - a.currentPoints);

    res.status(200).json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const closeRoom = async (req, res) => {
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
        message: 'Only room admin can close the room'
      });
    }

    room.status = 'closed';
    await room.save();

    res.status(200).json({
      success: true,
      message: 'Room closed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const reopenRoom = async (req, res) => {
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
        message: 'Only room admin can reopen the room'
      });
    }

    room.status = 'active';
    await room.save();

    res.status(200).json({
      success: true,
      message: 'Room reopened successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const getMyAdminRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ admin: req.user._id })
      .select('roomCode roomName initialPoints status participants createdAt')
      .sort({ createdAt: -1 });

    const roomsWithStats = rooms.map(room => ({
      roomId: room._id,
      roomCode: room.roomCode,
      roomName: room.roomName,
      initialPoints: room.initialPoints,
      status: room.status,
      participantCount: room.participants.length,
      createdAt: room.createdAt
    }));

    res.status(200).json({
      success: true,
      data: roomsWithStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const getRoomParticipants = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findById(roomId)
      .populate('participants.user', 'username email teamName');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    if (room.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only room admin can view participants'
      });
    }

    const participants = room.participants.map(p => ({
      userId: p.user._id,
      username: p.user.username,
      email: p.user.email,
      teamName: p.teamName,
      currentPoints: p.currentPoints,
      isBanned: p.isBanned,
      joinedAt: p.joinedAt
    }));

    res.status(200).json({
      success: true,
      data: {
        roomInfo: {
          roomId: room._id,
          roomCode: room.roomCode,
          roomName: room.roomName,
          initialPoints: room.initialPoints,
          status: room.status
        },
        participants
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
  createRoom,
  deleteRoom,
  banUser,
  unbanUser,
  getLeaderboard,
  closeRoom,
  reopenRoom,
  getMyAdminRooms,
  getRoomParticipants
};
