import { Request, Response, NextFunction } from 'express';
import { signup, login, forgotPassword, resetPassword, googleAuth } from '../services/authService';
import { ISignupRequest, ILoginRequest, IForgotPasswordRequest, IResetPasswordRequest, IGoogleAuthRequest } from '../types/auth';
import { logger } from '../utils/logger';

/**
 * Signup controller
 */
export const signupController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const signupData: ISignupRequest = req.body;

    logger.info(`Signup attempt for: ${signupData.email}`);

    const result = await signup(signupData);

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error('Signup controller error:', error);
    next(error);
  }
};

/**
 * Login controller
 */
export const loginController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const loginData: ILoginRequest = req.body;

    logger.info(`Login attempt for: ${loginData.email}`);

    const result = await login(loginData);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error('Login controller error:', error);
    next(error);
  }
};

/**
 * Forgot password controller
 */
export const forgotPasswordController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const forgotPasswordData: IForgotPasswordRequest = req.body;

    logger.info(`Forgot password request for: ${forgotPasswordData.email}`);

    const result = await forgotPassword(forgotPasswordData);

    res.status(200).json(result);
  } catch (error) {
    logger.error('Forgot password controller error:', error);
    next(error);
  }
};

/**
 * Reset password controller
 */
export const resetPasswordController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const resetPasswordData: IResetPasswordRequest = req.body;

    logger.info('Reset password request');

    const result = await resetPassword(resetPasswordData);

    res.status(200).json(result);
  } catch (error) {
    logger.error('Reset password controller error:', error);
    next(error);
  }
};

/**
 * Google OAuth controller
 */
export const googleAuthController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const googleData: IGoogleAuthRequest = req.body;

    logger.info('Google authentication attempt');

    const result = await googleAuth(googleData);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error('Google auth controller error:', error);
    next(error);
  }
};



