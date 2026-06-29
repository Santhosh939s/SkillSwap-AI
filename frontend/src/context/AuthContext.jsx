import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

// Global Axios Configuration
axios.defaults.withCredentials = true; // VERY IMPORTANT for HTTP-Only Cookies

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    // Setup Axios Interceptor for seamless token refresh
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;
                // If the error is 401 (Unauthorized) and we haven't already retried
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;
                    try {
                        // Attempt to refresh the token via HTTP-Only cookie
                        const res = await axios.post(`${API_URL}/refresh`);
                        const newToken = res.data.token;
                        
                        // Update state and retry
                        setToken(newToken);
                        localStorage.setItem('token', newToken);
                        axios.defaults.headers.common['x-auth-token'] = newToken;
                        originalRequest.headers['x-auth-token'] = newToken;
                        
                        return axios(originalRequest);
                    } catch (refreshError) {
                        // If refresh fails (e.g., refresh token expired), log out completely
                        console.error('Refresh token failed:', refreshError);
                        logout();
                        return Promise.reject(refreshError);
                    }
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, [API_URL]);

    useEffect(() => {
        const fetchUser = async () => {
            if (token) {
                localStorage.setItem('token', token);
                axios.defaults.headers.common['x-auth-token'] = token;
                try {
                    const res = await axios.get(`${API_URL}/api/profile`);
                    setUser(res.data);
                } catch (err) {
                    console.error('Failed to load user profile in context', err);
                    // 401s will be caught by the interceptor now!
                }
            } else {
                localStorage.removeItem('token');
                delete axios.defaults.headers.common['x-auth-token'];
                setUser(null);
            }
            setLoading(false);
        };
        fetchUser();
    }, [token, API_URL]);

    const login = async (email, password) => {
        const res = await axios.post(`${API_URL}/login`, { email, password });
        setToken(res.data.token);
    };

    const logout = async () => {
        try {
            await axios.post(`${API_URL}/logout`); // Clear HTTP-Only cookie on server
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            setToken(null);
            localStorage.removeItem('token');
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ token, user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
