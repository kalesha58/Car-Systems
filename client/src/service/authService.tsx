import axios from 'axios';
import { BASE_URL } from './config';
import { tokenStorage, clearBusinessRegistrationDraft } from '@state/storage';
import { useAuthStore } from '@state/authStore';
import { resetAndNavigate } from '@utils/NavigationUtils';
import { appAxios } from './apiInterceptors';

export const customerLogin = async (email: string, password: string) => {
  try {
    // Trim email and password to remove any whitespace that might cause authentication issues
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    
    const response = await appAxios.post('/auth/login', {
      email: trimmedEmail,
      password: trimmedPassword,
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
  role?: 'user' | 'dealer'
) => {
  try {
    // Trim all fields to remove any whitespace
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    
    const requestBody: {
      name: string;
      email: string;
      phone: string;
      password: string;
      role?: 'user' | 'dealer';
    } = {
      name: trimmedName,
      email: trimmedEmail,
      phone,
      password: trimmedPassword,
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

export const deliveryLogin = async(email: string, password: string)=>{
    try {
        // Trim email and password to remove any whitespace
        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();
        
        const response = await axios.post(`${BASE_URL}/delivery/login`, { 
            email: trimmedEmail, 
            password: trimmedPassword 
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
