import { Router } from "express"
import { registerDevice, getMyDevices, updateDeviceStatus, pingDevice } from "../controllers/device.controller"
import { validateRequest, deviceRegistrationSchema } from "../middlewares/validation.middleware"
import { authenticateUser, authenticateDevice } from "../middlewares/auth.middleware"
import { asyncHandler } from "../utils/asyncHandler"

const router = Router()

router.post(
  "/register-device",
  authenticateUser,
  validateRequest(deviceRegistrationSchema),
  asyncHandler(registerDevice),
)

router.get("/my-devices", authenticateUser, asyncHandler(getMyDevices))

router.patch("/:id/status", authenticateUser, asyncHandler(updateDeviceStatus))

router.post("/ping", authenticateDevice, asyncHandler(pingDevice))

// Named export
export const deviceRoutes = router

// Default export
export default router
