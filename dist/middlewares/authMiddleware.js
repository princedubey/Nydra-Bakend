"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateDevice = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const Device_1 = __importDefault(require("../models/Device"));
const catchAsync_1 = require("../utils/catchAsync");
const apiError_1 = require("../utils/apiError");
// Verify JWT token
const verifyToken = (token) => {
    try {
        const secret = process.env.JWT_SECRET || 'secret';
        return jsonwebtoken_1.default.verify(token, secret);
    }
    catch (error) {
        return null;
    }
};
// Authenticate user middleware
exports.authenticate = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return next(new apiError_1.ApiError('Not authorized, no token', 401));
    }
    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
        return next(new apiError_1.ApiError('Not authorized, invalid token', 401));
    }
    // Check if user exists
    const user = await User_1.default.findById(decoded.id).select('-password');
    if (!user) {
        return next(new apiError_1.ApiError('User not found', 404));
    }
    // Set user in request
    req.user = user;
    next();
});
// Authenticate device middleware
exports.authenticateDevice = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    if (!req.user) {
        return next(new apiError_1.ApiError('User not authenticated', 401));
    }
    // Get device token from header
    const deviceToken = req.headers['x-device-token'];
    if (!deviceToken) {
        return next(new apiError_1.ApiError('Device token required', 401));
    }
    // Verify token
    const decoded = verifyToken(deviceToken);
    if (!decoded || !decoded.deviceId) {
        return next(new apiError_1.ApiError('Invalid device token', 401));
    }
    // Check if device exists and belongs to user
    const device = await Device_1.default.findOne({
        deviceId: decoded.deviceId,
        userId: req.user._id,
    });
    if (!device) {
        return next(new apiError_1.ApiError('Device not found', 404));
    }
    // Set device in request
    req.device = device;
    next();
});
