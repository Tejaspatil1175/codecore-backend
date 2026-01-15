const crypto = require('crypto');
const { ROOM_CODE_LENGTH, UNLOCK_CODE_LENGTH } = require('../config/constants');

const generateRoomCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    const randomIndex = crypto.randomInt(0, characters.length);
    code += characters[randomIndex];
  }
  
  return code;
};

const generateUnlockCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  
  for (let i = 0; i < UNLOCK_CODE_LENGTH; i++) {
    const randomIndex = crypto.randomInt(0, characters.length);
    code += characters[randomIndex];
  }
  
  return code;
};

const generateUniqueRoomCode = async (Room) => {
  let code;
  let exists = true;
  
  while (exists) {
    code = generateRoomCode();
    const room = await Room.findOne({ roomCode: code });
    exists = !!room;
  }
  
  return code;
};

const generateUniqueUnlockCode = async (UnlockCode) => {
  let code;
  let exists = true;
  
  while (exists) {
    code = generateUnlockCode();
    const unlock = await UnlockCode.findOne({ code: code });
    exists = !!unlock;
  }
  
  return code;
};

module.exports = {
  generateRoomCode,
  generateUnlockCode,
  generateUniqueRoomCode,
  generateUniqueUnlockCode
};
