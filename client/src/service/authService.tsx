import axios from 'axios';
import { BASE_URL } from './config';
import { tokenStorage } from '@state/storage';
import { useAuthStore } from '@state/authStore';
import { resetAndNavigate } from '@utils/NavigationUtils';
import { appAxios } from './apiInterceptors';

export const customerLogin = async (email: string, password: string) => {
  try {
    // Trim email and password to remove any whitespace that might cause authentication issues
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password: trimmedPassword,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if response is ok
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: `HTTP error! status: ${response.status}` };
        }
        
        const error: any = {
          response: {
            status: response.status,
            statusText: response.statusText,
            data: errorData,
          },
          message: errorData?.message || errorData?.Response?.ReturnMessage || `HTTP error! status: ${response.status}`,
        };
        throw error;
      }

      const data = await response.json();
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
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Handle AbortError (timeout)
      if (fetchError.name === 'AbortError') {
        const timeoutError: any = {
          response: undefined,
          message: 'Request timeout - please check your connection',
        };
        throw timeoutError;
      }
      
      // Re-throw if it's already formatted
      if (fetchError.response) {
        throw fetchError;
      }
      
      // Handle network errors
      const networkError: any = {
        response: undefined,
        message: fetchError.message || 'Network error - please check your connection',
      };
      throw networkError;
    }
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

export const customerSignup = async (email: string, phone: string, password: string) => {
  try {
    // Trim email and password to remove any whitespace
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    
    const response = await axios.post(`${BASE_URL}/auth/signup`, { 
      email: trimmedEmail, 
      phone, 
      password: trimmedPassword 
    });
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
        tokenStorage.clearAll()
        resetAndNavigate("CustomerLogin")
        throw error;
    }
}

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
