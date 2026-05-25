import { Request, Response, NextFunction } from 'express';
import { verifyRegistrationToken } from '../utils/authTokenUtils';
import { UnauthorizedError } from '../utils/errorHandler';

export interface IRegistrationAuthRequest extends Request {
  registrationPhone?: string;
}

/**
 * Verify Bearer registration token from OTP verify (new users only).
 */
export const registrationTokenMiddleware = (
  req: IRegistrationAuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      next(new UnauthorizedError('Registration token is required'));
      return;
    }

    const token = authHeader.slice(7).trim();
    const decoded = verifyRegistrationToken(token);
    req.registrationPhone = decoded.phone;
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired registration token'));
  }
};
