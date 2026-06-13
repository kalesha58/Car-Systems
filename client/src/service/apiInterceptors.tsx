import axios from "axios";
import { BASE_URL } from "./config";
import { refresh_tokens } from "./authService";
import { tokenStorage } from "@state/storage";
import { useAuthStore } from "@state/authStore";


const DEFAULT_REQUEST_TIMEOUT_MS = 60000;

export const appAxios = axios.create({
    baseURL: BASE_URL,
    timeout: DEFAULT_REQUEST_TIMEOUT_MS,
})

appAxios.interceptors.request.use(async config => {
    const accessToken = tokenStorage.getString('accessToken');
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    // Add ngrok-skip-browser-warning header for ngrok URLs
    config.headers['ngrok-skip-browser-warning'] = 'true';

    // React Native: axios must not set Content-Type on FormData (breaks multipart on Android)
    const data = config.data;
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    if (isFormData && config.headers) {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
    }

    return config;
});

appAxios.interceptors.response.use(
    response=>response,
    async error=>{
        if(error.response && error.response.status === 401){
            const refreshToken = tokenStorage.getString('refreshToken');
            const user = useAuthStore.getState().user;

            if (!refreshToken || !user) {
                return Promise.reject(error);
            }
            
            try {
                const newAccessToken = await refresh_tokens()
                if (newAccessToken) {
                    error.config.headers.Authorization = `Bearer ${newAccessToken}`
                    return axios(error.config)
                }
            } catch (error) {
                console.log("ERROR REFRESHING TOKEN")
                // Reject 401 errors if token refresh fails
                return Promise.reject(error)
            }
        }

        // Log non-401 errors for debugging
        if (error.response && error.response.status !== 401) {
            const errorMessage = error.response.data?.message || error.response.data?.Response?.ReturnMessage || 'something went wrong'
            const url = error.config?.url || 'unknown';
            const method = error.config?.method?.toUpperCase() || 'unknown';
            console.log('API Error:', {
                message: errorMessage,
                status: error.response.status,
                method: method,
                endpoint: url,
                fullUrl: error.config?.baseURL ? `${error.config.baseURL}${url}` : url
            })
        }

        // Reject errors so they can be properly handled by calling code
        return Promise.reject(error)
    }
)