import mongoose from "mongoose"
import { logger } from "../utils/logger"

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/nydra"

    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })

    logger.info("✅ Connected to MongoDB")

    mongoose.connection.on("error", (error) => {
      logger.error("MongoDB connection error:", error)
    })

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected")
    })
  } catch (error) {
    logger.error("Failed to connect to MongoDB:", error)
    throw error
  }
}

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect()
    logger.info("Disconnected from MongoDB")
  } catch (error) {
    logger.error("Error disconnecting from MongoDB:", error)
  }
}
