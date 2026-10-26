import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { SignUp, ISignUpDocument } from '../models/SignUp';
import {
  ISignupRequest,
  ILoginRequest,
  IAuthResponse,
  IUser,
  IJwtPayload,
  ILoginResponse,
  IForgotPasswordRequest,
  IResetPasswordRequest,
  IGoogleAuthRequest,
  IPolicyAcceptanceRequest,
  IEmailVerificationRequired,
} from '../types/auth';
import { AppError, ConflictError, UnauthorizedError } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import {
  sendEmailVerificationOtp,
  sendPasswordResetCodeEmail,
  sendPasswordResetSuccessEmail,
} from '../utils/resendEmailService';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '30d';
const GOOGLE_CLIENT_ID: string = process.env.GOOGLE_CLIENT_ID || '';
const CURRENT_TERMS_VERSION: string = process.env.CURRENT_TERMS_VERSION || '2026-05';
const CURRENT_PRIVACY_VERSION: string = process.env.CURRENT_PRIVACY_VERSION || '2026-05';
const EMAIL_OTP_LENGTH = 6;
const EMAIL_OTP_EXPIRY_SECONDS = 10 * 60;
const EMAIL_OTP_RESEND_COOLDOWN_SECONDS = 30;
const EMAIL_OTP_MAX_ATTEMPTS = 5;
const EMAIL_OTP_SELECT = '+emailOtpHash +emailOtpExpires +emailOtpAttempts +emailOtpLastSentAt';

/**
 * Generate JWT token for user
 */
const generateToken = (payload: IJwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
};

/**
 * Convert user document to IUser interface
 */
const userToIUser = (userDoc: ISignUpDocument): IUser => {
  return {
    id: userDoc.id,
    name: userDoc.name,
    email: userDoc.email,
    phone: userDoc.phone,
    role: userDoc.role,
    profileImage: userDoc.profileImage,
    privacySettings: userDoc.privacySettings || {
      isPrivate: false,
      hidePhone: false,
      hideEmail: false,
      hideVehicleNumber: false,
    },
  };
};

/**
 * Signup a new user
 */
export const signup = async (
  data: ISignupRequest,
): Promise<IAuthResponse & IEmailVerificationRequired> => {
  const { name, email, phone, password, role, termsAccepted, privacyAccepted, termsVersion, privacyVersion } = data;
  const normalizedEmail = email.trim().toLowerCase();

  // Validate role if provided (must be 'user' or 'dealer')
  const validRole = role && (role === 'user' || role === 'dealer') ? role : 'user';

  // Check if user already exists with email or phone
  const existingUser = await SignUp.findOne({
    $or: [{ email: normalizedEmail }, { phone }],
  });

  if (existingUser) {
    if (existingUser.email === normalizedEmail) {
      throw new ConflictError('User with this email already exists');
    }
    if (existingUser.phone === phone) {
      throw new ConflictError('User with this phone number already exists');
    }
  }

  // Create new user with the specified role (defaults to 'user' if not provided)
  const signUpUser = new SignUp({
    name: name.trim(),
    email: normalizedEmail,
    phone,
    password,
    role: [validRole], // Set role as array with single value
    termsAcceptedAt: termsAccepted ? new Date() : undefined,
    privacyAcceptedAt: privacyAccepted ? new Date() : undefined,
    termsVersion,
    privacyVersion,
    emailVerified: false,
  });

  await signUpUser.save();

  logger.info(`New user signed up: ${signUpUser.email} with role: ${validRole}`);

  // Don't fail signup if the email can't be sent; the user can resend from the OTP screen.
  try {
    await issueEmailOtp(signUpUser);
  } catch (error) {
    logger.error(`Failed to send signup OTP to ${signUpUser.email}:`, error);
  }

  return ({
    Response: userToIUser(signUpUser),
    ...emailVerificationPayload(signUpUser.email),
  });
};

