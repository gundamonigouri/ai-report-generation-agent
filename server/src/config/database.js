import mongoose from 'mongoose';
import { config } from './index.js';
import { logger } from '../utils/logger.js';

export async function connectDatabase() {
  try {
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 8000,
    });
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection failed', {
      error: error.message,
      hint:
        'Allow your current IP in MongoDB Atlas Network Access, or use MONGODB_URI=mongodb://localhost:27017/ai-report-agent with local MongoDB running.',
    });
    throw error;
  }
}
