"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const commandController_1 = require("../controllers/commandController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const router = express_1.default.Router();
// All routes require authentication
router.use(authMiddleware_1.authenticate);
// POST /api/commands/send - Send a command to a device
router.post('/send', authMiddleware_1.authenticateDevice, (0, validationMiddleware_1.validateRequest)([
    { field: 'targetDeviceId', rules: ['required'] },
    { field: 'commandType', rules: ['required'] },
    { field: 'command', rules: ['required'] },
]), commandController_1.sendCommand);
// GET /api/commands/status/:id - Get command status
router.get('/status/:id', commandController_1.getCommandStatus);
// POST /api/commands/respond/:id - Update command response
router.post('/respond/:id', authMiddleware_1.authenticateDevice, (0, validationMiddleware_1.validateRequest)([
    { field: 'status', rules: ['required', 'in:executing,completed,failed'] },
]), commandController_1.updateCommandResponse);
// GET /api/commands/history - Get command history
router.get('/history', commandController_1.getCommandHistory);
// POST /api/commands/cancel/:id - Cancel a command
router.post('/cancel/:id', commandController_1.cancelCommand);
exports.default = router;
