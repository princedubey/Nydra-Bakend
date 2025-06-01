import Redis from "ioredis"
import { logger } from "../utils/logger"

let redisClient: Redis

export const connectRedis = async (): Promise<void> => {
  try {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: Number.parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    })

    redisClient.on("connect", () => {
      logger.info("✅ Connected to Redis")
    })

    redisClient.on("error", (error) => {
      logger.error("Redis connection error:", error)
    })

    redisClient.on("close", () => {
      logger.warn("Redis connection closed")
    })
  } catch (error) {
    logger.error("Failed to connect to Redis:", error)
    throw error
  }
}

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    throw new Error("Redis client not initialized")
  }
  return redisClient
}
