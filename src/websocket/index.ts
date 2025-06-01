import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt, { Secret } from 'jsonwebtoken';
import Device from '../models/Device';
import logger from '../utils/logger';

let io: Server;

// Initialize WebSocket server
export const initWebSocket = (httpServer: HttpServer): void => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Socket.IO middleware for authentication
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const deviceToken = socket.handshake.auth.deviceToken;
      const secret: Secret = process.env.JWT_SECRET || 'secret';

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Verify user token
      const decoded: any = jwt.verify(token, secret);

      if (!decoded || !decoded.id) {
        return next(new Error('Authentication error: Invalid token'));
      }

      socket.data.userId = decoded.id;

      // If device token is provided, verify and set device
      if (deviceToken) {
        const deviceDecoded: any = jwt.verify(deviceToken, secret);

        if (!deviceDecoded || !deviceDecoded.deviceId) {
          return next(new Error('Authentication error: Invalid device token'));
        }

        const device = await Device.findOne({
          deviceId: deviceDecoded.deviceId,
          userId: decoded.id,
        });

        if (!device) {
          return next(new Error('Device not found'));
        }

        socket.data.deviceId = device._id;
        socket.data.deviceType = device.deviceType;
      }

      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  // Connection handler
  io.on('connection', (socket: Socket) => {
    const { userId, deviceId, deviceType } = socket.data;
    
    logger.info('New connection:', {
      userId,
      deviceId,
      deviceType,
      socketId: socket.id,
    });

    // Join user room
    socket.join(`user:${userId}`);
    
    // Join device room if device is connected
    if (deviceId) {
      socket.join(`device:${deviceId}`);
      
      // Update device status to online
      updateDeviceStatus(deviceId, true);
    }

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info('Client disconnected:', {
        userId,
        deviceId,
        socketId: socket.id,
      });

      // Update device status to offline if it was a device connection
      if (deviceId) {
        updateDeviceStatus(deviceId, false);
      }
    });

    // Handle ping (for device health check)
    socket.on('ping', async (data, callback) => {
      if (deviceId) {
        // Update device last active timestamp
        await Device.findByIdAndUpdate(deviceId, {
          lastActive: new Date(),
        });
      }
      
      if (typeof callback === 'function') {
        callback({ status: 'pong', timestamp: new Date() });
      }
    });
  });

  logger.info('WebSocket server initialized');
};

// Get Socket.IO instance
export const getIoInstance = (): Server => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized');
  }
  return io;
};

// Update device status
const updateDeviceStatus = async (
  deviceId: string,
  isOnline: boolean
): Promise<void> => {
  try {
    const device = await Device.findByIdAndUpdate(
      deviceId,
      {
        isOnline,
        lastActive: new Date(),
      },
      { new: true }
    );

    if (device) {
      // Emit device status update to all users
      io.to(`user:${device.userId}`).emit('deviceStatusUpdate', {
        deviceId: device._id,
        isOnline: device.isOnline,
        lastActive: device.lastActive,
      });
    }
  } catch (error) {
    logger.error('Error updating device status:', error);
  }
};