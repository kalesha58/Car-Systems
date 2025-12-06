import axios from 'axios'
import { BASE_URL } from './config'
import { tokenStorage } from '@state/storage'
import { useAuthStore } from '@state/authStore'
import { resetAndNavigate } from '@utils/NavigationUtils'
import { appAxios } from './apiInterceptors'

export const customerLogin = async (email: string, password: string) => {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, { email, password });
    const { token, Response } = response.data;
    tokenStorage.set('accessToken', token);
    tokenStorage.set('refreshToken', token);
    const { setUser } = useAuthStore.getState();
    setUser(Response);
  } catch (error) {
    throw error;
  }
};

export const customerSignup = async (email: string, phone: string, password: string) => {
  try {
    const response = await axios.post(`${BASE_URL}/auth/signup`, { email, phone, password });
    console.log('Signup API Response:', response);
    console.log('Signup API Response Data:', response.data);
    const { Response } = response.data;
    console.log('Signup User Data:', Response);
    const { setUser } = useAuthStore.getState();
    setUser(Response);
  } catch (error) {
    console.log('Signup API Error:', error);
    throw error;
  }
};

export const deliveryLogin = async(email: string, password: string)=>{
    try {
        const response = await axios.post(`${BASE_URL}/delivery/login`, { email, password })
        const { accessToken,refreshToken,deliveryPartner}=response.data
        tokenStorage.set("accessToken", accessToken)
        tokenStorage.set("refreshToken", refreshToken)
        const {setUser}=useAuthStore.getState()
        setUser(deliveryPartner)
    } catch (error) {
        console.log("Login Error", error)
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
        console.log("REFRESH TOKEN ERROR", error)
        tokenStorage.clearAll()
        resetAndNavigate("CustomerLogin")
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
        const response = await appAxios.patch(`/user`, data)
        refetchUser(setUser)
    } catch (error) {
        console.log("update User Location Error", error)
    }
}
