"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const catchAsync_1 = require("../utils/catchAsync");
const apiError_1 = require("../utils/apiError");
// Generate JWT Token
const generateToken = (id) => {
    const secret = process.env.JWT_SECRET || 'secret';
    // 7 days in seconds
    const expiresIn = 7 * 24 * 60 * 60;
    return jsonwebtoken_1.default.sign({ id }, secret, { expiresIn });
};
// Register user
exports.register = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { email, password, name } = req.body;
    // Check if user already exists
    const userExists = await User_1.default.findOne({ email });
    if (userExists) {
        return next(new apiError_1.ApiError('User already exists', 400));
    }
    // Create new user
    const user = await User_1.default.create({
        email,
        password,
        name,
    });
    // Generate token
    const token = generateToken(user._id.toString());
    res.status(201).json({
        success: true,
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
        },
    });
});
// Login user
exports.login = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { email, password } = req.body;
    // Check if email and password are provided
    if (!email || !password) {
        return next(new apiError_1.ApiError('Please provide email and password', 400));
    }
    // Check if user exists
    const user = await User_1.default.findOne({ email });
    if (!user) {
        return next(new apiError_1.ApiError('Invalid credentials', 401));
    }
    // Check if password is correct
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
        return next(new apiError_1.ApiError('Invalid credentials', 401));
    }
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    // Generate token
    const token = generateToken(user._id.toString());
    res.status(200).json({
        success: true,
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
        },
    });
});
// Get current user
exports.getCurrentUser = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const user = await User_1.default.findById(req.user.id).select('-password');
    res.status(200).json({
        success: true,
        user,
    });
});
