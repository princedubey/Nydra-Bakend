import 'dotenv/config';
import express, { Application } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { connectDB } from './config/database';
import { initRedis } from './config/redis';
import { initWebSocket } from './websocket';
import { errorHandler } from './middlewares/errorMiddleware';
import { requestLogger } from './middlewares/loggerMiddleware';
import authRoutes from './routes/authRoutes';
import deviceRoutes from './routes/deviceRoutes';
import commandRoutes from './routes/commandRoutes';
import logger from './utils/logger';

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/commands', commandRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
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
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Error handling middleware
app.use(errorHandler);

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket
initWebSocket(server);

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Initialize Redis (optional)
    await initRedis();
    
    // Start HTTP server
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Export for Vercel
export { app, server };

// Start server if not in Vercel environment
if (process.env.NODE_ENV !== 'production') {
  startServer();
}