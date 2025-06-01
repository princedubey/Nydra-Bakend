import mongoose, { type Document, Schema } from "mongoose"

export interface IDevice extends Document {
  _id: string
  userId: string
  name: string
  type: "PC" | "Mobile" | "Tablet"
  platform: "Windows" | "macOS" | "Linux" | "iOS" | "Android"
  deviceId: string
  isOnline: boolean
  lastPing?: Date
  capabilities: string[]
  metadata: {
    ip?: string
    userAgent?: string
    version?: string
    [key: string]: any
  }
  createdAt: Date
  updatedAt: Date
}

const DeviceSchema = new Schema<IDevice>(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["PC", "Mobile", "Tablet"],
    },
    platform: {
      type: String,
      required: true,
      enum: ["Windows", "macOS", "Linux", "iOS", "Android"],
    },
    deviceId: {
      type: String,
      required: true,
      unique: true,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastPing: {
      type: Date,
    },
    capabilities: [
      {
        type: String,
      },
    ],
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
)

// Index for efficient queries
DeviceSchema.index({ userId: 1, isOnline: 1 })
DeviceSchema.index({ deviceId: 1 })

export const Device = mongoose.model<IDevice>("Device", DeviceSchema)
