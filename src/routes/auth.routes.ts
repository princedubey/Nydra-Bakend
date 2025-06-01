import { Router } from "express"
import { register, login, getProfile } from "../controllers/auth.controller"
import { validateRequest, registerSchema, loginSchema } from "../middlewares/validation.middleware"
import { authenticateUser } from "../middlewares/auth.middleware"
import { asyncHandler } from "../utils/asyncHandler"

const router = Router()

router.post("/register", validateRequest(registerSchema), asyncHandler(register))
router.post("/login", validateRequest(loginSchema), asyncHandler(login))
router.get("/profile", authenticateUser, asyncHandler(getProfile))

// Named export
export const authRoutes = router

// Default export
export default router