const hashEmailOtp = (otp: string): string => crypto.createHash('sha256').update(otp).digest('hex');

const emailVerificationPayload = (email: string): IEmailVerificationRequired => ({
  emailVerificationRequired: true,
  email,
  otpLength: EMAIL_OTP_LENGTH,
  otpExpiresInSeconds: EMAIL_OTP_EXPIRY_SECONDS,
  resendAfterSeconds: EMAIL_OTP_RESEND_COOLDOWN_SECONDS,
});

/**
 * Generate, store (hashed) and email a new verification OTP
 */
const issueEmailOtp = async (user: ISignUpDocument): Promise<void> => {
  const otp = crypto.randomInt(0, 10 ** EMAIL_OTP_LENGTH).toString().padStart(EMAIL_OTP_LENGTH, '0');

  user.emailOtpHash = hashEmailOtp(otp);
  user.emailOtpExpires = new Date(Date.now() + EMAIL_OTP_EXPIRY_SECONDS * 1000);
  user.emailOtpAttempts = 0;
  user.emailOtpLastSentAt = new Date();
  await user.save();

  await sendEmailVerificationOtp(user.email, user.name, otp, EMAIL_OTP_EXPIRY_SECONDS / 60);
};

const isEmailOtpCooldownActive = (user: ISignUpDocument): boolean =>
  Boolean(user.emailOtpLastSentAt) &&
  Date.now() - user.emailOtpLastSentAt!.getTime() < EMAIL_OTP_RESEND_COOLDOWN_SECONDS * 1000;

const buildLoginResponse = (signUpUser: ISignUpDocument): ILoginResponse => {
  const token = generateToken({
    userId: signUpUser.id,
    email: signUpUser.email,
    role: signUpUser.role,
    phone: signUpUser.phone,
  });

  return {
    Response: userToIUser(signUpUser),
    token,
    requiresPolicyAcceptance:
      signUpUser.termsVersion !== CURRENT_TERMS_VERSION ||
      signUpUser.privacyVersion !== CURRENT_PRIVACY_VERSION,
    currentTermsVersion: CURRENT_TERMS_VERSION,
    currentPrivacyVersion: CURRENT_PRIVACY_VERSION,
  };
};

/**
 * Resend the signup verification OTP (respects cooldown)
 */
export const resendEmailOtp = async (email: string): Promise<IEmailVerificationRequired> => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await SignUp.findOne({ email: normalizedEmail }).select(EMAIL_OTP_SELECT);

  if (!user || user.emailVerified !== false) {
    throw new AppError('No pending email verification for this account', 400);
  }

  if (isEmailOtpCooldownActive(user)) {
    throw new AppError('Please wait before requesting a new code', 429);
  }

  await issueEmailOtp(user);

  return emailVerificationPayload(user.email);
};

/**
 * Verify the signup OTP, mark email verified and sign the user in
 */
export const verifyEmailOtp = async (email: string, otp: string): Promise<ILoginResponse> => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await SignUp.findOne({ email: normalizedEmail }).select(EMAIL_OTP_SELECT);

  if (!user || user.emailVerified !== false) {
    throw new AppError('No pending email verification for this account', 400);
  }

  if (!user.emailOtpHash || !user.emailOtpExpires || user.emailOtpExpires.getTime() < Date.now()) {
    throw new AppError('Code has expired. Please request a new one.', 400);
  }

  if ((user.emailOtpAttempts ?? 0) >= EMAIL_OTP_MAX_ATTEMPTS) {
    throw new AppError('Too many incorrect attempts. Please request a new code.', 429);
  }

  const expected = Buffer.from(user.emailOtpHash, 'hex');
  const actual = Buffer.from(hashEmailOtp(otp.trim()), 'hex');
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    user.emailOtpAttempts = (user.emailOtpAttempts ?? 0) + 1;
    await user.save();
    throw new AppError('Invalid verification code', 400);
  }

  user.emailVerified = true;
  user.emailOtpHash = undefined;
  user.emailOtpExpires = undefined;
  user.emailOtpAttempts = undefined;
  user.emailOtpLastSentAt = undefined;
  await user.save();

  logger.info(`Email verified for: ${user.email}`);

  return buildLoginResponse(user);
};

