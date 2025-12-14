import { UserRole } from '../models/SignUp';

export interface IUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole[];
  profileImage?: string;
}

export interface ICredentials {
  user: IUser;
  token: string;
}

export interface ISignupRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IAuthResponse {
  Response: IUser;
}
export interface ILoginResponse {
  Response: IUser;
  token: string;
}
export interface IJwtPayload {
  userId: string;
  email: string;
  role: UserRole[];
  phone: string;
}

export interface IForgotPasswordRequest {
  email: string;
}

export interface IResetPasswordRequest {
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
}

export interface IGoogleAuthRequest {
  idToken: string;
  phone: string;
  isRegistration: boolean;
}



