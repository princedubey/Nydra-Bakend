import { createClient } from 'redis';
import logger from '../utils/logger';

// Redis client
let redisClient: any;
let hasLoggedError = false;

export const initRedis = async (): Promise<void> => {
  try {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.REDIS_PORT || '6379');
    
    redisClient = createClient({
      url: `redis://${host}:${port}`,
      socket: {
        reconnectStrategy: false // Completely disable reconnection
      }
    });
    
    // Remove error handler since we're not reconnecting
    await redisClient.connect();
    logger.info('Redis connected');
    
  } catch (error) {
    if (!hasLoggedError) {
      logger.warn('Redis connection failed - running without Redis');
      hasLoggedError = true;
    }
  }
};

export const getRedisClient = () => {
  if (!redisClient) {
    if (!hasLoggedError) {
      logger.warn('Redis client not available');
      hasLoggedError = true;
    }
    return null;
  }
  return redisClient;
};