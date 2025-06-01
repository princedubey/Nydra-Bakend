import { Request } from 'express';
import { IUser } from '../models/User';
import { IDevice } from '../models/Device';

// Extend Express namespace
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      device?: IDevice;
    }
  }
}

// Type for authenticated requests
export type AuthenticatedRequest = Request & {
  user: IUser;
};

// Type for device authenticated requests
export type DeviceAuthenticatedRequest = Request & {
  user: IUser;
  device: IDevice;
}; 