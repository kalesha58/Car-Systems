import crypto from 'crypto';
import { OtpSession } from '../models/OtpSession';
import { SignUp } from '../models/SignUp';
import { sendOtpViaMsg91, verifyOtpViaMsg91 } from './msg91OtpService';
import {
  generateAuthToken,
  generateRegistrationToken,
  userDocToIUser,
  verifyRegistrationToken,
} from '../utils/authTokenUtils';
import {
  AppError,
  ConflictError,
  UnauthorizedError,
} from '../utils/errorHandler';
import { logger } from '../utils/logger';
import {
  ICompletePhoneSignupRequest,
  ISendOtpResponse,
  IVerifyOtpResponse,
} from '../types/otpAuth';
import { ILoginResponse } from '../types/auth';

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);
const OTP_SEND_LIMIT = parseInt(process.env.OTP_SEND_LIMIT || '3', 10);
const OTP_SEND_WINDOW_MS =
  parseInt(process.env.OTP_SEND_WINDOW_MINUTES || '5', 10) * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS =
  parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS || '30', 10) * 1000;
const OTP_MAX_VERIFY_ATTEMPTS = parseInt(process.env.OTP_MAX_VERIFY_ATTEMPTS || '5', 10);
const MSG91_OTP_LENGTH = parseInt(process.env.MSG91_OTP_LENGTH || '6', 10);
const MSG91_COUNTRY_CODE = process.env.MSG91_COUNTRY_CODE || '91';
const CURRENT_TERMS_VERSION = process.env.CURRENT_TERMS_VERSION || '2026-05';
const CURRENT_PRIVACY_VERSION = process.env.CURRENT_PRIVACY_VERSION || '2026-05';
const REGISTRATION_VERIFY_WINDOW_MS = 15 * 60 * 1000;

const generateRandomPassword = (): string => crypto.randomBytes(16).toString('hex');

