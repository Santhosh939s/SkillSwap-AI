import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            if (token) {
                localStorage.setItem('token', token);
                axios.defaults.headers.common['x-auth-token'] = token;
                try {
                    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                    const res = await axios.get(`${API_URL}/api/profile`);
                    setUser(res.data);
                } catch (err) {
                    console.error('Failed to load user profile in context', err);
                }
            } else {
                localStorage.removeItem('token');
                delete axios.defaults.headers.common['x-auth-token'];
                setUser(null);
            }
            setLoading(false);
        };
        fetchUser();
    }, [token]);

    const login = async (email, password) => {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const res = await axios.post(`${API_URL}/login`, { email, password });
        setToken(res.data.token);
    };

    const logout = () => {
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ token, user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
