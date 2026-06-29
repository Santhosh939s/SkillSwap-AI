import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const { token, user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('overview');
    const [metrics, setMetrics] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && user.role !== 'admin' && user.role !== 'superadmin') {
            toast.error("Unauthorized access.");
            navigate('/');
            return;
        }

        const fetchData = async () => {
            if (!token) return;
            setLoading(true);
            try {
                const API_URL = import.meta.env.VITE_API_URL ;
                
                if (activeTab === 'overview' || activeTab === 'analytics' || activeTab === 'system') {
                    if (!metrics) {
                        const res = await axios.get(`${API_URL}/api/admin/metrics`, { headers: { 'x-auth-token': token } });
                        if (res.data.success) setMetrics(res.data.data);
                    }
                }
                
                if (activeTab === 'moderation') {
                    const res = await axios.get(`${API_URL}/api/admin/users`, { headers: { 'x-auth-token': token } });
                    if (res.data.success) setUsers(res.data.data.users);
                }
            } catch (err) {
                console.error(err);
                toast.error("Failed to fetch admin data.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token, activeTab, user, navigate, metrics]);

    const handleRoleChange = async (userId, newRole) => {
        try {
            const API_URL = import.meta.env.VITE_API_URL ;
            const res = await axios.put(`${API_URL}/api/admin/users/${userId}`, { role: newRole }, { headers: { 'x-auth-token': token } });
            if (res.data.success) {
                toast.success('Role updated');
                setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update role');
        }
    };

    const handleStatusChange = async (userId, newStatus) => {
        try {
            const API_URL = import.meta.env.VITE_API_URL ;
            const res = await axios.put(`${API_URL}/api/admin/users/${userId}`, { status: newStatus }, { headers: { 'x-auth-token': token } });
            if (res.data.success) {
                toast.success('Status updated');
                setUsers(users.map(u => u._id === userId ? { ...u, status: newStatus } : u));
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update status');
        }
    };

    if (loading && !metrics && users.length === 0) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-background">
            {/* Sidebar */}
            <div className="w-64 bg-background-secondary border-r border-border fixed h-full flex flex-col">
                <div className="p-6 border-b border-border">
                    <h2 className="text-xl font-bold text-text-primary">Admin Panel</h2>
                    <p className="text-sm text-text-muted capitalize">{user?.role} Access</p>
                </div>
                <div className="flex-1 py-4">
                    <button onClick={() => setActiveTab('overview')} className={`w-full text-left px-6 py-4 font-medium transition-colors ${activeTab === 'overview' ? 'bg-primary/10 text-primary border-r-4 border-primary' : 'text-text-secondary hover:bg-card-hover'}`}>Dashboard Overview</button>
                    <button onClick={() => setActiveTab('analytics')} className={`w-full text-left px-6 py-4 font-medium transition-colors ${activeTab === 'analytics' ? 'bg-primary/10 text-primary border-r-4 border-primary' : 'text-text-secondary hover:bg-card-hover'}`}>Analytics Charts</button>
                    <button onClick={() => setActiveTab('moderation')} className={`w-full text-left px-6 py-4 font-medium transition-colors ${activeTab === 'moderation' ? 'bg-primary/10 text-primary border-r-4 border-primary' : 'text-text-secondary hover:bg-card-hover'}`}>User Moderation</button>
                    <button onClick={() => setActiveTab('system')} className={`w-full text-left px-6 py-4 font-medium transition-colors ${activeTab === 'system' ? 'bg-primary/10 text-primary border-r-4 border-primary' : 'text-text-secondary hover:bg-card-hover'}`}>System Health</button>
                </div>
            </div>

            {/* Main Content */}
            <div className="ml-64 flex-1 p-8">
                {activeTab === 'overview' && metrics && (
                    <div className="max-w-7xl mx-auto">
                        <h1 className="text-3xl font-bold text-text-primary mb-8">Dashboard Overview</h1>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-card p-6 rounded-2xl shadow-sm border border-border hover:border-primary/50 transition-colors">
                                <p className="text-sm text-text-muted font-semibold uppercase tracking-wider mb-2">Total Users</p>
                                <p className="text-3xl font-bold text-text-primary">{metrics.summary.totalUsers}</p>
                                <p className="text-sm text-success mt-2">+{metrics.summary.activeUsersToday} active today</p>
                            </div>
                            <div className="bg-card p-6 rounded-2xl shadow-sm border border-border hover:border-primary/50 transition-colors">
                                <p className="text-sm text-text-muted font-semibold uppercase tracking-wider mb-2">Total Meetings</p>
                                <p className="text-3xl font-bold text-text-primary">{metrics.summary.totalMeetings}</p>
                                <p className="text-sm text-accent mt-2">{metrics.summary.completedMeetings} completed</p>
                            </div>
                            <div className="bg-card p-6 rounded-2xl shadow-sm border border-border hover:border-primary/50 transition-colors">
                                <p className="text-sm text-text-muted font-semibold uppercase tracking-wider mb-2">Assessments</p>
                                <p className="text-3xl font-bold text-text-primary">{metrics.summary.totalAssessmentsTaken}</p>
                                <p className="text-sm text-primary mt-2">{metrics.summary.passedAssessments} passed</p>
                            </div>
                            <div className="bg-card p-6 rounded-2xl shadow-sm border border-border hover:border-primary/50 transition-colors">
                                <p className="text-sm text-text-muted font-semibold uppercase tracking-wider mb-2">XP Awarded</p>
                                <p className="text-3xl font-bold text-text-primary">{metrics.summary.totalXPAwarded}</p>
                                <p className="text-sm text-warning mt-2">{metrics.summary.totalBadges} Badges Issued</p>
                            </div>
                        </div>

                        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
                            <h3 className="text-lg font-bold text-text-primary mb-6">User Growth (Last 7 Days)</h3>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={metrics.charts.userGrowth}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8' }} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
                                            itemStyle={{ color: '#F8FAFC' }}
                                        />
                                        <Line type="monotone" dataKey="users" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4, fill: '#06B6D4', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#06B6D4' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="bg-card p-12 text-center rounded-2xl border border-border max-w-4xl mx-auto mt-10">
                        <svg className="w-16 h-16 mx-auto mb-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
                        <h2 className="text-2xl font-bold text-text-primary mb-3">Deep Analytics Dashboard</h2>
                        <p className="text-text-secondary max-w-md mx-auto">More complex breakdown charts will appear here as more data is collected in the database over the coming weeks.</p>
                    </div>
                )}

                {activeTab === 'moderation' && (
                    <div className="max-w-7xl mx-auto">
                        <h1 className="text-3xl font-bold text-text-primary mb-8">User Moderation</h1>
                        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-background-secondary">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-text-muted uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border bg-card">
                                    {users.map((u) => (
                                        <tr key={u._id} className="hover:bg-card-hover transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{u.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{u.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <select 
                                                    value={u.role} 
                                                    onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                                    disabled={user.role !== 'superadmin' && u.role === 'superadmin'}
                                                    className="appearance-none bg-background-secondary border border-border text-text-primary text-xs rounded-lg focus:ring-2 focus:ring-primary focus:outline-none p-2 w-32"
                                                >
                                                    <option value="user">User</option>
                                                    <option value="admin">Admin</option>
                                                    <option value="superadmin">Superadmin</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <select 
                                                    value={u.status} 
                                                    onChange={(e) => handleStatusChange(u._id, e.target.value)}
                                                    disabled={user.role !== 'superadmin' && u.role === 'superadmin'}
                                                    className={`appearance-none text-xs rounded-lg p-2 w-28 font-bold focus:outline-none focus:ring-2 ${u.status === 'active' ? 'bg-success/20 text-success border border-success/30 focus:ring-success' : 'bg-error/20 text-error border border-error/30 focus:ring-error'}`}
                                                >
                                                    <option value="active">Active</option>
                                                    <option value="suspended">Suspended</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <span className="text-text-muted italic">Auto-saved</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'system' && metrics && (
                    <div className="max-w-7xl mx-auto">
                        <h1 className="text-3xl font-bold text-text-primary mb-8">System Health</h1>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                                <h3 className="font-bold text-text-primary border-b border-border pb-3 mb-5 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-success"></div> Core Services
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-background-secondary p-3 rounded-lg border border-border/50">
                                        <span className="text-text-secondary text-sm">Web Server</span>
                                        <span className="text-success font-bold text-sm bg-success/10 px-2 py-1 rounded">{metrics.systemHealth.serverStatus}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-background-secondary p-3 rounded-lg border border-border/50">
                                        <span className="text-text-secondary text-sm">MongoDB Database</span>
                                        <span className="text-success font-bold text-sm bg-success/10 px-2 py-1 rounded">{metrics.systemHealth.dbStatus}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-background-secondary p-3 rounded-lg border border-border/50">
                                        <span className="text-text-secondary text-sm">Average API Latency</span>
                                        <span className="text-accent font-medium text-sm">{metrics.systemHealth.apiResponseTime}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-background-secondary p-3 rounded-lg border border-border/50">
                                        <span className="text-text-secondary text-sm">Recent Server Errors</span>
                                        <span className={`font-medium text-sm ${metrics.systemHealth.errorCount > 0 ? 'text-error' : 'text-text-primary'}`}>{metrics.systemHealth.errorCount}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
