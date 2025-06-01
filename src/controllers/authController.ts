import { Request, Response, NextFunction } from 'express';
import jwt, { Secret } from 'jsonwebtoken';
import User from '../models/User';
import { catchAsync } from '../utils/catchAsync';
import { ApiError } from '../utils/apiError';

// Generate JWT Token
const generateToken = (id: string): string => {
  const secret: Secret = process.env.JWT_SECRET || 'secret';
  // 7 days in seconds
  const expiresIn = 7 * 24 * 60 * 60;
  return jwt.sign(
    { id },
    secret,
    { expiresIn }
  );
};

// Register user
export const register = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password, name } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(new ApiError('User already exists', 400));
    }

    // Create new user
    const user = await User.create({
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
  }
);

// Login user
export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return next(new ApiError('Please provide email and password', 400));
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return next(new ApiError('Invalid credentials', 401));
    }

    // Check if password is correct
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return next(new ApiError('Invalid credentials', 401));
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
  }
);

// Get current user
export const getCurrentUser = catchAsync(
  async (req: Request, res: Response) => {
    const user = await User.findById(req.user.id).select('-password');

    res.status(200).json({
      success: true,
      user,
    });
  }
);