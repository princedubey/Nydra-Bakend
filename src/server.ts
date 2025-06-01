import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"
import cors from "cors"
import helmet from "helmet"
import compression from "compression"
import rateLimit from "express-rate-limit"
import dotenv from "dotenv"

import { connectDatabase } from "./config/database"
import { connectRedis } from "./config/redis"
import { setupQueues } from "./config/queues"
import { logger } from "./utils/logger"
import { errorHandler } from "./middlewares/errorHandler"
import { requestLogger } from "./middlewares/requestLogger"

// Routes
import authRoutes from "./routes/auth.routes"
import deviceRoutes from "./routes/device.routes"
import commandRoutes from "./routes/command.routes"

// WebSocket
import { setupWebSocket } from "./websocket/socketHandler"

dotenv.config()

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
  },
})

const PORT = process.env.PORT || 3000

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
})

// Middlewares
app.use(helmet())
app.use(cors())
app.use(compression())
app.use(limiter)
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))
app.use(requestLogger)

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// API Routes
app.use("/api/auth", authRoutes)
app.use("/api/devices", deviceRoutes)
app.use("/api/commands", commandRoutes)

// WebSocket setup
setupWebSocket(io)

// Error handling
app.use(errorHandler)

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" })
})

async function startServer() {
  try {
    // Connect to databases
    await connectDatabase()
    await connectRedis()

    // Setup queues
    await setupQueues()

    server.listen(PORT, () => {
      logger.info(`🚀 Nydra Backend Server running on port ${PORT}`)
      logger.info(`📊 Health check available at http://localhost:${PORT}/health`)
    })
  } catch (error) {
    logger.error("Failed to start server:", error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully")
  server.close(() => {
    logger.info("Process terminated")
    process.exit(0)
  })
})

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully")
  server.close(() => {
    logger.info("Process terminated")
    process.exit(0)
  })
})

startServer()

export { app, io }
