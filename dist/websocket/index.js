"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIoInstance = exports.initWebSocket = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Device_1 = __importDefault(require("../models/Device"));
const logger_1 = __importDefault(require("../utils/logger"));
let io;
// Initialize WebSocket server
const initWebSocket = (httpServer) => {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });
    // Socket.IO middleware for authentication
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            const deviceToken = socket.handshake.auth.deviceToken;
            const secret = process.env.JWT_SECRET || 'secret';
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }
            // Verify user token
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            if (!decoded || !decoded.id) {
                return next(new Error('Authentication error: Invalid token'));
            }
            socket.data.userId = decoded.id;
            // If device token is provided, verify and set device
            if (deviceToken) {
                const deviceDecoded = jsonwebtoken_1.default.verify(deviceToken, secret);
                if (!deviceDecoded || !deviceDecoded.deviceId) {
                    return next(new Error('Authentication error: Invalid device token'));
                }
                const device = await Device_1.default.findOne({
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
        }
        catch (error) {
            logger_1.default.error('Socket authentication error:', error);
            next(new Error('Authentication error'));
        }
    });
    // Connection handler
    io.on('connection', (socket) => {
        const { userId, deviceId, deviceType } = socket.data;
        logger_1.default.info('New connection:', {
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
            logger_1.default.info('Client disconnected:', {
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
                await Device_1.default.findByIdAndUpdate(deviceId, {
                    lastActive: new Date(),
                });
            }
            if (typeof callback === 'function') {
                callback({ status: 'pong', timestamp: new Date() });
            }
        });
    });
    logger_1.default.info('WebSocket server initialized');
};
exports.initWebSocket = initWebSocket;
// Get Socket.IO instance
const getIoInstance = () => {
    if (!io) {
        throw new Error('Socket.IO has not been initialized');
    }
    return io;
};
exports.getIoInstance = getIoInstance;
// Update device status
const updateDeviceStatus = async (deviceId, isOnline) => {
    try {
        const device = await Device_1.default.findByIdAndUpdate(deviceId, {
            isOnline,
            lastActive: new Date(),
        }, { new: true });
        if (device) {
            // Emit device status update to all users
            io.to(`user:${device.userId}`).emit('deviceStatusUpdate', {
                deviceId: device._id,
                isOnline: device.isOnline,
                lastActive: device.lastActive,
            });
        }
    }
    catch (error) {
        logger_1.default.error('Error updating device status:', error);
    }
};
