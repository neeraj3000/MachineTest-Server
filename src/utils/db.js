// Database helper: connects to MongoDB once and reuses the connection
const mongoose = require('mongoose');
require('dotenv').config();  
let isConnected = false;

async function connectToDatabase() {
  if (isConnected) return mongoose.connection;

  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/machinetest';

  mongoose.set('strictQuery', true);
  console.log('Connecting to MongoDB...');
  console.log(mongoUri);
  await mongoose.connect(mongoUri);
  isConnected = true;
  return mongoose.connection;
}

module.exports = { connectToDatabase };
