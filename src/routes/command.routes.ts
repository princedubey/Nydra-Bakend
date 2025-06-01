import { Router } from "express"
import { sendCommand, getCommandStatus, respondToCommand, getCommands } from "../controllers/command.controller"
import { validateRequest, commandSchema } from "../middlewares/validation.middleware"
import { authenticateUser, authenticateDevice } from "../middlewares/auth.middleware"
import { asyncHandler } from "../utils/asyncHandler"

const router = Router()

router.post("/send", authenticateUser, authenticateDevice, validateRequest(commandSchema), asyncHandler(sendCommand))

router.get("/status/:id", authenticateUser, asyncHandler(getCommandStatus))

router.post("/respond/:id", authenticateDevice, asyncHandler(respondToCommand))

router.get("/", authenticateUser, asyncHandler(getCommands))

// Named export
export const commandRoutes = router

// Default export
export default router
