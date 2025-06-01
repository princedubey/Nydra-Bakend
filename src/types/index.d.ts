// Custom type definitions
declare namespace Express {
  interface Request {
    user?: any;
    device?: any;
  }
}

interface WebSocketData {
  userId: string;
  deviceId?: string;
  deviceType?: string;
}