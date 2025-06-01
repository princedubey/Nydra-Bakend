"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.app = void 0;
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const database_1 = require("./config/database");
const redis_1 = require("./config/redis");
const websocket_1 = require("./websocket");
const errorMiddleware_1 = require("./middlewares/errorMiddleware");
const loggerMiddleware_1 = require("./middlewares/loggerMiddleware");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const deviceRoutes_1 = __importDefault(require("./routes/deviceRoutes"));
const commandRoutes_1 = __importDefault(require("./routes/commandRoutes"));
const logger_1 = __importDefault(require("./utils/logger"));
const app = (0, express_1.default)();
exports.app = app;
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(loggerMiddleware_1.requestLogger);
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/devices', deviceRoutes_1.default);
app.use('/api/commands', commandRoutes_1.default);
// Health check endpoint
app.get('/', async (req, res) => {
    try {
        const healthData = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            database: {
                status: 'connected',
                // Add more DB stats if needed
            },
            redis: {
                status: 'optional',
                // Add Redis stats if available
            },
            websocket: {
                status: 'active',
                // Add WebSocket stats if needed
            }
        };
        res.status(200).json(healthData);
    }
    catch (error) {
        logger_1.default.error('Health check failed:', error);
        res.status(500).json({
            status: 'error',
            message: 'Health check failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Error handling middleware
app.use(errorMiddleware_1.errorHandler);
// Create HTTP server
const server = (0, http_1.createServer)(app);
exports.server = server;
// Initialize WebSocket
(0, websocket_1.initWebSocket)(server);
// Start server
const startServer = async () => {
    try {
        // Connect to MongoDB
        await (0, database_1.connectDB)();
        // Initialize Redis (optional)
        await (0, redis_1.initRedis)();
        // Start HTTP server
        server.listen(PORT, () => {
            logger_1.default.info(`Server running on port ${PORT}`);
        });
    }
    catch (error) {
        logger_1.default.error('Failed to start server:', error);
        process.exit(1);
    }
};
// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger_1.default.error('Unhandled Rejection:', err);
    process.exit(1);
});
// Start server if not in Vercel environment
if (process.env.NODE_ENV !== 'production') {
    startServer();
}
