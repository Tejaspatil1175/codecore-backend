const express = require('express');
const {
  addQuestion,
  getQuestions,
  getQuestionById,
  submitAnswer
} = require('../controllers/questionController');
const { protect } = require('../middleware/auth');
const { adminAuth } = require('../middleware/adminAuth');

const router = express.Router();

router.post('/rooms/:roomId/questions', protect, adminAuth, addQuestion);
router.get('/rooms/:roomId/questions', protect, getQuestions);
router.get('/rooms/:roomId/questions/:questionId', protect, getQuestionById);
router.post('/rooms/:roomId/questions/:questionId/submit', protect, submitAnswer);

module.exports = router;
