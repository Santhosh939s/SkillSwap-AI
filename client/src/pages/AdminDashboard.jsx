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
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                
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
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
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
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const res = await axios.put(`${API_URL}/api/admin/users/${userId}`, { status: newStatus }, { headers: { 'x-auth-token': token } });
            if (res.data.success) {
                toast.success('Status updated');
                setUsers(users.map(u => u._id === userId ? { ...u, status: newStatus } : u));
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update status');
        }
    };

    if (loading && !metrics && users.length === 0) return <div className="p-8 text-center">Loading Admin Panel...</div>;

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 fixed h-full flex flex-col">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
                    <p className="text-sm text-gray-500 capitalize">{user?.role} Access</p>
                </div>
                <div className="flex-1 py-4">
                    <button onClick={() => setActiveTab('overview')} className={`w-full text-left px-6 py-3 font-medium transition-colors ${activeTab === 'overview' ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>Dashboard Overview</button>
                    <button onClick={() => setActiveTab('analytics')} className={`w-full text-left px-6 py-3 font-medium transition-colors ${activeTab === 'analytics' ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>Analytics Charts</button>
                    <button onClick={() => setActiveTab('moderation')} className={`w-full text-left px-6 py-3 font-medium transition-colors ${activeTab === 'moderation' ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>User Moderation</button>
                    <button onClick={() => setActiveTab('system')} className={`w-full text-left px-6 py-3 font-medium transition-colors ${activeTab === 'system' ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>System Health</button>
                </div>
            </div>

            {/* Main Content */}
            <div className="ml-64 flex-1 p-8">
                {activeTab === 'overview' && metrics && (
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard Overview</h1>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider mb-2">Total Users</p>
                                <p className="text-3xl font-bold text-gray-900">{metrics.summary.totalUsers}</p>
                                <p className="text-sm text-green-600 mt-2">+{metrics.summary.activeUsersToday} active today</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider mb-2">Total Meetings</p>
                                <p className="text-3xl font-bold text-gray-900">{metrics.summary.totalMeetings}</p>
                                <p className="text-sm text-blue-600 mt-2">{metrics.summary.completedMeetings} completed</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider mb-2">Assessments</p>
                                <p className="text-3xl font-bold text-gray-900">{metrics.summary.totalAssessmentsTaken}</p>
                                <p className="text-sm text-purple-600 mt-2">{metrics.summary.passedAssessments} passed</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider mb-2">XP Awarded</p>
                                <p className="text-3xl font-bold text-gray-900">{metrics.summary.totalXPAwarded}</p>
                                <p className="text-sm text-yellow-600 mt-2">{metrics.summary.totalBadges} Badges Issued</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">User Growth (Last 7 Days)</h3>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={metrics.charts.userGrowth}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                                        <Tooltip cursor={{ stroke: '#9CA3AF', strokeWidth: 1, strokeDasharray: '5 5' }} />
                                        <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="bg-white p-12 text-center rounded-xl border border-gray-200">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Deep Analytics</h2>
                        <p className="text-gray-500">More complex breakdown charts will appear here as more data is collected in the database.</p>
                    </div>
                )}

                {activeTab === 'moderation' && (
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-8">User Moderation</h1>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Name</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Email</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Role</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {users.map((u) => (
                                        <tr key={u._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <select 
                                                    value={u.role} 
                                                    onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                                    disabled={user.role !== 'superadmin' && u.role === 'superadmin'}
                                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded focus:ring-blue-500 focus:border-blue-500 p-1"
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
                                                    className={`text-xs rounded p-1 font-bold ${u.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                                                >
                                                    <option value="active">Active</option>
                                                    <option value="suspended">Suspended</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                {/* Actions block - could add direct messaging, forced logout, etc */}
                                                <span className="text-gray-400">Settings saved via dropdown</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'system' && metrics && (
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-8">System Health</h1>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-xl border border-gray-200">
                                <h3 className="font-bold text-gray-800 border-b pb-2 mb-4">Core Services</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Web Server</span>
                                        <span className="text-green-600 font-bold">{metrics.systemHealth.serverStatus}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">MongoDB Database</span>
                                        <span className="text-green-600 font-bold">{metrics.systemHealth.dbStatus}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Average API Latency</span>
                                        <span className="text-gray-900 font-medium">{metrics.systemHealth.apiResponseTime}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Recent Server Errors</span>
                                        <span className="text-gray-900 font-medium">{metrics.systemHealth.errorCount}</span>
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
