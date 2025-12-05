import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { SignUp } from '../models/SignUp';
import { IJwtPayload } from '../types/auth';
import { UnauthorizedError } from '../utils/errorHandler';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Multer file interface (matches multer.File structure)
// Supports both disk storage (path) and memory storage (buffer)
export interface IMulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string; // Optional for memory storage
  filename?: string; // Optional for memory storage
  path?: string; // Optional for memory storage
  buffer?: Buffer; // Present for memory storage
}

// Custom request properties
interface IAuthRequestProperties {
  user?: {
    userId: string;
    email: string;
    role: string[];
  };
  file?: IMulterFile;
  files?: IMulterFile[] | { [fieldname: string]: IMulterFile[] };
}

// Extend Request with custom properties using intersection type
export type IAuthRequest = Request & IAuthRequestProperties;

/**
 * JWT authentication middleware
 * Verifies token and attaches user info to request
 */
export const authMiddleware = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);

    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as IJwtPayload;

    // Check if user still exists
    const user = await SignUp.findById(decoded.userId);

    if (!user) {
      throw new UnauthorizedError('User no longer exists');
    }

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token expired'));
    } else {
      next(error);
    }
  }
};

