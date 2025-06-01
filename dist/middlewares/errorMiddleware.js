"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const apiError_1 = require("../utils/apiError");
const logger_1 = __importDefault(require("../utils/logger"));
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    // Log error
    logger_1.default.error(`${req.method} ${req.path} - ${error.message}`, {
        stack: err.stack,
        requestBody: req.body,
        requestParams: req.params,
        requestQuery: req.query,
    });
    // MongoDB bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = new apiError_1.ApiError(message, 404);
    }
    // MongoDB duplicate key
    if (err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = new apiError_1.ApiError(message, 400);
    }
    // MongoDB validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors)
            .map((val) => val.message)
            .join(', ');
        error = new apiError_1.ApiError(message, 400);
    }
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = new apiError_1.ApiError(message, 401);
    }
    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = new apiError_1.ApiError(message, 401);
    }
    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error',
        ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
    });
};
exports.errorHandler = errorHandler;
