import { Request, Response, NextFunction } from 'express';
import jwt, { Secret } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import Device from '../models/Device';
import { catchAsync } from '../utils/catchAsync';
import { ApiError } from '../utils/apiError';
import { getIoInstance } from '../websocket';

// Generate device token
const generateDeviceToken = (userId: string, deviceId: string): string => {
  const secret: Secret = process.env.JWT_SECRET || 'secret';
  // 30 days in seconds
  const expiresIn = 30 * 24 * 60 * 60;
  return jwt.sign(
    { userId, deviceId },
    secret,
    { expiresIn }
  );
};

// Register a new device
export const registerDevice = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, deviceType, platform, capabilities, metadata } = req.body;
    const userId = req.user.id;

    // Generate unique device ID
    const deviceId = uuidv4();
    
    // Generate device token
    const token = generateDeviceToken(userId, deviceId);

    // Create new device
    const device = await Device.create({
      userId,
      name,
      deviceType,
      deviceId,
      platform,
      token,
      capabilities: capabilities || [],
      metadata: metadata || {},
    });

    res.status(201).json({
      success: true,
      device: {
        id: device._id,
        name: device.name,
        deviceType: device.deviceType,
        deviceId: device.deviceId,
        token: device.token,
      },
    });
  }
);

// Get all devices for a user
export const getDevices = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user.id;

    const devices = await Device.find({ userId }).select('-token');

    res.status(200).json({
      success: true,
      count: devices.length,
      devices,
    });
  }
);

// Update device status
export const updateDeviceStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { isOnline } = req.body;
    const userId = req.user.id;

    // Find device
    const device = await Device.findOne({ _id: id, userId });
    if (!device) {
      return next(new ApiError('Device not found', 404));
    }

    // Update device status
    device.isOnline = isOnline;
    device.lastActive = new Date();
    await device.save();

    // Emit device status update to all connected clients
    const io = getIoInstance();
    io.to(`user:${userId}`).emit('deviceStatusUpdate', {
      deviceId: device._id,
      isOnline,
      lastActive: device.lastActive,
    });

    res.status(200).json({
      success: true,
      device: {
        id: device._id,
        isOnline: device.isOnline,
        lastActive: device.lastActive,
      },
    });
  }
);

// Delete a device
export const deleteDevice = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user.id;

    const device = await Device.findOneAndDelete({ _id: id, userId });
    if (!device) {
      return next(new ApiError('Device not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Device deleted successfully',
    });
  }
);