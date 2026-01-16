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

    const room = await Room.findById(roomId).populate('participants.user', 'username teamName');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const participant = room.participants.find(
      p => p.user._id.toString() === req.user._id.toString()
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
        status: room.status,
        participants: room.participants
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

    // Sort participants by points (descending)
    const leaderboard = room.participants
      .filter(p => !p.isBanned)
      .map(p => ({
        userId: p.user._id,
        username: p.user.username,
        teamName: p.user.teamName || p.teamName,
        points: p.currentPoints,
        joinedAt: p.joinedAt
      }))
      .sort((a, b) => b.points - a.points)
      .map((entry, index) => ({
        rank: index + 1,
        ...entry
      }));

    res.status(200).json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('Leaderboard Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const getMyTransactions = async (req, res) => {
  try {
    const { roomId } = req.params;

    const transactions = await Transaction.find({
      room: roomId,
      $or: [
        { to: req.user._id },
        { from: req.user._id }
      ]
    })
      .populate('from', 'username teamName')
      .populate('to', 'username teamName')
      .populate('question', 'title questionNumber')
      .sort({ createdAt: -1 })
      .limit(50);

    const formattedTransactions = transactions.map(t => ({
      id: t._id,
      type: t.type,
      points: t.points,
      description: t.description,
      from: t.from ? {
        id: t.from._id,
        username: t.from.username,
        teamName: t.from.teamName
      } : null,
      to: t.to ? {
        id: t.to._id,
        username: t.to.username,
        teamName: t.to.teamName
      } : null,
      question: t.question ? {
        id: t.question._id,
        title: t.question.title,
        questionNumber: t.question.questionNumber
      } : null,
      createdAt: t.createdAt,
      isIncoming: t.to && t.to._id.toString() === req.user._id.toString()
    }));

    res.status(200).json({
      success: true,
      data: formattedTransactions
    });
  } catch (error) {
    console.error('Transactions Error:', error);
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
  getRoomDetails,
  getLeaderboard,
  getMyTransactions
};
