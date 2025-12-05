import { Response, NextFunction } from 'express';
import { IAuthRequest } from './authMiddleware';
import { ForbiddenError } from '../utils/errorHandler';

/**
 * Admin authorization middleware
 * Verifies that the authenticated user has admin role
 */
export const adminMiddleware = (req: IAuthRequest, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    if (!req.user.role.includes('admin')) {
      throw new ForbiddenError('Admin access required');
    }

    next();
  } catch (error) {
    next(error);
  }
};

