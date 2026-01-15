const Question = require('../models/Question');
const Room = require('../models/Room');
const Submission = require('../models/Submission');
const UnlockCode = require('../models/UnlockCode');
const Transaction = require('../models/Transaction');
const { validateMultipleTestCases } = require('../utils/validators');
const { generateUniqueUnlockCode } = require('../utils/codeGenerator');

const addQuestion = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { 
      title, 
      description, 
      inputFormat, 
      outputFormat, 
      constraints,
      examples,
      testCases, 
      points, 
      difficulty 
    } = req.body;

    if (!title || !description || !testCases || !points) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const questionCount = await Question.countDocuments({ room: roomId });

    const question = await Question.create({
      room: roomId,
      questionNumber: questionCount + 1,
      title,
      description,
      inputFormat,
      outputFormat,
      constraints,
      examples,
      testCases,
      points,
      difficulty
    });

    res.status(201).json({
      success: true,
      data: question
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const getQuestions = async (req, res) => {
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

    const questions = await Question.find({ room: roomId })
      .sort({ questionNumber: 1 })
      .select('-testCases');

    const submissions = await Submission.find({
      user: req.user._id,
      room: roomId,
      status: 'correct'
    }).select('question');

    const solvedQuestionIds = submissions.map(s => s.question.toString());

    const unlockCodes = await UnlockCode.find({
      room: roomId,
      owner: req.user._id
    }).select('question nextQuestion');

    const questionsWithAccess = questions.map((question, index) => {
      const isSolved = solvedQuestionIds.includes(question._id.toString());
      const isFirstQuestion = index === 0;
      
      let hasAccess = isFirstQuestion || isSolved;
      
      if (!hasAccess) {
        const hasUnlockCode = unlockCodes.some(
          code => code.nextQuestion.toString() === question._id.toString()
        );
        hasAccess = hasUnlockCode;
      }

      return {
        ...question.toObject(),
        hasAccess,
        isSolved
      };
    });

    res.status(200).json({
      success: true,
      data: questionsWithAccess
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const getQuestionById = async (req, res) => {
  try {
    const { roomId, questionId } = req.params;

    const question = await Question.findOne({
      _id: questionId,
      room: roomId
    }).select('-testCases.expectedOutput');

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.status(200).json({
      success: true,
      data: question
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const submitAnswer = async (req, res) => {
  try {
    const { roomId, questionId } = req.params;
    const { userOutput } = req.body;

    if (!userOutput) {
      return res.status(400).json({
        success: false,
        message: 'User output is required'
      });
    }

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

    const alreadySolved = await Submission.findOne({
      user: req.user._id,
      room: roomId,
      question: questionId,
      status: 'correct'
    });

    if (alreadySolved) {
      return res.status(400).json({
        success: false,
        message: 'You have already solved this question'
      });
    }

    const question = await Question.findOne({
      _id: questionId,
      room: roomId
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    const validationResult = validateMultipleTestCases(userOutput, question.testCases);

    const submission = await Submission.create({
      user: req.user._id,
      room: roomId,
      question: questionId,
      userOutput,
      status: validationResult.allPassed ? 'correct' : 'incorrect',
      pointsEarned: validationResult.allPassed ? question.points : 0
    });

    if (validationResult.allPassed) {
      participant.currentPoints += question.points;
      await room.save();

      await Transaction.create({
        room: roomId,
        type: 'question_solve',
        to: req.user._id,
        points: question.points,
        question: questionId,
        description: `Solved question: ${question.title}`
      });

      const nextQuestion = await Question.findOne({
        room: roomId,
        questionNumber: question.questionNumber + 1
      });

      if (nextQuestion) {
        const unlockCode = await generateUniqueUnlockCode(UnlockCode);
        
        await UnlockCode.create({
          code: unlockCode,
          room: roomId,
          question: questionId,
          nextQuestion: nextQuestion._id,
          owner: req.user._id,
          canSell: true
        });

        return res.status(200).json({
          success: true,
          message: 'Correct answer! Question solved.',
          data: {
            status: 'correct',
            pointsEarned: question.points,
            currentPoints: participant.currentPoints,
            unlockCode,
            nextQuestionId: nextQuestion._id
          }
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Correct answer! All questions completed.',
        data: {
          status: 'correct',
          pointsEarned: question.points,
          currentPoints: participant.currentPoints,
          allQuestionsCompleted: true
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Incorrect answer. Try again.',
      data: {
        status: 'incorrect',
        pointsEarned: 0,
        testResults: validationResult.results.filter(r => !r.isHidden)
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
  addQuestion,
  getQuestions,
  getQuestionById,
  submitAnswer
};
