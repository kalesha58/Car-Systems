import axios from 'axios';
import { BASE_URL } from './config';
import { tokenStorage, clearBusinessRegistrationDraft } from '@state/storage';
import { useAuthStore } from '@state/authStore';
import { resetAndNavigate } from '@utils/NavigationUtils';
import { appAxios } from './apiInterceptors';
import {
  markPendingLoginGreeting,
  unregisterPushNotifications,
} from './pushNotificationService';

export const CURRENT_TERMS_VERSION = '2026-05';
export const CURRENT_PRIVACY_VERSION = '2026-05';

/** Clears FCM on the server (while JWT is valid), then clears auth store state. */
export const logoutSession = async (): Promise<void> => {
  await unregisterPushNotifications();
  useAuthStore.getState().logout();
};

export interface ILoginResult {
    requiresPolicyAcceptance?: boolean;
    currentTermsVersion?: string;
    currentPrivacyVersion?: string;
}

export const customerLogin = async (email: string, password: string): Promise<ILoginResult> => {
  try {
    // Send credentials exactly as entered by the user.
    const response = await appAxios.post('/auth/login', {
      email,
      password,
    });

      const data = response.data;
      console.log({
        response: data,
        responseData: response,
      });

      // Handle different response structures
      const responseData = data.success !== undefined ? data : data;
      const token = responseData.token;
      const Response = responseData.Response;

      if (!token) {
        throw {
          response: {
            status: response.status,
            data: { message: 'Token not found in response' },
          },
          message: 'Token not found in response',
        };
      }

      if (!Response) {
        throw {
          response: {
            status: response.status,
            data: { message: 'User data not found in response' },
          },
          message: 'User data not found in response',
        };
      }

      tokenStorage.set('accessToken', token);
      tokenStorage.set('refreshToken', token);
      const { setUser } = useAuthStore.getState();
      setUser(Response);
      markPendingLoginGreeting();
      return {
        requiresPolicyAcceptance: Boolean(responseData.requiresPolicyAcceptance),
        currentTermsVersion: responseData.currentTermsVersion,
        currentPrivacyVersion: responseData.currentPrivacyVersion,
      };
  } catch (error: any) {
    // Log error details for debugging
    console.error('Login error:', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });

    // Re-throw with proper error structure
    throw error;
  }
};

export const customerSignup = async (
  name: string,
  email: string,
  phone: string,
  password: string,
  role?: 'user' | 'dealer',
  termsVersion: string = CURRENT_TERMS_VERSION,
  privacyVersion: string = CURRENT_PRIVACY_VERSION,
) => {
  try {
    // Send all fields exactly as entered by the user.
    const requestBody: {
      name: string;
      email: string;
      phone: string;
      password: string;
      role?: 'user' | 'dealer';
      termsAccepted: boolean;
      privacyAccepted: boolean;
      termsVersion: string;
      privacyVersion: string;
    } = {
      name,
      email,
      phone,
      password,
      termsAccepted: true,
      privacyAccepted: true,
      termsVersion,
      privacyVersion,
    };

    // Only include role if provided (defaults to 'user' on backend)
    if (role) {
      requestBody.role = role;
    }
    
    const response = await axios.post(`${BASE_URL}/auth/signup`, requestBody);
    const { Response } = response.data;
    const { setUser } = useAuthStore.getState();
    setUser(Response);
  } catch (error) {
    throw error;
  }
};

export const acceptLatestPolicy = async (
  termsVersion: string = CURRENT_TERMS_VERSION,
  privacyVersion: string = CURRENT_PRIVACY_VERSION,
) => {
  await appAxios.post('/auth/policy-acceptance', {
    termsVersion,
    privacyVersion,
  });
};

export const deliveryLogin = async(email: string, password: string)=>{
    try {
        // Send credentials exactly as entered by the user.
        const response = await axios.post(`${BASE_URL}/delivery/login`, { 
            email, 
            password
        })
        const { accessToken,refreshToken,deliveryPartner}=response.data
        tokenStorage.set("accessToken", accessToken)
        tokenStorage.set("refreshToken", refreshToken)
        const {setUser}=useAuthStore.getState()
        setUser(deliveryPartner)
    } catch (error) {
        throw error;
    }
}

