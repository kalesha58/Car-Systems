export interface ILoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface IAuthResponse {
  token: string;
  user: IUser;
}

export interface IUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string | string[];
  roles?: string[];
}

