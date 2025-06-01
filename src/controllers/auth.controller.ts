import type { Request, Response } from "express"
import jwt from "jsonwebtoken"
import { User } from "../models/User.model"
import { logger } from "../utils/logger"
import { createError } from "../middlewares/errorHandler"

export const register = async (req: Request, res: Response) => {
  try {
    const { email, username, password } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    })

    if (existingUser) {
      throw createError("User with this email or username already exists", 409)
    }

    // Create new user
    const user = new User({ email, username, password })
    await user.save()

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || "fallback-secret", { expiresIn: "7d" })

    logger.info(`New user registered: ${user.email}`)

    res.status(201).json({
      message: "User registered successfully",
      user,
      token,
    })
  } catch (error) {
    throw error
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    // Find user
    const user = await User.findOne({ email })
    if (!user || !user.isActive) {
      throw createError("Invalid credentials", 401)
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      throw createError("Invalid credentials", 401)
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || "fallback-secret", { expiresIn: "7d" })

    logger.info(`User logged in: ${user.email}`)

    res.json({
      message: "Login successful",
      user,
      token,
    })
  } catch (error) {
    throw error
  }
}

export const getProfile = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user._id)
    res.json({ user })
  } catch (error) {
    throw error
  }
}

// Default export
const authController = { register, login, getProfile }
export default authController
