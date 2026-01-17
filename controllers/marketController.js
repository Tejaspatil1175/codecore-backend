const UnlockCode = require('../models/UnlockCode');
const Room = require('../models/Room');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

const listCodesForSale = async (req, res) => {
  try {
    const { roomId } = req.params;

    const codes = await UnlockCode.find({
      room: roomId,
      isForSale: true,
      isUsed: false
    })
      .populate('owner', 'username teamName')
      .populate('nextQuestion', 'title questionNumber')
      .select('code sellingPrice owner nextQuestion');

    res.status(200).json({
      success: true,
      data: codes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const setCodeForSale = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { unlockCode, sellingPrice } = req.body;

    if (!unlockCode || sellingPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Unlock code and selling price are required'
      });
    }

    if (sellingPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Selling price must be greater than 0'
      });
    }

    const code = await UnlockCode.findOne({
      code: unlockCode,
      room: roomId,
      owner: req.user._id
    });

    if (!code) {
      return res.status(404).json({
        success: false,
        message: 'Unlock code not found or you do not own this code'
      });
    }

    if (!code.canSell) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to sell this code'
      });
    }

    if (code.isUsed) {
      return res.status(400).json({
        success: false,
        message: 'This code has already been used'
      });
    }

    code.isForSale = true;
    code.sellingPrice = sellingPrice;
    await code.save();

    res.status(200).json({
      success: true,
      message: 'Code listed for sale successfully',
      data: code
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const purchaseCode = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { roomId } = req.params;
    const { unlockCode } = req.body;

    if (!unlockCode) {
      return res.status(400).json({
        success: false,
        message: 'Unlock code is required'
      });
    }

    const code = await UnlockCode.findOne({
      code: unlockCode,
      room: roomId
    }).session(session);

    if (!code) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Unlock code not found'
      });
    }

    if (!code.isForSale) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'This code is not for sale'
      });
    }

    if (code.isUsed) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'This code has already been purchased'
      });
    }

    if (code.owner.toString() === req.user._id.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'You cannot purchase your own code'
      });
    }

    const room = await Room.findById(roomId).session(session);

    const buyer = room.participants.find(
      p => p.user.toString() === req.user._id.toString()
    );

    const seller = room.participants.find(
      p => p.user.toString() === code.owner.toString()
    );

    if (!buyer || !seller) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Buyer or seller not found in room'
      });
    }

    if (buyer.isBanned) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        message: 'You are banned from this room'
      });
    }

    if (buyer.currentPoints < code.sellingPrice) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Insufficient points to purchase this code'
      });
    }

    buyer.currentPoints -= code.sellingPrice;
    seller.currentPoints += code.sellingPrice;

    code.isUsed = true;
    code.usedBy = req.user._id;
    code.isForSale = false;

    await UnlockCode.create([{
      code: code.code,
      room: roomId,
      question: code.question,
      nextQuestion: code.nextQuestion,
      owner: req.user._id,
      canSell: false,
      isUsed: false
    }], { session });

    await Transaction.create([{
      room: roomId,
      type: 'code_purchase',
      from: req.user._id,
      to: code.owner,
      points: code.sellingPrice,
      question: code.nextQuestion,
      unlockCode: code._id,
      description: `Code purchase for unlocking question`
    }], { session });

    await code.save({ session });
    await room.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Code purchased successfully',
      data: {
        unlockedQuestionId: code.nextQuestion,
        pointsSpent: code.sellingPrice,
        remainingPoints: buyer.currentPoints
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const getMyCodes = async (req, res) => {
  try {
    const { roomId } = req.params;

    console.log('📋 getMyCodes - User:', req.user._id, 'Room:', roomId);

    const codes = await UnlockCode.find({
      room: roomId,
      owner: req.user._id
    })
      .populate('nextQuestion', 'title questionNumber points')
      .select('code canSell isForSale sellingPrice nextQuestion isUsed')
      .sort({ createdAt: -1 }); // Show newest first

    console.log('✅ Found codes:', codes.length);

    res.status(200).json({
      success: true,
      data: codes
    });
  } catch (error) {
    console.error('❌ getMyCodes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const useUnlockCode = async (req, res) => {
  console.log('🔓 useUnlockCode request received');
  console.log('Room ID:', req.params.roomId);
  console.log('Unlock Code:', req.body.unlockCode);
  console.log('User ID:', req.user ? req.user._id : 'No User');

  try {
    const { roomId } = req.params;
    const { unlockCode } = req.body;

    if (!unlockCode) {
      console.log('❌ Unlock code missing');
      return res.status(400).json({
        success: false,
        message: 'Unlock code is required'
      });
    }

    console.log('🔍 Searching for code...');
    // Find the unlock code
    const code = await UnlockCode.findOne({
      code: { $regex: new RegExp(`^${unlockCode}$`, 'i') },
      room: roomId,
      owner: req.user._id,
      isUsed: false
    }).populate('nextQuestion', 'title questionNumber');

    if (!code) {
      console.log('❌ Code not found or invalid ownership');
      // Debug: Check if code exists at all
      const exists = await UnlockCode.findOne({ code: { $regex: new RegExp(`^${unlockCode}$`, 'i') }, room: roomId });
      console.log('Does code exist in room?', exists ? 'Yes' : 'No');
      if (exists) {
        console.log('Owner match?', exists.owner.toString() === req.user._id.toString());
        console.log('Is used?', exists.isUsed);
      }

      // Check if it's a global access code defined on a Question
      const Question = require('../models/Question');
      const targetQuestion = await Question.findOne({
        room: roomId,
        accessCode: unlockCode
      });

      if (targetQuestion) {
        console.log('✅ Global Access Code found for question:', targetQuestion.title);

        const existingUnlock = await UnlockCode.findOne({
          room: roomId,
          owner: req.user._id,
          nextQuestion: targetQuestion._id
        });

        if (existingUnlock) {
          return res.status(200).json({
            success: true,
            message: 'Question already unlocked!',
            data: {
              questionId: targetQuestion._id,
              questionTitle: targetQuestion.title,
              questionNumber: targetQuestion.questionNumber
            }
          });
        }

        await UnlockCode.create({
          code: unlockCode,
          room: roomId,
          nextQuestion: targetQuestion._id,
          owner: req.user._id,
          isUsed: true,
          usedBy: req.user._id,
          canSell: false
        });

        return res.status(200).json({
          success: true,
          message: 'Question unlocked successfully!',
          data: {
            questionId: targetQuestion._id,
            questionTitle: targetQuestion.title,
            questionNumber: targetQuestion.questionNumber
          }
        });
      }

      return res.status(404).json({
        success: false,
        message: 'Invalid unlock code or you do not own this code'
      });
    }

    console.log('✅ Code found:', code.code);
    console.log('Next Question:', code.nextQuestion);

    // Mark code as used
    code.isUsed = true;
    code.usedBy = req.user._id;
    await code.save();
    console.log('💾 Code marked as used and saved');

    const response = {
      success: true,
      message: 'Question unlocked successfully!',
      data: {
        questionId: code.nextQuestion._id,
        questionTitle: code.nextQuestion.title,
        questionNumber: code.nextQuestion.questionNumber
      }
    };
    console.log('📤 Sending response:', response);

    return res.status(200).json(response);
  } catch (error) {
    console.error('🔥 Server Error inside useUnlockCode:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  listCodesForSale,
  setCodeForSale,
  purchaseCode,
  getMyCodes,
  useUnlockCode
};
