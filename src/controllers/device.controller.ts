import type { Response } from "express"
import { v4 as uuidv4 } from "uuid"
import jwt from "jsonwebtoken"
import { Device } from "../models/Device.model"
import type { AuthRequest } from "../middlewares/auth.middleware"
import { logger } from "../utils/logger"
import { createError } from "../middlewares/errorHandler"

export const registerDevice = async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, platform, capabilities, metadata } = req.body
    const userId = req.user._id

    // Generate unique device ID
    const deviceId = uuidv4()

    // Create device
    const device = new Device({
      userId,
      name,
      type,
      platform,
      deviceId,
      capabilities: capabilities || [],
      metadata: {
        ...metadata,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      },
    })

    await device.save()

    // Generate device token
    const deviceToken = jwt.sign({ deviceId, userId }, process.env.JWT_SECRET || "fallback-secret", {
      expiresIn: "30d",
    })

    logger.info(`Device registered: ${device.name} for user ${req.user.email}`)

    res.status(201).json({
      message: "Device registered successfully",
      device,
      deviceToken,
    })
  } catch (error) {
    throw error
  }
}

export const getMyDevices = async (req: AuthRequest, res: Response) => {
  try {
    const devices = await Device.find({ userId: req.user._id }).sort({ createdAt: -1 })

    res.json({ devices })
  } catch (error) {
    throw error
  }
}

export const updateDeviceStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { isOnline } = req.body

    const device = await Device.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      {
        isOnline,
        lastPing: new Date(),
      },
      { new: true },
    )

    if (!device) {
      throw createError("Device not found", 404)
    }

    res.json({
      message: "Device status updated",
      device,
    })
  } catch (error) {
    throw error
  }
}

export const pingDevice = async (req: AuthRequest, res: Response) => {
  try {
    const { deviceId } = req.device

    const device = await Device.findOneAndUpdate(
      { deviceId },
      {
        isOnline: true,
        lastPing: new Date(),
      },
      { new: true },
    )

    if (!device) {
      throw createError("Device not found", 404)
    }

    res.json({ message: "Ping successful", timestamp: new Date() })
  } catch (error) {
    throw error
  }
}

// Default export
const deviceController = { registerDevice, getMyDevices, updateDeviceStatus, pingDevice }
export default deviceController
