"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelCommand = exports.getCommandHistory = exports.updateCommandResponse = exports.getCommandStatus = exports.sendCommand = void 0;
const Command_1 = __importDefault(require("../models/Command"));
const Device_1 = __importDefault(require("../models/Device"));
const catchAsync_1 = require("../utils/catchAsync");
const apiError_1 = require("../utils/apiError");
const websocket_1 = require("../websocket");
const commandQueue_1 = require("../workers/commandQueue");
// Send a command to a device
exports.sendCommand = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { targetDeviceId, commandType, command, parameters, executeAt, priority } = req.body;
    const userId = req.user.id;
    const sourceDeviceId = req.device.id;
    // Check if target device exists and belongs to user
    const targetDevice = await Device_1.default.findOne({
        _id: targetDeviceId,
        userId,
    });
    if (!targetDevice) {
        return next(new apiError_1.ApiError('Target device not found', 404));
    }
    // Create command
    const newCommand = await Command_1.default.create({
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
    await (0, commandQueue_1.queueCommand)(newCommand);
    // Emit command to target device if online
    if (targetDevice.isOnline) {
        const io = (0, websocket_1.getIoInstance)();
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
});
// Get command status
exports.getCommandStatus = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.id;
    const command = await Command_1.default.findOne({ _id: id, userId });
    if (!command) {
        return next(new apiError_1.ApiError('Command not found', 404));
    }
    res.status(200).json({
        success: true,
        command,
    });
});
// Update command response (from device)
exports.updateCommandResponse = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { id } = req.params;
    const { status, result, error } = req.body;
    const userId = req.user.id;
    const deviceId = req.device.id;
    // Find command
    const command = await Command_1.default.findOne({
        _id: id,
        userId,
        targetDeviceId: deviceId,
    });
    if (!command) {
        return next(new apiError_1.ApiError('Command not found', 404));
    }
    // Update command status
    command.status = status;
    if (status === 'executing') {
        command.startedAt = new Date();
    }
    else if (status === 'completed' || status === 'failed') {
        command.completedAt = new Date();
        command.result = result || {};
        command.error = error || '';
    }
    await command.save();
    // Notify source device about command update
    const io = (0, websocket_1.getIoInstance)();
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
});
// Get user's command history
exports.getCommandHistory = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = req.user.id;
    const { deviceId, status, limit = 20, page = 1 } = req.query;
    // Build query
    const query = { userId };
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
    const commands = await Command_1.default.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));
    const total = await Command_1.default.countDocuments(query);
    res.status(200).json({
        success: true,
        count: commands.length,
        total,
        totalPages: Math.ceil(total / Number(limit)),
        page: Number(page),
        commands,
    });
});
// Cancel a pending command
exports.cancelCommand = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.id;
    const command = await Command_1.default.findOne({ _id: id, userId });
    if (!command) {
        return next(new apiError_1.ApiError('Command not found', 404));
    }
    if (command.status !== 'pending' && command.status !== 'queued') {
        return next(new apiError_1.ApiError('Only pending or queued commands can be cancelled', 400));
    }
    command.status = 'cancelled';
    await command.save();
    res.status(200).json({
        success: true,
        message: 'Command cancelled successfully',
    });
});