/**
 * Login user with phone/email and password
 */
export const login = async (
  data: ILoginRequest,
): Promise<ILoginResponse | (IAuthResponse & IEmailVerificationRequired)> => {
  const { email, password } = data;

  if (!email) {
    throw new AppError('Email is required', 400);
  }

  if (!password) {
    throw new AppError('Password is required', 400);
  }

  // Normalize email; keep password as-is because spaces are valid characters in passwords.
  const normalizedEmail = email.trim().toLowerCase();
  const rawEmailLowercase = email.toLowerCase();

  logger.info(`Login attempt for email: ${normalizedEmail}, password length: ${password.length}`);

  // Find user by email and explicitly select password field (since it has select: false)
  const emailCandidates = rawEmailLowercase === normalizedEmail
    ? [normalizedEmail]
    : [normalizedEmail, rawEmailLowercase];
  const signUpUser = await SignUp.findOne({ email: { $in: emailCandidates } }).select('+password');

  if (!signUpUser) {
    logger.warn(`Login failed: User not found for email: ${normalizedEmail}`);
    throw new UnauthorizedError('Invalid credentials');
  }

  if (signUpUser.status !== 'active') {
    logger.warn(`Login blocked for inactive/suspended user: ${normalizedEmail}`);
    throw new UnauthorizedError('This account is not active');
  }

  // Compare provided password with hashed password
  const isPasswordValid = await bcrypt.compare(password, signUpUser.password);

  if (!isPasswordValid) {
    logger.warn(`Login failed: Invalid password for email: ${normalizedEmail}`);
    throw new UnauthorizedError('Invalid credentials');
  }

  // Email signups must verify their OTP before they get a session.
  if (signUpUser.emailVerified === false) {
    const pendingUser = await SignUp.findById(signUpUser.id).select(EMAIL_OTP_SELECT);
    if (pendingUser && !isEmailOtpCooldownActive(pendingUser)) {
      try {
        await issueEmailOtp(pendingUser);
      } catch (error) {
        logger.error(`Failed to send login OTP to ${signUpUser.email}:`, error);
      }
    }
    logger.info(`Login pending email verification: ${signUpUser.email}`);
    return {
      Response: userToIUser(signUpUser),
      ...emailVerificationPayload(signUpUser.email),
    };
  }

  logger.info(`User logged in: ${signUpUser.email}`);

  // Note: Greeting notification is now sent after FCM token registration
  // This ensures the token is available before sending the notification
  return buildLoginResponse(signUpUser);
};

export const acceptPolicy = async (userId: string, data: IPolicyAcceptanceRequest): Promise<IAuthResponse> => {
  const { termsVersion, privacyVersion } = data;

  if (!termsVersion?.trim() || !privacyVersion?.trim()) {
    throw new AppError('Both terms and privacy versions are required', 400);
  }

  const user = await SignUp.findById(userId);
  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  user.termsVersion = termsVersion.trim();
  user.privacyVersion = privacyVersion.trim();
  user.termsAcceptedAt = new Date();
  user.privacyAcceptedAt = new Date();
  await user.save();

  return {
    Response: userToIUser(user),
  };
};

/**
 * Forgot password - Generate reset code (OTP) and send email
 */
