import type { Server } from "socket.io"
import jwt from "jsonwebtoken"
import { Device } from "../models/Device.model"
import { logger } from "../utils/logger"

export const setupWebSocket = (io: Server) => {
  // Authentication middleware for WebSocket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      const deviceToken = socket.handshake.auth.deviceToken

      if (!token || !deviceToken) {
        return next(new Error("Authentication error"))
      }

      const userPayload = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
      const devicePayload = jwt.verify(deviceToken, process.env.JWT_SECRET || "fallback-secret") as any

      socket.data.userId = userPayload.userId
      socket.data.deviceId = devicePayload.deviceId

      next()
    } catch (error) {
      next(new Error("Authentication error"))
    }
  })

  io.on("connection", async (socket) => {
    const { userId, deviceId } = socket.data

    try {
      // Join device-specific room
      socket.join(`device:${deviceId}`)
      socket.join(`user:${userId}`)

      // Update device online status
      await Device.findOneAndUpdate(
        { deviceId },
        {
          isOnline: true,
          lastPing: new Date(),
        },
      )

      logger.info(`Device ${deviceId} connected via WebSocket`)

      // Notify other devices of this device coming online
      socket.to(`user:${userId}`).emit("device-status", {
        deviceId,
        isOnline: true,
        timestamp: new Date(),
      })

      // Handle device ping
      socket.on("ping", async () => {
        await Device.findOneAndUpdate({ deviceId }, { lastPing: new Date() })
        socket.emit("pong", { timestamp: new Date() })
      })

      // Handle command execution updates
      socket.on("command-progress", (data) => {
        socket.to(`user:${userId}`).emit("command-progress", {
          deviceId,
          ...data,
        })
      })

      // Handle disconnection
      socket.on("disconnect", async () => {
        try {
          await Device.findOneAndUpdate(
            { deviceId },
            {
              isOnline: false,
              lastPing: new Date(),
            },
          )

          logger.info(`Device ${deviceId} disconnected`)

          // Notify other devices of this device going offline
          socket.to(`user:${userId}`).emit("device-status", {
            deviceId,
            isOnline: false,
            timestamp: new Date(),
          })
        } catch (error) {
          logger.error("Error handling disconnect:", error)
        }
      })
    } catch (error) {
      logger.error("WebSocket connection error:", error)
      socket.disconnect()
    }
  })

  logger.info("✅ WebSocket server initialized")
}
