const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {

    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Migration: Drop unique index on code if it exists (for static access codes)
    try {
      await mongoose.connection.collection('unlockcodes').dropIndex('code_1');
      console.log('Dropped legacy unique index on unlockcodes.code');
    } catch (e) {
      // Index likely doesn't exist, ignore
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
