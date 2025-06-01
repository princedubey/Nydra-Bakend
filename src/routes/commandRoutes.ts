import express from 'express';
import {
  sendCommand,
  getCommandStatus,
  updateCommandResponse,
  getCommandHistory,
  cancelCommand,
} from '../controllers/commandController';
import { authenticate, authenticateDevice } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validationMiddleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// POST /api/commands/send - Send a command to a device
router.post(
  '/send',
  authenticateDevice,
  validateRequest([
    { field: 'targetDeviceId', rules: ['required'] },
    { field: 'commandType', rules: ['required'] },
    { field: 'command', rules: ['required'] },
  ]),
  sendCommand
);

// GET /api/commands/status/:id - Get command status
router.get('/status/:id', getCommandStatus);

// POST /api/commands/respond/:id - Update command response
router.post(
  '/respond/:id',
  authenticateDevice,
  validateRequest([
    { field: 'status', rules: ['required', 'in:executing,completed,failed'] },
  ]),
  updateCommandResponse
);

// GET /api/commands/history - Get command history
router.get('/history', getCommandHistory);

// POST /api/commands/cancel/:id - Cancel a command
router.post('/cancel/:id', cancelCommand);

export default router;