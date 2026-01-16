const express = require('express');
const {
  joinRoom,
  getMyRooms,
  getRoomDetails,
  getLeaderboard,
  getMyTransactions
} = require('../controllers/roomController');
const { useUnlockCode } = require('../controllers/marketController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/join', protect, joinRoom);
router.get('/my-rooms', protect, getMyRooms);
router.post('/:roomId/unlock', protect, useUnlockCode);
router.get('/:roomId', protect, getRoomDetails);
router.get('/:roomId/leaderboard', protect, getLeaderboard);
router.get('/:roomId/transactions/me', protect, getMyTransactions);

module.exports = router;
