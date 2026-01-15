const express = require('express');
const {
  getMyTransactions,
  getRoomTransactions
} = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');
const { adminAuth } = require('../middleware/adminAuth');

const router = express.Router();

router.get('/rooms/:roomId/transactions/me', protect, getMyTransactions);
router.get('/rooms/:roomId/transactions/all', protect, adminAuth, getRoomTransactions);

module.exports = router;