export const forgotPassword = async (data: IForgotPasswordRequest): Promise<{ success: boolean; message: string }> => {
  const { email } = data;
  const normalizedEmail = email.trim().toLowerCase();

  if (!email) {
    throw new AppError('Email is required', 400);
  }

  // Find user by email and select resetPasswordCode and resetPasswordCodeExpires
  const user = await SignUp.findOne({ email: normalizedEmail }).select('+resetPasswordCode +resetPasswordCodeExpires');

  if (!user) {
    // Don't reveal if user exists or not for security
    logger.warn(`Password reset requested for non-existent email: ${normalizedEmail}`);
    return {
      success: true,
      message: 'If an account with that email exists, a password reset code has been sent.',
    };
  }

  // Generate 6-digit reset code
  const resetCode = crypto.randomInt(100000, 1000000).toString();
  
  // Hash the code before storing (for security)
  const hashedCode = crypto.createHash('sha256').update(resetCode).digest('hex');

  // Set code expiration (10 minutes from now)
  const resetPasswordCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Save code to user
  user.resetPasswordCode = hashedCode;
  user.resetPasswordCodeExpires = resetPasswordCodeExpires;
  await user.save({ validateBeforeSave: false });

  try {
    // Send password reset code email
    await sendPasswordResetCodeEmail(user.email, resetCode);

    logger.info(`Password reset code sent to: ${user.email}`);

    return {
      success: true,
      message: 'If an account with that email exists, a password reset code has been sent.',
    };
  } catch (error) {
    // If email fails, clear the code
    user.resetPasswordCode = undefined;
    user.resetPasswordCodeExpires = undefined;
    await user.save({ validateBeforeSave: false });

    logger.error('Error sending password reset code email:', error);
    throw new AppError('Error sending email. Please try again later.', 500);
  }
};

/**
 * Reset password using code (OTP)
 */
export const resetPassword = async (data: IResetPasswordRequest): Promise<{ success: boolean; message: string }> => {
  const { email, code, password, confirmPassword } = data;
  const normalizedEmail = email.trim().toLowerCase();

  if (!email) {
    throw new AppError('Email is required', 400);
  }

  if (!code) {
    throw new AppError('Reset code is required', 400);
  }

  if (!password || !confirmPassword) {
    throw new AppError('Password and confirm password are required', 400);
  }

  if (password !== confirmPassword) {
    throw new AppError('Passwords do not match', 400);
  }

  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters long', 400);
  }

  // Hash the code to compare with stored code
  const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

  // Find user with valid code and not expired
  const user = await SignUp.findOne({
    email: normalizedEmail,
    resetPasswordCode: hashedCode,
    resetPasswordCodeExpires: { $gt: new Date() },
  }).select('+resetPasswordCode +resetPasswordCodeExpires +password');

  if (!user) {
    throw new UnauthorizedError('Invalid or expired reset code');
  }

  // Update password
  user.password = password;
  // Receiving the reset code proves the user owns this email.
  if (user.emailVerified === false) {
    user.emailVerified = true;
  }
  user.resetPasswordCode = undefined;
  user.resetPasswordCodeExpires = undefined;
  await user.save();

  try {
    // Send success email
    await sendPasswordResetSuccessEmail(user.email);
  } catch (error) {
    // Log error but don't fail the reset if email fails
    logger.error('Error sending password reset success email:', error);
  }

  logger.info(`Password reset successful for user: ${user.email}`);

  return {
    success: true,
    message: 'Password has been reset successfully',
  };
};

/**
 * Verify Google ID token and extract user info
 */
const verifyGoogleToken = async (idToken: string): Promise<{ email: string; name: string; googleId: string; picture?: string }> => {
  try {
    if (!GOOGLE_CLIENT_ID) {
      throw new AppError('Google OAuth not configured', 500);
    }

    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new UnauthorizedError('Invalid Google token');
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      picture: payload.picture,
    };
  } catch (error) {
    logger.error('Google token verification error:', error);
    if (error instanceof UnauthorizedError || error instanceof AppError) {
      throw error;
    }
    throw new UnauthorizedError('Invalid Google token');
  }
};

/**
 * Generate secure random password
 */
