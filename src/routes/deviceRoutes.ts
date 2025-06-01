import express from 'express';
import {
  registerDevice,
  getDevices,
  updateDeviceStatus,
  deleteDevice,
} from '../controllers/deviceController';
import { authenticate } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validationMiddleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// POST /api/devices/register - Register a new device
router.post(
  '/register',
  validateRequest([
    { field: 'name', rules: ['required'] },
    { field: 'deviceType', rules: ['required', 'in:mobile,desktop,tablet,other'] },
    { field: 'platform', rules: ['required'] },
  ]),
  registerDevice
);

// GET /api/devices - Get all devices for a user
router.get('/', getDevices);

// PATCH /api/devices/:id/status - Update device status
router.patch(
  '/:id/status',
  validateRequest([
    { field: 'isOnline', rules: ['required', 'boolean'] },
  ]),
  updateDeviceStatus
);

// DELETE /api/devices/:id - Delete a device
router.delete('/:id', deleteDevice);

export default router;