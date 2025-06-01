import type { Request, Response, NextFunction } from "express"
import Joi from "joi"

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body)

    if (error) {
      return res.status(400).json({
        error: "Validation error",
        details: error.details.map((detail) => detail.message),
      })
    }

    next()
  }
}

// Validation schemas
export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().min(3).max(30).required(),
  password: Joi.string().min(6).required(),
})

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
})

export const deviceRegistrationSchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string().valid("PC", "Mobile", "Tablet").required(),
  platform: Joi.string().valid("Windows", "macOS", "Linux", "iOS", "Android").required(),
  capabilities: Joi.array().items(Joi.string()).default([]),
  metadata: Joi.object().default({}),
})

export const commandSchema = Joi.object({
  targetDeviceId: Joi.string().required(),
  type: Joi.string().valid("voice", "text", "automation").required(),
  command: Joi.string().required(),
  parameters: Joi.object().optional(),
  priority: Joi.string().valid("low", "medium", "high", "urgent").default("medium"),
  scheduledAt: Joi.date().optional(),
})

// Default export
const validationMiddleware = {
  validateRequest,
  registerSchema,
  loginSchema,
  deviceRegistrationSchema,
  commandSchema,
}
export default validationMiddleware
