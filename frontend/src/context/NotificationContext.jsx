import { createContext, useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import { toast } from 'react-toastify';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { token } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [upcomingMeetings, setUpcomingMeetings] = useState([]);
    const ws = useRef(null);
    const alertedMeetings = useRef(new Set());

    // Fetch initial notifications
    const fetchNotifications = async () => {
        if (!token) return;
        try {
            const API_URL = import.meta.env.VITE_API_URL ;
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
        
        // Fetch upcoming meetings for reminders
        const fetchMeetings = async () => {
            if (!token) return;
            try {
                const API_URL = import.meta.env.VITE_API_URL ;
                const res = await axios.get(`${API_URL}/api/meetings`, { headers: { 'x-auth-token': token } });
                if (res.data.success) {
                    setUpcomingMeetings(res.data.data.filter(m => m.status === 'accepted' && new Date(m.date) > new Date()));
                }
            } catch (err) {
                console.error('Failed to fetch meetings for reminders');
            }
        };
        fetchMeetings();
    }, [token]);

    // Meeting Reminder Poller
    useEffect(() => {
        if (upcomingMeetings.length === 0) return;

        const checkReminders = () => {
            const now = Date.now();
            upcomingMeetings.forEach(meeting => {
                const mtgTime = new Date(meeting.date).getTime();
                const diffMins = Math.round((mtgTime - now) / 60000);
                
                let reminderKey = null;
                let message = null;

                if (diffMins === 24 * 60) {
                    reminderKey = `${meeting._id}-24h`;
                    message = `Your meeting "${meeting.topic}" starts in 24 hours.`;
                } else if (diffMins === 60) {
                    reminderKey = `${meeting._id}-1h`;
                    message = `Your meeting "${meeting.topic}" starts in 1 hour.`;
                } else if (diffMins === 15) {
                    reminderKey = `${meeting._id}-15m`;
                    message = `Your meeting "${meeting.topic}" starts in 15 minutes!`;
                } else if (diffMins === 0) {
                    reminderKey = `${meeting._id}-0m`;
                    message = `Your meeting "${meeting.topic}" is starting now!`;
                }

                if (reminderKey && !alertedMeetings.current.has(reminderKey)) {
                    alertedMeetings.current.add(reminderKey);
                    toast.info(message, { autoClose: false });
                }
            });
        };

        const interval = setInterval(checkReminders, 60000); // Check every minute
        checkReminders(); // check immediately

        return () => clearInterval(interval);
    }, [upcomingMeetings]);

    useEffect(() => {
        if (!token) return;

        const WS_URL = (import.meta.env.VITE_API_URL ).replace(/^http/, 'ws');
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
            const API_URL = import.meta.env.VITE_API_URL ;
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
