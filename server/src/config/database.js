import mongoose from 'mongoose';
import { config } from './index.js';
import { logger } from '../utils/logger.js';

export async function connectDatabase() {
  if (!config.mongodbUri) {
    throw new Error('MONGODB_URI is required. Set it to your MongoDB Atlas connection string.');
  }

  if (!config.mongodbUri.startsWith('mongodb://') && !config.mongodbUri.startsWith('mongodb+srv://')) {
    throw new Error('MONGODB_URI must be a MongoDB connection string starting with mongodb+srv:// or mongodb://');
  }

  if (/localhost|127\.0\.0\.1/i.test(config.mongodbUri)) {
    throw new Error('MONGODB_URI is pointing to local MongoDB. Set it to your MongoDB Atlas connection string.');
  }

  if (/<username>|<password>|<cluster>|cluster\.mongodb\.net/i.test(config.mongodbUri)) {
    throw new Error('MONGODB_URI still contains a placeholder. Paste your real MongoDB Atlas connection string into server/.env.');
  }

  try {
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 8000,
    });
    logger.info('MongoDB Atlas connected successfully');
    return;
  } catch (error) {
    logger.error('MongoDB connection failed', {
      error: error.message,
      hint:
        'Check your MongoDB Atlas URI, database user credentials, and Atlas Network Access allowlist.',
    });
    throw error;
  }
}
