import mongoose from 'mongoose';
import { config } from './index.js';
import { logger } from '../utils/logger.js';

const LOCAL_MONGODB_URI = 'mongodb://localhost:27017/ai-report-agent';

export async function connectDatabase() {
  try {
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 8000,
    });
    logger.info('MongoDB connected successfully');
    return;
  } catch (error) {
    logger.error('MongoDB connection failed', {
      error: error.message,
      hint:
        'Allow your current IP in MongoDB Atlas Network Access, or use MONGODB_URI=mongodb://localhost:27017/ai-report-agent with local MongoDB running.',
    });

    if (config.mongodbUri.startsWith('mongodb+srv://')) {
      logger.warn('Attempting fallback to local MongoDB', {
        fallbackUri: LOCAL_MONGODB_URI,
      });
      try {
        await mongoose.connect(LOCAL_MONGODB_URI, {
          serverSelectionTimeoutMS: 8000,
        });
        logger.info('Local MongoDB connected successfully');
        return;
      } catch (fallbackError) {
        logger.error('Local MongoDB fallback failed', {
          error: fallbackError.message,
        });
        throw fallbackError;
      }
    }

    throw error;
  }
}
