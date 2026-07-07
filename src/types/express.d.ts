import { Role } from '../common/constants/roles.js';

// Augment Express' Request so `req.user` is typed once auth middleware sets it.
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
      };
    }
  }
}

export {};
