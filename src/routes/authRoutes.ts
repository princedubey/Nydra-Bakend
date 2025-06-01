import express from 'express';
import { register, login, getCurrentUser } from '../controllers/authController';
import { authenticate } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validationMiddleware';

const router = express.Router();

// POST /api/auth/register - Register a new user
router.post(
  '/register',
  validateRequest([
    { field: 'email', rules: ['required', 'email'] },
    { field: 'password', rules: ['required', 'min:6'] },
    { field: 'name', rules: ['required'] },
  ]),
  register
);

// POST /api/auth/login - Login user
router.post(
  '/login',
  validateRequest([
    { field: 'email', rules: ['required', 'email'] },
    { field: 'password', rules: ['required'] },
  ]),
  login
);

// GET /api/auth/me - Get current user
router.get('/me', authenticate, getCurrentUser);

export default router;