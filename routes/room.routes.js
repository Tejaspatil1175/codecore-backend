const express = require('express');
const {
  joinRoom,
  getMyRooms,
  getRoomDetails
} = require('../controllers/roomController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/join', protect, joinRoom);
router.get('/my-rooms', protect, getMyRooms);
router.get('/:roomId', protect, getRoomDetails);

module.exports = router;
