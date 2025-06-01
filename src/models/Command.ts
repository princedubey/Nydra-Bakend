import mongoose, { Document, Schema } from 'mongoose';

export type CommandStatus = 
  | 'pending' 
  | 'queued' 
  | 'executing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export interface ICommand extends Document {
  userId: mongoose.Types.ObjectId;
  sourceDeviceId: mongoose.Types.ObjectId;
  targetDeviceId: mongoose.Types.ObjectId;
  commandType: string;
  command: string;
  parameters: Record<string, any>;
  status: CommandStatus;
  result: Record<string, any>;
  priority: number;
  executeAt: Date;
  startedAt: Date;
  completedAt: Date;
  error: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommandSchema = new Schema<ICommand>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sourceDeviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Device',
      required: true,
    },
    targetDeviceId: {
      type: Schema.Types.ObjectId,
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
      type: Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['pending', 'queued', 'executing', 'completed', 'failed', 'cancelled'],
      default: 'pending',
    },
    result: {
      type: Schema.Types.Mixed,
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
  },
  { timestamps: true }
);

// Indexes for common queries
CommandSchema.index({ userId: 1, status: 1 });
CommandSchema.index({ targetDeviceId: 1, status: 1 });
CommandSchema.index({ sourceDeviceId: 1, createdAt: -1 });

export default mongoose.model<ICommand>('Command', CommandSchema);