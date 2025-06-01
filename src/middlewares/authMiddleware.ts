import { Request, Response, NextFunction } from 'express';
import jwt, { Secret } from 'jsonwebtoken';
import User from '../models/User';
import Device from '../models/Device';
import { catchAsync } from '../utils/catchAsync';
import { ApiError } from '../utils/apiError';

// Verify JWT token
const verifyToken = (token: string): any => {
  try {
    const secret: Secret = process.env.JWT_SECRET || 'secret';
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

// Authenticate user middleware
export const authenticate = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(new ApiError('Not authorized, no token', 401));
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return next(new ApiError('Not authorized, invalid token', 401));
    }

    // Check if user exists
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return next(new ApiError('User not found', 404));
    }

    // Set user in request
    req.user = user;
    next();
  }
);

// Authenticate device middleware
export const authenticateDevice = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError('User not authenticated', 401));
    }

    // Get device token from header
    const deviceToken = req.headers['x-device-token'] as string;

    if (!deviceToken) {
      return next(new ApiError('Device token required', 401));
    }

    // Verify token
    const decoded = verifyToken(deviceToken);
    if (!decoded || !decoded.deviceId) {
      return next(new ApiError('Invalid device token', 401));
    }

    // Check if device exists and belongs to user
    const device = await Device.findOne({
      deviceId: decoded.deviceId,
      userId: req.user._id,
    });

    if (!device) {
      return next(new ApiError('Device not found', 404));
    }

    // Set device in request
    req.device = device;
    next();
  }
);