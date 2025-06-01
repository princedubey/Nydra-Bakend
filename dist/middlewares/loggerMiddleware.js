"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const requestLogger = (req, res, next) => {
    // Get request start time
    const start = Date.now();
    // Log request
    logger_1.default.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
    });
    // Log response time on finish
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger_1.default.info(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
    });
    next();
};
exports.requestLogger = requestLogger;
