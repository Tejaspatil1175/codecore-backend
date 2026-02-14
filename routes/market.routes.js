const express = require('express');
const {
  listCodesForSale,
  setCodeForSale,
  sellCodeToTeam,
  purchaseCode,
  getMyCodes,
  useUnlockCode,
  sendPurchaseRequest,
  getMyPurchaseRequests,
  acceptPurchaseRequest
} = require('../controllers/marketController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/rooms/:roomId/market', protect, listCodesForSale);
router.post('/rooms/:roomId/market/sell', protect, setCodeForSale);
router.post('/rooms/:roomId/market/sell-to-team', protect, sellCodeToTeam);
router.post('/rooms/:roomId/market/purchase', protect, purchaseCode);
router.post('/rooms/:roomId/market/use-code', protect, useUnlockCode);
router.get('/rooms/:roomId/my-codes', protect, getMyCodes);

// Marketplace request system
router.post('/rooms/:roomId/market/request', protect, sendPurchaseRequest);
router.get('/rooms/:roomId/market/requests', protect, getMyPurchaseRequests);
router.post('/rooms/:roomId/market/requests/:requestId/accept', protect, acceptPurchaseRequest);

module.exports = router;