const generateRandomPassword = (): string => {
  return crypto.randomBytes(16).toString('hex');
};

/**
 * Google OAuth authentication - handles both registration and login
 */
export const googleAuth = async (data: IGoogleAuthRequest): Promise<ILoginResponse> => {
  const { idToken, phone, isRegistration } = data;

  if (!idToken) {
    throw new AppError('Google ID token is required', 400);
  }

  // Verify Google token
  const googleUser = await verifyGoogleToken(idToken);

  if (!googleUser.email) {
    throw new AppError('Email not provided by Google', 400);
  }

  if (isRegistration) {
    // Registration flow
    if (!phone) {
      throw new AppError('Phone number is required for registration', 400);
    }

    // Validate phone format
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!/^[0-9]{10}$/.test(cleanPhone)) {
      throw new AppError('Phone number must be exactly 10 digits', 400);
    }

    // Check if user already exists
    const existingUser = await SignUp.findOne({
      $or: [
        { email: googleUser.email.toLowerCase() },
        { phone: cleanPhone },
        { googleId: googleUser.googleId },
      ],
    });

    if (existingUser) {
      if (existingUser.email === googleUser.email.toLowerCase()) {
        throw new ConflictError('User with this email already exists');
      }
      if (existingUser.phone === cleanPhone) {
        throw new ConflictError('User with this phone number already exists');
      }
      if (existingUser.googleId === googleUser.googleId) {
        throw new ConflictError('User with this Google account already exists');
      }
    }

    // Generate random secure password
    const randomPassword = generateRandomPassword();

    // Create new user
    const signUpUser = new SignUp({
      name: googleUser.name,
      email: googleUser.email.toLowerCase(),
      phone: cleanPhone,
      password: randomPassword,
      googleId: googleUser.googleId,
      role: ['user'],
      profileImage: googleUser.picture,
    });

    await signUpUser.save();

    logger.info(`New user registered via Google: ${signUpUser.email}`);

    // Generate token
    const token = generateToken({
      userId: signUpUser.id,
      email: signUpUser.email,
      role: signUpUser.role,
      phone: signUpUser.phone,
    });

    return {
      Response: userToIUser(signUpUser),
      token,
    };
  } else {
    // Login flow
    const user = await SignUp.findOne({
      $or: [
        { email: googleUser.email.toLowerCase() },
        { googleId: googleUser.googleId },
      ],
    });

    if (!user) {
      throw new UnauthorizedError('Account not found. Please register first.');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedError('This account is not active');
    }

    // Update googleId if missing (for users who registered with email/password first)
    if (!user.googleId) {
      user.googleId = googleUser.googleId;
      if (googleUser.picture && !user.profileImage) {
        user.profileImage = googleUser.picture;
      }
      await user.save();
    }

    logger.info(`Google login for existing user: ${user.email}`);

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      phone: user.phone,
    });

    return {
      Response: userToIUser(user),
      token,
    };
  }
};

/**
 * Refresh access token using refresh token
 */
export const refreshToken = async (refreshTokenString: string): Promise<{ accessToken: string; refreshToken: string }> => {
  try {
    if (!refreshTokenString) {
      throw new AppError('Refresh token is required', 400);
    }

    // Verify the refresh token
    const decoded = jwt.verify(refreshTokenString, JWT_SECRET) as IJwtPayload;

    // Check if user still exists
    const user = await SignUp.findById(decoded.userId);

    if (!user) {
      throw new UnauthorizedError('User no longer exists');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedError('This account is not active');
    }

    // Generate new tokens with the same payload
    const newToken = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      phone: user.phone,
    });

    logger.info(`Token refreshed for user: ${user.email}`);

    // Return both accessToken and refreshToken (using same token for now)
    // In a production system, you might want separate refresh tokens with longer expiry
    return {
      accessToken: newToken,
      refreshToken: newToken,
    };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
    throw error;
  }
};

