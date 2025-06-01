import { IUser } from '../models/User';
import { IDevice } from '../models/Device';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      device?: IDevice;
    }
  }
} 