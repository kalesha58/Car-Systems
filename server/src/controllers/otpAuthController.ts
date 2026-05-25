import { Response, NextFunction } from 'express';
import { sendOtp, verifyOtp, completePhoneSignup } from '../services/otpAuthService';
import { ICompletePhoneSignupRequest } from '../types/otpAuth';
import { IRegistrationAuthRequest } from '../middleware/registrationTokenMiddleware';
import { logger } from '../utils/logger';

export const sendOtpController = async (
  req: IRegistrationAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { phone } = req.body;
    logger.info(`Send OTP request for phone ending ${String(phone).slice(-4)}`);
    const result = await sendOtp(phone);
    res.status(200).json({
      success: true,
      Response: result,
    });
  } catch (error) {
    logger.error('Send OTP controller error:', error);
    next(error);
  }
};

export const verifyOtpController = async (
  req: IRegistrationAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { phone, otp } = req.body;
    const result = await verifyOtp(phone, otp);

    if (result.isNewUser) {
      res.status(200).json({
        success: true,
        isNewUser: true,
        phone: result.phone,
        registrationToken: result.registrationToken,
      });
      return;
    }

    res.status(200).json({
      success: true,
      isNewUser: false,
      Response: result.Response,
      token: result.token,
      requiresPolicyAcceptance: result.requiresPolicyAcceptance,
      currentTermsVersion: result.currentTermsVersion,
      currentPrivacyVersion: result.currentPrivacyVersion,
    });
  } catch (error) {
    logger.error('Verify OTP controller error:', error);
    next(error);
  }
};

export const completePhoneSignupController = async (
  req: IRegistrationAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const data: ICompletePhoneSignupRequest = req.body;

    const result = await completePhoneSignup(token, data);

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error('Complete phone signup controller error:', error);
    next(error);
  }
};