export const normalizePhone = (phone: string): string => {
  let digits = phone.replace(/[^0-9]/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  if (!/^[0-9]{10}$/.test(digits)) {
    throw new AppError('Phone number must be exactly 10 digits', 400);
  }
  return digits;
};

export const toMsg91Mobile = (phone10: string): string => `${MSG91_COUNTRY_CODE}${phone10}`;

export const phonePlaceholderEmail = (phone: string): string => `${phone}@phone.motonode.in`;

/**
 * Send OTP: rate limits per phone, MSG91 send, persist session.
 */
export const sendOtp = async (phoneInput: string): Promise<ISendOtpResponse> => {
  const phone = normalizePhone(phoneInput);
  const now = new Date();
  let session = await OtpSession.findOne({ phone });

  if (session) {
    const windowElapsed = now.getTime() - session.windowStartedAt.getTime();
    if (windowElapsed >= OTP_SEND_WINDOW_MS) {
      session.sendCount = 0;
      session.windowStartedAt = now;
    }

    if (session.sendCount >= OTP_SEND_LIMIT) {
      throw new AppError(
        'Too many OTP requests. Try again in 5 minutes.',
        429,
      );
    }

    const sinceLastSend = now.getTime() - session.lastSentAt.getTime();
    if (sinceLastSend < OTP_RESEND_COOLDOWN_MS) {
      const waitSec = Math.ceil((OTP_RESEND_COOLDOWN_MS - sinceLastSend) / 1000);
      throw new AppError(`Please wait ${waitSec} seconds before requesting another OTP`, 429);
    }
  }

  const mobile = toMsg91Mobile(phone);
  const { requestId } = await sendOtpViaMsg91(mobile);
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

  if (session) {
    session.requestId = requestId;
    session.expiresAt = expiresAt;
    session.lastSentAt = now;
    session.sendCount += 1;
    session.failedAttempts = 0;
    session.verifiedAt = undefined;
    await session.save();
  } else {
    await OtpSession.create({
      phone,
      requestId,
      expiresAt,
      failedAttempts: 0,
      sendCount: 1,
      windowStartedAt: now,
      lastSentAt: now,
    });
  }

  logger.info(`OTP sent for phone ending ${phone.slice(-4)}`);

  const otpLength =
    Number.isFinite(MSG91_OTP_LENGTH) && MSG91_OTP_LENGTH >= 4 && MSG91_OTP_LENGTH <= 8
      ? MSG91_OTP_LENGTH
      : 6;

  return {
    message: 'OTP sent',
    resendAfterSeconds: Math.ceil(OTP_RESEND_COOLDOWN_MS / 1000),
    otpExpiresInSeconds: OTP_EXPIRY_MINUTES * 60,
    otpLength,
  };
};

/**
 * Verify OTP with MSG91; login existing user or issue registration token.
 */
export const verifyOtp = async (
  phoneInput: string,
  otpInput: string,
): Promise<IVerifyOtpResponse> => {
  const phone = normalizePhone(phoneInput);
  const otp = otpInput.replace(/\s/g, '');
  if (!/^[0-9]{4,8}$/.test(otp)) {
    throw new AppError('Invalid OTP format', 400);
  }

  const session = await OtpSession.findOne({ phone });
  if (!session) {
    throw new UnauthorizedError('No OTP session found. Please request a new OTP.');
  }

  if (session.expiresAt < new Date()) {
    throw new UnauthorizedError('OTP has expired. Please request a new OTP.');
  }

  if (session.failedAttempts >= OTP_MAX_VERIFY_ATTEMPTS) {
    throw new AppError('Too many invalid attempts. Please request a new OTP.', 429);
  }

  try {
    await verifyOtpViaMsg91(toMsg91Mobile(phone), otp);
  } catch (error) {
    session.failedAttempts += 1;
    await session.save();
    if (error instanceof AppError && error.statusCode === 401) {
      throw error;
    }
    throw error;
  }

  session.verifiedAt = new Date();
  session.failedAttempts = 0;
  await session.save();

  const existingUser = await SignUp.findOne({ phone });

  if (existingUser) {
    if (existingUser.status !== 'active') {
      throw new UnauthorizedError('This account is not active');
    }

    if (!existingUser.phoneVerified) {
      existingUser.phoneVerified = true;
      await existingUser.save({ validateBeforeSave: false });
    }

    const requiresPolicyAcceptance =
      existingUser.termsVersion !== CURRENT_TERMS_VERSION ||
      existingUser.privacyVersion !== CURRENT_PRIVACY_VERSION;

    const token = generateAuthToken({
      userId: existingUser.id,
      email: existingUser.email,
      role: existingUser.role,
      phone: existingUser.phone,
    });

    await OtpSession.deleteOne({ phone });

    logger.info(`Phone OTP login for existing user: ${existingUser.phone}`);

    return {
      isNewUser: false,
      Response: userDocToIUser(existingUser),
      token,
      requiresPolicyAcceptance,
      currentTermsVersion: CURRENT_TERMS_VERSION,
      currentPrivacyVersion: CURRENT_PRIVACY_VERSION,
    };
  }

  const registrationToken = generateRegistrationToken(phone);

  return {
    isNewUser: true,
    phone,
    registrationToken,
  };
};

/**
 * Complete signup after OTP verify for new users.
 */
export const completePhoneSignup = async (
  registrationToken: string,
  data: ICompletePhoneSignupRequest,
): Promise<ILoginResponse> => {
  const { name, email, termsAccepted, privacyAccepted, termsVersion, privacyVersion } = data;

  if (!name?.trim()) {
    throw new AppError('Name is required', 400);
  }
  if (!termsAccepted || !privacyAccepted) {
    throw new AppError('You must accept the terms and privacy policy', 400);
  }
  if (!termsVersion?.trim() || !privacyVersion?.trim()) {
    throw new AppError('Terms and privacy versions are required', 400);
  }

  let decoded;
  try {
    decoded = verifyRegistrationToken(registrationToken);
  } catch {
    throw new UnauthorizedError('Invalid or expired registration session. Please verify OTP again.');
  }

  const phone = decoded.phone;
  const session = await OtpSession.findOne({ phone });

  if (!session?.verifiedAt) {
    throw new UnauthorizedError('Phone not verified. Please complete OTP verification first.');
  }

  const verifiedAge = Date.now() - session.verifiedAt.getTime();
  if (verifiedAge > REGISTRATION_VERIFY_WINDOW_MS) {
    throw new UnauthorizedError('Verification session expired. Please verify OTP again.');
  }

  const existingByPhone = await SignUp.findOne({ phone });
  if (existingByPhone) {
    throw new ConflictError('An account with this phone number already exists');
  }

  const normalizedEmail = email?.trim()
    ? email.trim().toLowerCase()
    : phonePlaceholderEmail(phone);

  if (email?.trim()) {
    const emailTaken = await SignUp.findOne({ email: normalizedEmail });
    if (emailTaken) {
      throw new ConflictError('User with this email already exists');
    }
  }

  const signUpUser = new SignUp({
    name: name.trim(),
    email: normalizedEmail,
    phone,
    password: generateRandomPassword(),
    role: ['user'],
    phoneVerified: true,
    authProvider: 'phone',
    termsAcceptedAt: termsAccepted ? new Date() : undefined,
    privacyAcceptedAt: privacyAccepted ? new Date() : undefined,
    termsVersion,
    privacyVersion,
  });

  await signUpUser.save();
  await OtpSession.deleteOne({ phone });

  logger.info(`New user registered via phone OTP: ${phone}`);

  const token = generateAuthToken({
    userId: signUpUser.id,
    email: signUpUser.email,
    role: signUpUser.role,
    phone: signUpUser.phone,
  });

  return {
    Response: userDocToIUser(signUpUser),
    token,
    requiresPolicyAcceptance: false,
    currentTermsVersion: CURRENT_TERMS_VERSION,
    currentPrivacyVersion: CURRENT_PRIVACY_VERSION,
  };
};
