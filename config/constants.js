module.exports = {
  ROOM_CODE_LENGTH: 6,
  UNLOCK_CODE_LENGTH: 8,
  DEFAULT_INITIAL_POINTS: 500,
  
  USER_ROLES: {
    ADMIN: 'admin',
    PLAYER: 'player'
  },

  ROOM_STATUS: {
    ACTIVE: 'active',
    CLOSED: 'closed'
  },

  SUBMISSION_STATUS: {
    CORRECT: 'correct',
    INCORRECT: 'incorrect'
  },

  TRANSACTION_TYPE: {
    CODE_PURCHASE: 'code_purchase',
    QUESTION_SOLVE: 'question_solve',
    INITIAL_ALLOCATION: 'initial_allocation'
  }
};
