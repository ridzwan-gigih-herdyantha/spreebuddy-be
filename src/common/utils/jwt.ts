import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { Role } from '../constants/roles.js';

export interface JwtPayload {
  id: string;
  email: string;
  role: Role;
}

export function signToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.jwtSecret, options);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}
