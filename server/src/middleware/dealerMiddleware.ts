import { Response, NextFunction } from 'express';
import { IAuthRequest } from './authMiddleware';
import { ForbiddenError, NotFoundError } from '../utils/errorHandler';
import { BusinessRegistration } from '../models/BusinessRegistration';

/**
 * Dealer authorization middleware
 * Verifies that the authenticated user has dealer role and business registration
 * Uses BusinessRegistration as the source of truth for dealer operations.
 * Inventory and other dealer write APIs require status === 'approved' (admin approves in admin panel).
 */
export const dealerMiddleware = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    if (!req.user.role.includes('dealer')) {
      throw new ForbiddenError('Dealer access required');
    }

    // Find business registration by userId
    const businessRegistration = await BusinessRegistration.findOne({ 
      userId: req.user.userId 
    });

    if (!businessRegistration) {
      throw new NotFoundError('Business registration not found. Please complete business registration.');
    }

    // Check if business registration is approved
    if (businessRegistration.status !== 'approved') {
      throw new ForbiddenError(`Business registration is ${businessRegistration.status}. Please wait for admin approval.`);
    }

    // Attach businessRegistrationId as dealerId to request
    // This is used for products, services, orders, etc.
    (req as any).dealerId = (businessRegistration._id as any).toString();

    next();
  } catch (error) {
    next(error);
  }
};

