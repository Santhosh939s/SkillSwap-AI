import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
    const { user, token } = useContext(AuthContext);
    const { notifications } = useContext(NotificationContext);
    const [stats, setStats] = useState(null);
    const [meetings, setMeetings] = useState([]);
    
    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!token) return;
            try {
                const API_URL = import.meta.env.VITE_API_URL;
                // Fetch stats (using progress endpoint for XP)
                const res = await axios.get(`${API_URL}/api/progress`, {
                    headers: { 'x-auth-token': token }
                });
                setStats(res.data);

                // Fetch meetings
                const mtgRes = await axios.get(`${API_URL}/api/meetings`, {
                    headers: { 'x-auth-token': token }
                });
                setMeetings(mtgRes.data.data.slice(0, 3)); // Get top 3 upcoming
            } catch (err) {
                console.error('Failed to fetch dashboard data', err);
            }
        };
        fetchDashboardData();
    }, [token]);

    const mockChartData = [
        { name: 'Mon', xp: 400 },
        { name: 'Tue', xp: 300 },
        { name: 'Wed', xp: 550 },
        { name: 'Thu', xp: 480 },
        { name: 'Fri', xp: 700 },
        { name: 'Sat', xp: 900 },
        { name: 'Sun', xp: 1200 },
    ];

    return (
        <div className="min-h-screen bg-background text-text-primary p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Welcome Banner */}
                <div className="bg-card border border-border rounded-2xl p-8 relative overflow-hidden shadow-lg">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3"></div>
                    <h1 className="text-3xl font-bold text-text-primary">
                        Welcome back, <span className="text-primary">{user?.username}</span> 👋
                    </h1>
                    <p className="text-text-secondary mt-2 text-lg">Here's what's happening with your learning journey today.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left Column - Stats & Activity */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-card border border-border rounded-2xl p-6 hover:bg-card-hover transition-colors shadow-sm">
                                <div className="text-sm font-medium text-text-muted mb-1">Total XP</div>
                                <div className="text-3xl font-bold text-accent">{stats?.totalXP || 0}</div>
                                <div className="mt-2 text-xs text-success flex items-center gap-1">
                                    <span>↑ 12% this week</span>
                                </div>
                            </div>
                            <div className="bg-card border border-border rounded-2xl p-6 hover:bg-card-hover transition-colors shadow-sm">
                                <div className="text-sm font-medium text-text-muted mb-1">Current Level</div>
                                <div className="text-3xl font-bold text-primary">{stats?.level || 1}</div>
                                <div className="mt-2 text-xs text-text-secondary flex items-center gap-1">
                                    <span>{stats?.totalXP ? (stats.level * 1000 - stats.totalXP) : 1000} XP to next</span>
                                </div>
                            </div>
                            <div className="bg-card border border-border rounded-2xl p-6 hover:bg-card-hover transition-colors shadow-sm">
                                <div className="text-sm font-medium text-text-muted mb-1">Learning Streak</div>
                                <div className="text-3xl font-bold text-warning">{stats?.streak || 0} 🔥</div>
                                <div className="mt-2 text-xs text-text-secondary flex items-center gap-1">
                                    <span>Keep it up!</span>
                                </div>
                            </div>
                        </div>

                        {/* Chart Section */}
                        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                                Activity Overview
                            </h2>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={mockChartData}>
                                        <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
                                            itemStyle={{ color: '#F8FAFC' }}
                                        />
                                        <Line type="monotone" dataKey="xp" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4, fill: '#06B6D4', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#06B6D4' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                    </div>

                    {/* Right Column - Sidebars */}
                    <div className="space-y-6">
                        
                        {/* Upcoming Meetings */}
                        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col h-full max-h-[400px]">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-semibold">Upcoming Sessions</h2>
                                <Link to="/schedule" className="text-sm text-primary hover:text-primary-hover font-medium">View All</Link>
                            </div>
                            
                            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                                {meetings.length > 0 ? meetings.map(meeting => (
                                    <div key={meeting._id} className="p-4 rounded-xl bg-background-secondary border border-border hover:border-primary/50 transition-colors">
                                        <div className="font-semibold text-text-primary text-sm line-clamp-1">{meeting.topic}</div>
                                        <div className="text-xs text-text-secondary mt-2 flex items-center gap-2">
                                            <span>📅 {new Date(meeting.date).toLocaleDateString()}</span>
                                            <span>⏰ {new Date(meeting.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center text-text-muted space-y-3 py-8">
                                        <div className="w-12 h-12 rounded-full bg-border flex items-center justify-center text-xl">📅</div>
                                        <p className="text-sm">No upcoming sessions</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