export const refresh_tokens = async () => {
    try {
        const refershToken = tokenStorage.getString('refreshToken')
        const response = await axios.post(`${BASE_URL}/refresh-token`, {
            refershToken
        })

        const new_access_token = response.data.accessToken
        const new_refresh_token = response.data.refreshToken


        tokenStorage.set('accessToken', new_access_token)
        tokenStorage.set('refreshToken', new_refresh_token)
        return new_access_token;
    } catch (error) {
        tokenStorage.clearAll();
        const currentUser = useAuthStore.getState().user;
        clearBusinessRegistrationDraft(currentUser?.id);
        const { logout } = useAuthStore.getState();
        logout();
        resetAndNavigate("CustomerLogin");
        throw error;
    }
}

export const requestPasswordReset = async (email: string): Promise<{ success: boolean; message?: string }> => {
    try {
        const trimmedEmail = email.trim();
        const response = await appAxios.post('/auth/forgot-password', {
            email: trimmedEmail,
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const resetPasswordWithCode = async (data: {
    email: string;
    code: string;
    password: string;
    confirmPassword: string;
}): Promise<{ success: boolean; message?: string }> => {
    try {
        const payload = {
            email: data.email.trim(),
            code: data.code.trim(),
            password: data.password,
            confirmPassword: data.confirmPassword,
        };
        const response = await appAxios.post('/auth/reset-password', payload);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export interface ISendOtpResult {
  message: string;
  resendAfterSeconds: number;
}

export interface IVerifyOtpResult {
  isNewUser: boolean;
  phone?: string;
  registrationToken?: string;
  loginResult?: ILoginResult;
}

const persistAuthSession = (token: string, user: object): ILoginResult => {
  tokenStorage.set('accessToken', token);
  tokenStorage.set('refreshToken', token);
  const { setUser } = useAuthStore.getState();
  setUser(user as Parameters<typeof setUser>[0]);
  markPendingLoginGreeting();
  return {};
};

export const sendPhoneOtp = async (phone: string): Promise<ISendOtpResult> => {
  const response = await appAxios.post('/auth/send-otp', { phone });
  const data = response.data;
  return data.Response || { message: 'OTP sent', resendAfterSeconds: 30 };
};

export const verifyPhoneOtp = async (phone: string, otp: string): Promise<IVerifyOtpResult> => {
  const response = await appAxios.post('/auth/verify-otp', { phone, otp });
  const data = response.data;

  if (data.isNewUser) {
    return {
      isNewUser: true,
      phone: data.phone,
      registrationToken: data.registrationToken,
    };
  }

  const token = data.token;
  const Response = data.Response;
  if (!token || !Response) {
    throw new Error('Invalid verify OTP response');
  }

  const loginResult: ILoginResult = {
    requiresPolicyAcceptance: Boolean(data.requiresPolicyAcceptance),
    currentTermsVersion: data.currentTermsVersion,
    currentPrivacyVersion: data.currentPrivacyVersion,
  };

  persistAuthSession(token, Response);

  return {
    isNewUser: false,
    loginResult,
  };
};

export const completePhoneSignup = async (
  registrationToken: string,
  payload: {
    name: string;
    email?: string;
    termsVersion?: string;
    privacyVersion?: string;
  },
): Promise<ILoginResult> => {
  const response = await appAxios.post(
    '/auth/complete-phone-signup',
    {
      name: payload.name,
      email: payload.email,
      termsAccepted: true,
      privacyAccepted: true,
      termsVersion: payload.termsVersion || CURRENT_TERMS_VERSION,
      privacyVersion: payload.privacyVersion || CURRENT_PRIVACY_VERSION,
    },
    {
      headers: {
        Authorization: `Bearer ${registrationToken}`,
      },
    },
  );

  const data = response.data;
  const token = data.token;
  const Response = data.Response;
  if (!token || !Response) {
    throw new Error('Invalid complete signup response');
  }

  persistAuthSession(token, Response);

  return {
    requiresPolicyAcceptance: Boolean(data.requiresPolicyAcceptance),
    currentTermsVersion: data.currentTermsVersion,
    currentPrivacyVersion: data.currentPrivacyVersion,
  };
};

export const refetchUser = async (setUser: any) => {
    try {
        const response = await appAxios.get(`/profile`);
        if (response.data.success && response.data.Response) {
            setUser(response.data.Response);
        } else {
            throw new Error('Invalid response format');
        }
    } catch (error) {
        tokenStorage.clearAll();
        const currentUser = useAuthStore.getState().user;
        clearBusinessRegistrationDraft(currentUser?.id);
        const { logout } = useAuthStore.getState();
        logout();
        throw error;
    }
};

export const updateUserLocation = async (data: any, setUser: any) => {
    try {
        await appAxios.patch(`/user`, data);
        refetchUser(setUser);
    } catch (error) {
        throw error;
    }
};
