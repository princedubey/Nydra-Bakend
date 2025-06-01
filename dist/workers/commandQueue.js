"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueCommand = void 0;
const Command_1 = __importDefault(require("../models/Command"));
const Device_1 = __importDefault(require("../models/Device"));
const websocket_1 = require("../websocket");
const logger_1 = __importDefault(require("../utils/logger"));
// In-memory command queue
const commandQueue = [];
let isProcessing = false;
// Queue a command
const queueCommand = async (command) => {
    try {
        // Update command status to queued
        await Command_1.default.findByIdAndUpdate(command._id, { status: 'queued' });
        // Add command to queue
        commandQueue.push({
            commandId: command._id,
            userId: command.userId,
            targetDeviceId: command.targetDeviceId,
            priority: command.priority,
            executeAt: command.executeAt,
        });
        logger_1.default.info(`Command queued: ${command._id}`);
        // Start processing if not already processing
        if (!isProcessing) {
            processQueue();
        }
    }
    catch (error) {
        logger_1.default.error(`Error queueing command: ${command._id}`, error);
        await Command_1.default.findByIdAndUpdate(command._id, {
            status: 'failed',
            error: 'Failed to queue command',
        });
    }
};
exports.queueCommand = queueCommand;
// Process commands from queue
const processQueue = async () => {
    if (isProcessing || commandQueue.length === 0)
        return;
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
            logger_1.default.info(`Processing command: ${commandId}`);
            // Get command
            const command = await Command_1.default.findById(commandId);
            if (!command) {
                throw new Error('Command not found');
            }
            // Skip if command was cancelled
            if (command.status === 'cancelled') {
                continue;
            }
            // Check if target device is online
            const device = await Device_1.default.findById(targetDeviceId);
            if (!device) {
                throw new Error('Target device not found');
            }
            if (!device.isOnline) {
                // Put back in queue if device is offline
                commandQueue.push(job);
                continue;
            }
            // Send command to device via WebSocket
            const io = (0, websocket_1.getIoInstance)();
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
        }
        catch (error) {
            logger_1.default.error(`Error processing command: ${commandId}`, error);
            // Update command status on error
            await Command_1.default.findByIdAndUpdate(commandId, {
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
exports.default = {
    queueCommand: exports.queueCommand,
    processQueue,
};
