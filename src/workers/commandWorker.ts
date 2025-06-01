import type { Job } from "bullmq"
import { Command } from "../models/Command.model"
import { Device } from "../models/Device.model"
import { logger } from "../utils/logger"
import { io } from "../server"

export const executeCommandJob = async (job: Job) => {
  const { commandId } = job.data

  try {
    // Get command details
    const command = await Command.findById(commandId)
    if (!command) {
      throw new Error("Command not found")
    }

    // Update command status to processing
    command.status = "processing"
    command.startedAt = new Date()
    await command.save()

    // Check if target device is online
    const targetDevice = await Device.findOne({ deviceId: command.targetDeviceId })
    if (!targetDevice || !targetDevice.isOnline) {
      command.status = "failed"
      command.error = "Target device is offline"
      command.completedAt = new Date()
      await command.save()

      // Notify source device
      io.to(`device:${command.sourceDeviceId}`).emit("command-failed", {
        commandId: command._id,
        error: "Target device is offline",
      })

      return
    }

    // Send command to target device via WebSocket
    io.to(`device:${command.targetDeviceId}`).emit("execute-command", {
      commandId: command._id,
      command: command.command,
      type: command.type,
      parameters: command.parameters,
      priority: command.priority,
    })

    logger.info(`Command ${commandId} sent to device ${command.targetDeviceId}`)

    // Set timeout for command execution (5 minutes)
    setTimeout(
      async () => {
        const timeoutCommand = await Command.findById(commandId)
        if (timeoutCommand && timeoutCommand.status === "processing") {
          timeoutCommand.status = "failed"
          timeoutCommand.error = "Command execution timeout"
          timeoutCommand.completedAt = new Date()
          await timeoutCommand.save()

          io.to(`device:${command.sourceDeviceId}`).emit("command-timeout", {
            commandId: command._id,
          })
        }
      },
      5 * 60 * 1000,
    ) // 5 minutes
  } catch (error) {
    logger.error("Command execution job failed:", error)

    // Update command status to failed
    await Command.findByIdAndUpdate(commandId, {
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
      completedAt: new Date(),
    })
  }
}
