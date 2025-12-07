import { Response, NextFunction } from 'express';
import { IAuthRequest } from './authMiddleware';
import { SignUp } from '../models/SignUp';
import { BusinessRegistration } from '../models/BusinessRegistration';
import { NotFoundError, ForbiddenError } from '../utils/errorHandler';

/**
 * Validate dealer role only middleware (without business registration check)
 * Use this for routes that CREATE business registration
 * Verifies that the userId in route params has 'dealer' role in their role array
 */
export const validateDealerRoleOnlyMiddleware = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      throw new NotFoundError('User ID is required');
    }

    const user = await SignUp.findById(userId);

    if (!user) {
      throw new NotFoundError(`User not found: ${userId}`);
    }

    if (!user.role.includes('dealer')) {
      throw new ForbiddenError('User does not have dealer role');
    }

    // Attach validated user to request
    (req as any).validatedDealerUser = user;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate dealer userId middleware
 * Verifies that the userId in route params has 'dealer' role in their role array
 * and has completed business registration (same validation as dealerMiddleware)
 */
export const validateDealerUserIdMiddleware = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      throw new NotFoundError('User ID is required');
    }

    const user = await SignUp.findById(userId);

    if (!user) {
      throw new NotFoundError(`User not found: ${userId}`);
    }

    if (!user.role.includes('dealer')) {
      throw new ForbiddenError('User does not have dealer role');
    }

    // Find business registration by userId (same validation as dealerMiddleware)
    const businessRegistration = await BusinessRegistration.findOne({ 
      userId 
    });

    if (!businessRegistration) {
      throw new NotFoundError('Business registration not found. Please complete business registration.');
    }

    // Attach validated user and business registration to request for potential use in controllers
    (req as any).validatedDealerUser = user;
    (req as any).validatedBusinessRegistration = businessRegistration;

    next();
  } catch (error) {
    next(error);
  }
};

