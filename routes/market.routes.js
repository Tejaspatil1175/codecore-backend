const express = require('express');
const {
  listCodesForSale,
  setCodeForSale,
  purchaseCode,
  getMyCodes
} = require('../controllers/marketController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/rooms/:roomId/market', protect, listCodesForSale);
router.post('/rooms/:roomId/market/sell', protect, setCodeForSale);
router.post('/rooms/:roomId/market/purchase', protect, purchaseCode);
router.get('/rooms/:roomId/my-codes', protect, getMyCodes);

module.exports = router;
