import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errorHandler';

/**
 * Validate POST /auth/send-otp body.
 */
export const validateSendOtp = (req: Request, res: Response, next: NextFunction): void => {
  const { phone } = req.body;
  if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
    next(new ValidationError('Phone number is required'));
    return;
  }
  next();
};

/**
 * Validate POST /auth/verify-otp body.
 */
export const validateVerifyOtp = (req: Request, res: Response, next: NextFunction): void => {
  const { phone, otp } = req.body;
  if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
    next(new ValidationError('Phone number is required'));
    return;
  }
  if (!otp || typeof otp !== 'string' || otp.trim().length === 0) {
    next(new ValidationError('OTP is required'));
    return;
  }
  next();
};

/**
 * Validate POST /auth/complete-phone-signup body.
 */
export const validateCompletePhoneSignup = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { name, termsAccepted, privacyAccepted, termsVersion, privacyVersion } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    next(new ValidationError('Name is required'));
    return;
  }
  if (!termsAccepted || !privacyAccepted) {
    next(new ValidationError('Terms and privacy policy must be accepted'));
    return;
  }
  if (!termsVersion || !privacyVersion) {
    next(new ValidationError('Terms and privacy versions are required'));
    return;
  }
  if (req.body.email && typeof req.body.email !== 'string') {
    next(new ValidationError('Email must be a string'));
    return;
  }
  next();
};
