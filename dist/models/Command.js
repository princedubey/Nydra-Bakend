"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const CommandSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    sourceDeviceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Device',
        required: true,
    },
    targetDeviceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Device',
        required: true,
    },
    commandType: {
        type: String,
        required: true,
    },
    command: {
        type: String,
        required: true,
    },
    parameters: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
    status: {
        type: String,
        enum: ['pending', 'queued', 'executing', 'completed', 'failed', 'cancelled'],
        default: 'pending',
    },
    result: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
    priority: {
        type: Number,
        default: 0,
    },
    executeAt: {
        type: Date,
        default: Date.now,
    },
    startedAt: Date,
    completedAt: Date,
    error: String,
}, { timestamps: true });
// Indexes for common queries
CommandSchema.index({ userId: 1, status: 1 });
CommandSchema.index({ targetDeviceId: 1, status: 1 });
CommandSchema.index({ sourceDeviceId: 1, createdAt: -1 });
exports.default = mongoose_1.default.model('Command', CommandSchema);
