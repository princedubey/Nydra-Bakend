"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisClient = exports.initRedis = void 0;
const redis_1 = require("redis");
const logger_1 = __importDefault(require("../utils/logger"));
// Redis client
let redisClient;
let hasLoggedError = false;
const initRedis = async () => {
    try {
        const host = process.env.REDIS_HOST || 'localhost';
        const port = parseInt(process.env.REDIS_PORT || '6379');
        redisClient = (0, redis_1.createClient)({
            url: `redis://${host}:${port}`,
            socket: {
                reconnectStrategy: false // Completely disable reconnection
            }
        });
        // Remove error handler since we're not reconnecting
        await redisClient.connect();
        logger_1.default.info('Redis connected');
    }
    catch (error) {
        if (!hasLoggedError) {
            logger_1.default.warn('Redis connection failed - running without Redis');
            hasLoggedError = true;
        }
    }
};
exports.initRedis = initRedis;
const getRedisClient = () => {
    if (!redisClient) {
        if (!hasLoggedError) {
            logger_1.default.warn('Redis client not available');
            hasLoggedError = true;
        }
        return null;
    }
    return redisClient;
};
exports.getRedisClient = getRedisClient;
