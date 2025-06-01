import mongoose, { type Document, Schema } from "mongoose"

export interface ICommand extends Document {
  _id: string
  userId: string
  sourceDeviceId: string
  targetDeviceId: string
  type: "voice" | "text" | "automation"
  command: string
  parameters?: any
  status: "pending" | "processing" | "completed" | "failed" | "cancelled"
  priority: "low" | "medium" | "high" | "urgent"
  result?: any
  error?: string
  executionTime?: number
  scheduledAt?: Date
  startedAt?: Date
  completedAt?: Date
  metadata: {
    aiProcessed?: boolean
    originalInput?: string
    [key: string]: any
  }
  createdAt: Date
  updatedAt: Date
}

const CommandSchema = new Schema<ICommand>(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    sourceDeviceId: {
      type: String,
      required: true,
      ref: "Device",
    },
    targetDeviceId: {
      type: String,
      required: true,
      ref: "Device",
    },
    type: {
      type: String,
      required: true,
      enum: ["voice", "text", "automation"],
    },
    command: {
      type: String,
      required: true,
    },
    parameters: {
      type: Schema.Types.Mixed,
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "processing", "completed", "failed", "cancelled"],
      default: "pending",
    },
    priority: {
      type: String,
      required: true,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    result: {
      type: Schema.Types.Mixed,
    },
    error: {
      type: String,
    },
    executionTime: {
      type: Number,
    },
    scheduledAt: {
      type: Date,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for efficient queries
CommandSchema.index({ userId: 1, status: 1 })
CommandSchema.index({ targetDeviceId: 1, status: 1 })
CommandSchema.index({ createdAt: -1 })

export const Command = mongoose.model<ICommand>("Command", CommandSchema)
export default Command
