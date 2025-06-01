import Command from '../models/Command';
import Device from '../models/Device';
import { getIoInstance } from '../websocket';
import logger from '../utils/logger';

// In-memory command queue
const commandQueue: any[] = [];
let isProcessing = false;

// Queue a command
export const queueCommand = async (command: any): Promise<void> => {
  try {
    // Update command status to queued
    await Command.findByIdAndUpdate(command._id, { status: 'queued' });

    // Add command to queue
    commandQueue.push({
      commandId: command._id,
      userId: command.userId,
      targetDeviceId: command.targetDeviceId,
      priority: command.priority,
      executeAt: command.executeAt,
    });

    logger.info(`Command queued: ${command._id}`);
    
    // Start processing if not already processing
    if (!isProcessing) {
      processQueue();
    }
  } catch (error) {
    logger.error(`Error queueing command: ${command._id}`, error);
    await Command.findByIdAndUpdate(command._id, {
      status: 'failed',
      error: 'Failed to queue command',
    });
  }
};

// Process commands from queue
const processQueue = async () => {
  if (isProcessing || commandQueue.length === 0) return;
  
  isProcessing = true;
  
  while (commandQueue.length > 0) {
    const job = commandQueue.shift();
    const { commandId, userId, targetDeviceId, executeAt } = job;

    try {
      // Check if command should be executed now
      if (executeAt && new Date(executeAt) > new Date()) {
        // Put back in queue if not ready to execute
        commandQueue.push(job);
        continue;
      }

      logger.info(`Processing command: ${commandId}`);

      // Get command
      const command = await Command.findById(commandId);
      if (!command) {
        throw new Error('Command not found');
      }

      // Skip if command was cancelled
      if (command.status === 'cancelled') {
        continue;
      }

      // Check if target device is online
      const device = await Device.findById(targetDeviceId);
      if (!device) {
        throw new Error('Target device not found');
      }

      if (!device.isOnline) {
        // Put back in queue if device is offline
        commandQueue.push(job);
        continue;
      }

      // Send command to device via WebSocket
      const io = getIoInstance();
      io.to(`device:${targetDeviceId}`).emit('executeCommand', {
        commandId,
        commandType: command.commandType,
        command: command.command,
        parameters: command.parameters,
      });

      // Update command status
      command.status = 'executing';
      command.startedAt = new Date();
      await command.save();

    } catch (error: any) {
      logger.error(`Error processing command: ${commandId}`, error);

      // Update command status on error
      await Command.findByIdAndUpdate(commandId, {
        status: 'failed',
        error: error.message,
      });
    }
  }
  
  isProcessing = false;
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  // Clear queue
  commandQueue.length = 0;
  isProcessing = false;
});

export default {
  queueCommand,
  processQueue,
};