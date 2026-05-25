import jwt from 'jsonwebtoken';
import { IUser, IJwtPayload } from '../types/auth';
import { ISignUpDocument } from '../models/SignUp';
import { IPhoneRegistrationJwtPayload } from '../types/otpAuth';

export const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
export const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '30d';
export const OTP_REGISTRATION_TOKEN_EXPIRES_IN: string =
  process.env.OTP_REGISTRATION_TOKEN_EXPIRES_IN || '15m';

/**
 * Issue a standard auth JWT for an authenticated user session.
 */
export const generateAuthToken = (payload: IJwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
};

/**
 * Short-lived token after OTP verify for users who still need profile completion.
 */
export const generateRegistrationToken = (phone: string): string => {
  const payload: IPhoneRegistrationJwtPayload = {
    purpose: 'phone_registration',
    phone,
  };
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: OTP_REGISTRATION_TOKEN_EXPIRES_IN,
  } as jwt.SignOptions);
};

export const verifyRegistrationToken = (token: string): IPhoneRegistrationJwtPayload => {
  const decoded = jwt.verify(token, JWT_SECRET) as IPhoneRegistrationJwtPayload;
  if (decoded.purpose !== 'phone_registration' || !decoded.phone) {
    throw new Error('Invalid registration token');
  }
  return decoded;
};

/**
 * Map Mongoose SignUp document to API user shape.
 */
export const userDocToIUser = (userDoc: ISignUpDocument): IUser => {
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
