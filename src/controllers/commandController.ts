import { Request, Response, NextFunction } from 'express';
import Command, { CommandStatus } from '../models/Command';
import Device from '../models/Device';
import { catchAsync } from '../utils/catchAsync';
import { ApiError } from '../utils/apiError';
import { getIoInstance } from '../websocket';
import { queueCommand } from '../workers/commandQueue';

// Send a command to a device
export const sendCommand = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { targetDeviceId, commandType, command, parameters, executeAt, priority } = req.body;
    const userId = req.user.id;
    const sourceDeviceId = req.device.id;

    // Check if target device exists and belongs to user
    const targetDevice = await Device.findOne({
      _id: targetDeviceId,
      userId,
    });

    if (!targetDevice) {
      return next(new ApiError('Target device not found', 404));
    }

    // Create command
    const newCommand = await Command.create({
      userId,
      sourceDeviceId,
      targetDeviceId,
      commandType,
      command,
      parameters: parameters || {},
      status: 'pending',
      priority: priority || 0,
      executeAt: executeAt ? new Date(executeAt) : new Date(),
    });

    // Queue command for execution
    await queueCommand(newCommand);

    // Emit command to target device if online
    if (targetDevice.isOnline) {
      const io = getIoInstance();
      io.to(`device:${targetDeviceId}`).emit('newCommand', {
        commandId: newCommand._id,
        commandType,
        command,
        parameters: parameters || {},
      });
    }

    res.status(201).json({
      success: true,
      command: newCommand,
    });
  }
);

// Get command status
export const getCommandStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user.id;

    const command = await Command.findOne({ _id: id, userId });
    if (!command) {
      return next(new ApiError('Command not found', 404));
    }

    res.status(200).json({
      success: true,
      command,
    });
  }
);

// Update command response (from device)
export const updateCommandResponse = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { status, result, error } = req.body;
    const userId = req.user.id;
    const deviceId = req.device.id;

    // Find command
    const command = await Command.findOne({
      _id: id,
      userId,
      targetDeviceId: deviceId,
    });

    if (!command) {
      return next(new ApiError('Command not found', 404));
    }

    // Update command status
    command.status = status as CommandStatus;
    
    if (status === 'executing') {
      command.startedAt = new Date();
    } else if (status === 'completed' || status === 'failed') {
      command.completedAt = new Date();
      command.result = result || {};
      command.error = error || '';
    }

    await command.save();

    // Notify source device about command update
    const io = getIoInstance();
    io.to(`device:${command.sourceDeviceId}`).emit('commandStatusUpdate', {
      commandId: command._id,
      status: command.status,
      result: command.result,
      error: command.error,
    });

    res.status(200).json({
      success: true,
      command,
    });
  }
);

// Get user's command history
export const getCommandHistory = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { deviceId, status, limit = 20, page = 1 } = req.query;

    // Build query
    const query: any = { userId };
    
    if (deviceId) {
      query.$or = [
        { sourceDeviceId: deviceId },
        { targetDeviceId: deviceId },
      ];
    }
    
    if (status) {
      query.status = status;
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get commands
    const commands = await Command.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Command.countDocuments(query);

    res.status(200).json({
      success: true,
      count: commands.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      page: Number(page),
      commands,
    });
  }
);

// Cancel a pending command
export const cancelCommand = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user.id;

    const command = await Command.findOne({ _id: id, userId });
    if (!command) {
      return next(new ApiError('Command not found', 404));
    }

    if (command.status !== 'pending' && command.status !== 'queued') {
      return next(
        new ApiError('Only pending or queued commands can be cancelled', 400)
      );
    }

    command.status = 'cancelled';
    await command.save();

    res.status(200).json({
      success: true,
      message: 'Command cancelled successfully',
    });
  }
);