"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const deviceController_1 = require("../controllers/deviceController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const router = express_1.default.Router();
// All routes require authentication
router.use(authMiddleware_1.authenticate);
// POST /api/devices/register - Register a new device
router.post('/register', (0, validationMiddleware_1.validateRequest)([
    { field: 'name', rules: ['required'] },
    { field: 'deviceType', rules: ['required', 'in:mobile,desktop,tablet,other'] },
    { field: 'platform', rules: ['required'] },
]), deviceController_1.registerDevice);
// GET /api/devices - Get all devices for a user
router.get('/', deviceController_1.getDevices);
// PATCH /api/devices/:id/status - Update device status
router.patch('/:id/status', (0, validationMiddleware_1.validateRequest)([
    { field: 'isOnline', rules: ['required', 'boolean'] },
]), deviceController_1.updateDeviceStatus);
// DELETE /api/devices/:id - Delete a device
router.delete('/:id', deviceController_1.deleteDevice);
exports.default = router;
