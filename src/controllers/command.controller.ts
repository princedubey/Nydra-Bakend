import type { Response } from "express"
import { Command } from "../models/Command.model"
import { Device } from "../models/Device.model"
import type { AuthRequest } from "../middlewares/auth.middleware"
import { commandQueue } from "../config/queues"
import { logger } from "../utils/logger"
import { createError } from "../middlewares/errorHandler"
import { io } from "../server"

export const sendCommand = async (req: AuthRequest, res: Response) => {
  try {
    const { targetDeviceId, type, command, parameters, priority, scheduledAt } = req.body
    const userId = req.user._id
    const sourceDeviceId = req.device?.deviceId

    // Verify target device exists and belongs to user
    const targetDevice = await Device.findOne({
      deviceId: targetDeviceId,
      userId,
    })

    if (!targetDevice) {
      throw createError("Target device not found or not accessible", 404)
    }

    // Create command
    const newCommand = new Command({
      userId,
      sourceDeviceId,
      targetDeviceId,
      type,
      command,
      parameters,
      priority,
      scheduledAt,
    })

    await newCommand.save()

    // Add to queue for processing
    await commandQueue.add(
      "execute-command",
      {
        commandId: newCommand._id,
      },
      {
        priority: getPriorityValue(priority),
        delay: scheduledAt ? new Date(scheduledAt).getTime() - Date.now() : 0,
      },
    )

    // Emit real-time notification to target device
    io.to(`device:${targetDeviceId}`).emit("new-command", {
      commandId: newCommand._id,
      command,
      type,
      parameters,
      priority,
    })

    logger.info(`Command sent from ${sourceDeviceId} to ${targetDeviceId}: ${command}`)

    res.status(201).json({
      message: "Command sent successfully",
      command: newCommand,
    })
  } catch (error) {
    throw error
  }
}

export const getCommandStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const command = await Command.findOne({
      _id: id,
      userId: req.user._id,
    })

    if (!command) {
      throw createError("Command not found", 404)
    }

    res.json({ command })
  } catch (error) {
    throw error
  }
}

export const respondToCommand = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { status, result, error } = req.body

    const command = await Command.findOneAndUpdate(
      { _id: id },
      {
        status,
        result,
        error,
        completedAt: status === "completed" || status === "failed" ? new Date() : undefined,
        executionTime:
          status === "completed" || status === "failed"
            ? Date.now() - new Date(req.body.startedAt || Date.now()).getTime()
            : undefined,
      },
      { new: true },
    )

    if (!command) {
      throw createError("Command not found", 404)
    }

    // Emit real-time update to source device
    io.to(`device:${command.sourceDeviceId}`).emit("command-update", {
      commandId: command._id,
      status,
      result,
      error,
    })

    logger.info(`Command ${id} updated with status: ${status}`)

    res.json({
      message: "Command response recorded",
      command,
    })
  } catch (error) {
    throw error
  }
}

export const getCommands = async (req: AuthRequest, res: Response) => {
  try {
    const { status, deviceId, limit = 50, page = 1 } = req.query

    const filter: any = { userId: req.user._id }

    if (status) filter.status = status
    if (deviceId) {
      filter.$or = [{ sourceDeviceId: deviceId }, { targetDeviceId: deviceId }]
    }

    const commands = await Command.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))

    const total = await Command.countDocuments(filter)

    res.json({
      commands,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    })
  } catch (error) {
    throw error
  }
}

const getPriorityValue = (priority: string): number => {
  const priorities = { low: 1, medium: 2, high: 3, urgent: 4 }
  return priorities[priority as keyof typeof priorities] || 2
}

// Default export
const commandController = { sendCommand, getCommandStatus, respondToCommand, getCommands }
export default commandController
