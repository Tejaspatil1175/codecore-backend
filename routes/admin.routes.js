const express = require('express');
const {
  createRoom,
  deleteRoom,
  banUser,
  unbanUser,
  getLeaderboard,
  closeRoom,
  reopenRoom,
  getMyAdminRooms,
  getRoomParticipants
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { adminAuth } = require('../middleware/adminAuth');

const router = express.Router();

router.post('/rooms', protect, createRoom);
router.get('/my-rooms', protect, getMyAdminRooms);
router.get('/rooms/:roomId/participants', protect, adminAuth, getRoomParticipants);
router.delete('/rooms/:roomId', protect, adminAuth, deleteRoom);
router.put('/rooms/:roomId/close', protect, adminAuth, closeRoom);
router.put('/rooms/:roomId/reopen', protect, adminAuth, reopenRoom);
router.put('/rooms/:roomId/ban/:userId', protect, adminAuth, banUser);
router.put('/rooms/:roomId/unban/:userId', protect, adminAuth, unbanUser);
router.get('/rooms/:roomId/leaderboard', protect, adminAuth, getLeaderboard);

module.exports = router;
