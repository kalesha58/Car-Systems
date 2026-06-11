import { IUser } from './auth';

export interface ISendOtpRequest {
  phone: string;
}

export interface ISendOtpResponse {
  message: string;
  resendAfterSeconds: number;
  otpExpiresInSeconds: number;
  otpLength: number;
}

export interface IVerifyOtpRequest {
  phone: string;
  otp: string;
}

export interface IVerifyOtpExistingUserResponse {
  isNewUser: false;
  Response: IUser;
  token: string;
  requiresPolicyAcceptance?: boolean;
  currentTermsVersion?: string;
  currentPrivacyVersion?: string;
}

export interface IVerifyOtpNewUserResponse {
  isNewUser: true;
  phone: string;
  registrationToken: string;
}

export type IVerifyOtpResponse = IVerifyOtpExistingUserResponse | IVerifyOtpNewUserResponse;

export interface ICompletePhoneSignupRequest {
  name: string;
  email?: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  termsVersion: string;
  privacyVersion: string;
}

export interface IPhoneRegistrationJwtPayload {
  purpose: 'phone_registration';
  phone: string;
}
