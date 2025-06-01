import mongoose, { Document, Schema } from 'mongoose';

export interface IDevice extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  deviceType: 'mobile' | 'desktop' | 'tablet' | 'other';
  deviceId: string;
  platform: string;
  lastActive: Date;
  isOnline: boolean;
  token: string;
  capabilities: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceSchema = new Schema<IDevice>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    deviceType: {
      type: String,
      enum: ['mobile', 'desktop', 'tablet', 'other'],
      required: true,
    },
    deviceId: {
      type: String,
      required: true,
      unique: true,
    },
    platform: {
      type: String,
      required: true,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    token: {
      type: String,
      required: true,
    },
    capabilities: {
      type: [String],
      default: [],
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Compound index for user and device
DeviceSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

export default mongoose.model<IDevice>('Device', DeviceSchema);