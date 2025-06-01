"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const router = express_1.default.Router();
// POST /api/auth/register - Register a new user
router.post('/register', (0, validationMiddleware_1.validateRequest)([
    { field: 'email', rules: ['required', 'email'] },
    { field: 'password', rules: ['required', 'min:6'] },
    { field: 'name', rules: ['required'] },
]), authController_1.register);
// POST /api/auth/login - Login user
router.post('/login', (0, validationMiddleware_1.validateRequest)([
    { field: 'email', rules: ['required', 'email'] },
    { field: 'password', rules: ['required'] },
]), authController_1.login);
// GET /api/auth/me - Get current user
router.get('/me', authMiddleware_1.authenticate, authController_1.getCurrentUser);
exports.default = router;
