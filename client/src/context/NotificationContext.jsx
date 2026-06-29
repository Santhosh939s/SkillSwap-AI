import { createContext, useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import { toast } from 'react-toastify';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { token } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const ws = useRef(null);

    // Fetch initial notifications
    const fetchNotifications = async () => {
        if (!token) return;
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const res = await axios.get(`${API_URL}/api/notifications`, {
                headers: { 'x-auth-token': token }
            });
            setNotifications(res.data);
        } catch (err) {
            console.error('Failed to fetch notifications');
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [token]);

    useEffect(() => {
        if (!token) return;

        const WS_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/^http/, 'ws');
        ws.current = new WebSocket(`${WS_URL}?token=${token}`);

        const handleMessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'notification') {
                setNotifications(prev => [data.payload, ...prev]);
                toast.info(data.payload.message);
            }
            if (data.type === 'chat') {
                if (window.location.pathname !== '/chat') {
                    toast.success(`New message received!`);
                }
            }
        };

        ws.current.addEventListener('message', handleMessage);

        return () => {
            if (ws.current) {
                ws.current.removeEventListener('message', handleMessage);
                ws.current.close();
            }
        };
    }, [token]);

    const markAsRead = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            await axios.put(`${API_URL}/api/notifications/read`, {}, {
                headers: { 'x-auth-token': token }
            });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (err) {
            console.error('Failed to mark read');
        }
    };

    return (
        <NotificationContext.Provider value={{ notifications, markAsRead, ws: ws.current }}>
            {children}
        </NotificationContext.Provider>
    );
};
