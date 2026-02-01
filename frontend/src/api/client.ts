import axios, { type InternalAxiosRequestConfig } from "axios";
import { getGlobalAuthActions } from "../context/authActions";

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
})

// Extend the config type to include _retry flag
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

// Response interceptor - handles 401 errors and token refresh
apiClient.interceptors.response.use(
    (response) => response, // Success - pass through
    async (error) => {
        const originalRequest = error.config as CustomAxiosRequestConfig;

        // If 401 and we haven't retried yet, and it's not the refresh endpoint itself
        if (
            error.response?.status === 401 && 
            !originalRequest._retry &&
            !originalRequest.url?.includes('/refresh')
        ) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');

                if (!refreshToken) {
                    // No refresh token - trigger logout
                    const { logout } = getGlobalAuthActions();
                    if (logout) logout();
                    return Promise.reject(error);
                }

                // Call refresh endpoint
                const response = await axios.post(
                    `${apiClient.defaults.baseURL}/refresh`,
                    null,
                    { params: { refresh_token: refreshToken } }
                );

                const newAccessToken = response.data.access_token;

                // Update the access token in AuthContext
                const { setAccessToken } = getGlobalAuthActions();
                if (setAccessToken) {
                    setAccessToken(newAccessToken);
                }

                // Update the original request with new token
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                // Retry original request
                return apiClient(originalRequest);

            } catch (refreshError) {
                // Refresh failed - clear tokens & logout
                const { logout } = getGlobalAuthActions();
                if (logout) logout();
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient