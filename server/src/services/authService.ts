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
} from '../types/auth';
import { AppError, ConflictError, UnauthorizedError, NotFoundError } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import { sendPasswordResetCodeEmail, sendPasswordResetSuccessEmail } from '../utils/emailService';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '30d';
const GOOGLE_CLIENT_ID: string = process.env.GOOGLE_CLIENT_ID || '';

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
export const signup = async (data: ISignupRequest): Promise<IAuthResponse> => {
  const { name, email, phone, password, role } = data;

  // Validate role if provided (must be 'user' or 'dealer')
  const validRole = role && (role === 'user' || role === 'dealer') ? role : 'user';

  // Check if user already exists with email or phone
  const existingUser = await SignUp.findOne({
    $or: [{ email: email.toLowerCase() }, { phone }],
  });

  if (existingUser) {
    if (existingUser.email === email.toLowerCase()) {
      throw new ConflictError('User with this email already exists');
    }
    if (existingUser.phone === phone) {
      throw new ConflictError('User with this phone number already exists');
    }
  }

  // Create new user with the specified role (defaults to 'user' if not provided)
  const signUpUser = new SignUp({
    name: name.trim(),
    email: email.toLowerCase(),
    phone,
    password,
    role: [validRole], // Set role as array with single value
  });

  await signUpUser.save();

  logger.info(`New user signed up: ${signUpUser.email} with role: ${validRole}`);

  return ({
    Response: userToIUser(signUpUser),
  });
};

/**
 * Login user with phone/email and password
 */
export const login = async (data: ILoginRequest): Promise<ILoginResponse> => {
  const { email, password } = data;

  if (!email) {
    throw new AppError('Email is required', 400);
  }

  if (!password) {
    throw new AppError('Password is required', 400);
  }

  // Trim email to handle any whitespace issues
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedPassword = password.trim();

  logger.info(`Login attempt for email: ${trimmedEmail}, password length: ${trimmedPassword.length}`);

  // Find user by email and explicitly select password field (since it has select: false)
  const signUpUser = await SignUp.findOne({ email: trimmedEmail }).select('+password');

  if (!signUpUser) {
    logger.warn(`Login failed: User not found for email: ${trimmedEmail}`);
    throw new UnauthorizedError('Invalid credentials');
  }

  if (signUpUser.status !== 'active') {
    logger.warn(`Login blocked for inactive/suspended user: ${trimmedEmail}`);
    throw new UnauthorizedError('This account is not active');
  }

  // Compare provided password with hashed password
  const isPasswordValid = await bcrypt.compare(trimmedPassword, signUpUser.password);

  if (!isPasswordValid) {
    logger.warn(`Login failed: Invalid password for email: ${trimmedEmail}`);
    throw new UnauthorizedError('Invalid credentials');
  }

  logger.info(`User logged in: ${signUpUser.email}`);

  // Generate token
  const token = generateToken({
    userId: signUpUser.id,
    email: signUpUser.email,
    role: signUpUser.role,
    phone: signUpUser.phone,
  });

  // Note: Greeting notification is now sent after FCM token registration
  // This ensures the token is available before sending the notification

  return ({
    Response: userToIUser(signUpUser),
    token,
  });
};

/**
 * Forgot password - Generate reset code (OTP) and send email
 */
export const forgotPassword = async (data: IForgotPasswordRequest): Promise<{ success: boolean; message: string }> => {
  const { email } = data;

  if (!email) {
    throw new AppError('Email is required', 400);
  }

  // Find user by email and select resetPasswordCode and resetPasswordCodeExpires
  const user = await SignUp.findOne({ email: email.toLowerCase() }).select('+resetPasswordCode +resetPasswordCodeExpires');

  if (!user) {
    // Don't reveal if user exists or not for security
    logger.warn(`Password reset requested for non-existent email: ${email}`);
    return {
      success: true,
      message: 'If an account with that email exists, a password reset code has been sent.',
    };
  }

  // Generate 6-digit reset code
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  
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
    email: email.toLowerCase(),
    resetPasswordCode: hashedCode,
    resetPasswordCodeExpires: { $gt: new Date() },
  }).select('+resetPasswordCode +resetPasswordCodeExpires +password');

  if (!user) {
    throw new UnauthorizedError('Invalid or expired reset code');
  }

  // Update password
  user.password = password;
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

