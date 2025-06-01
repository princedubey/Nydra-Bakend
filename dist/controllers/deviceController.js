"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDevice = exports.updateDeviceStatus = exports.getDevices = exports.registerDevice = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const Device_1 = __importDefault(require("../models/Device"));
const catchAsync_1 = require("../utils/catchAsync");
const apiError_1 = require("../utils/apiError");
const websocket_1 = require("../websocket");
// Generate device token
const generateDeviceToken = (userId, deviceId) => {
    const secret = process.env.JWT_SECRET || 'secret';
    // 30 days in seconds
    const expiresIn = 30 * 24 * 60 * 60;
    return jsonwebtoken_1.default.sign({ userId, deviceId }, secret, { expiresIn });
};
// Register a new device
exports.registerDevice = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { name, deviceType, platform, capabilities, metadata } = req.body;
    const userId = req.user.id;
    // Generate unique device ID
    const deviceId = (0, uuid_1.v4)();
    // Generate device token
    const token = generateDeviceToken(userId, deviceId);
    // Create new device
    const device = await Device_1.default.create({
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
});
// Get all devices for a user
exports.getDevices = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = req.user.id;
    const devices = await Device_1.default.find({ userId }).select('-token');
    res.status(200).json({
        success: true,
        count: devices.length,
        devices,
    });
});
// Update device status
exports.updateDeviceStatus = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { id } = req.params;
    const { isOnline } = req.body;
    const userId = req.user.id;
    // Find device
    const device = await Device_1.default.findOne({ _id: id, userId });
    if (!device) {
        return next(new apiError_1.ApiError('Device not found', 404));
    }
    // Update device status
    device.isOnline = isOnline;
    device.lastActive = new Date();
    await device.save();
    // Emit device status update to all connected clients
    const io = (0, websocket_1.getIoInstance)();
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
});
// Delete a device
exports.deleteDevice = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.id;
    const device = await Device_1.default.findOneAndDelete({ _id: id, userId });
    if (!device) {
        return next(new apiError_1.ApiError('Device not found', 404));
    }
    res.status(200).json({
        success: true,
        message: 'Device deleted successfully',
    });
});
