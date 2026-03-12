const mongoose = require('mongoose');

const RETRY_DELAY_MS = 5000;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce',
      {
        serverSelectionTimeoutMS: 10000,
      }
    );
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);

    setTimeout(() => {
      connectDB();
    }, RETRY_DELAY_MS);
  }
};

module.exports = connectDB;
