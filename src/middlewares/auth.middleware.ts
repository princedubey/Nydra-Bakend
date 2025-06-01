import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { User } from "../models/User.model"
import { logger } from "../utils/logger"

export interface AuthRequest extends Request {
  user?: any
  device?: any
}

export const authenticateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ error: "Access denied. No token provided." })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const user = await User.findById(decoded.userId)

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid token or user not active." })
    }

    req.user = user
    next()
  } catch (error) {
    logger.error("Authentication error:", error)
    res.status(401).json({ error: "Invalid token." })
  }
}

export const authenticateDevice = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const deviceToken = req.header("X-Device-Token")

    if (!deviceToken) {
      return res.status(401).json({ error: "Device token required." })
    }

    const decoded = jwt.verify(deviceToken, process.env.JWT_SECRET || "fallback-secret") as any

    req.device = {
      deviceId: decoded.deviceId,
      userId: decoded.userId,
    }

    next()
  } catch (error) {
    logger.error("Device authentication error:", error)
    res.status(401).json({ error: "Invalid device token." })
  }
}
