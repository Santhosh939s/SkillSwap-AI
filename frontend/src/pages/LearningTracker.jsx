import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const COLORS = ['#8a4fff', '#30d5c8', '#ff7300', '#ff0000', '#00C49F'];

const LearningTracker = () => {
    const { token } = useContext(AuthContext);
    
    // Analytics State
    const [stats, setStats] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [goals, setGoals] = useState([]);
    
    // Modal State
    const [isLogging, setIsLogging] = useState(false);
    const [logForm, setLogForm] = useState({
        skillCategory: 'Web Development',
        skillName: '',
        hoursLogged: 0,
        minutesLogged: 30,
        notes: '',
        tags: '',
        learningStatus: 'Learning'
    });

    const fetchDashboard = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL ;
            const [dashRes, chartRes, goalsRes] = await Promise.all([
                axios.get(`${API_URL}/api/progress/dashboard`, { headers: { 'x-auth-token': token } }),
                axios.get(`${API_URL}/api/progress/charts?days=30`, { headers: { 'x-auth-token': token } }),
                axios.get(`${API_URL}/api/progress/goals`, { headers: { 'x-auth-token': token } })
            ]);
            setStats(dashRes.data.data);
            setChartData(chartRes.data.data);
            setGoals(goalsRes.data.data);
        } catch (err) {
            console.error('Failed to load learning tracker data', err);
        }
    };

    useEffect(() => {
        if (token) fetchDashboard();
    }, [token]);

    const handleLogSubmit = async (e) => {
        e.preventDefault();
        try {
            const API_URL = import.meta.env.VITE_API_URL ;
            const payload = {
                ...logForm,
                tags: logForm.tags.split(',').map(t => t.trim()).filter(t => t)
            };
            const res = await axios.post(`${API_URL}/api/progress/log`, payload, { headers: { 'x-auth-token': token } });
            if (res.data.success) {
                alert(`Successfully logged! You earned ${res.data.data.progress.xpEarned} XP!`);
                setIsLogging(false);
                fetchDashboard(); // refresh stats
            }
        } catch (err) {
            console.error(err);
            alert('Error logging activity.');
        }
    };

    if (!stats || !chartData) return <div className="p-8 text-center">Loading Learning Analytics...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Learning Tracker</h1>
                    <p className="text-gray-500">Track your skills, visualize your growth, and earn XP.</p>
                </div>
                <button 
                    onClick={() => setIsLogging(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg flex items-center transition-colors"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    Log Activity
                </button>
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Level & XP */}
                <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl shadow p-6 text-white transform transition hover:-translate-y-1">
                    <h3 className="text-sm font-semibold opacity-80 uppercase tracking-wider mb-2">Current Level</h3>
                    <div className="flex items-end justify-between">
                        <span className="text-4xl font-bold">Lvl {stats.userStats.level}</span>
                        <span className="text-sm opacity-90">{stats.userStats.totalXP} Total XP</span>
                    </div>
                </div>

                {/* Streaks */}
                <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow p-6 text-white transform transition hover:-translate-y-1">
                    <h3 className="text-sm font-semibold opacity-80 uppercase tracking-wider mb-2">Learning Streak</h3>
                    <div className="flex items-end justify-between">
                        <span className="text-4xl font-bold flex items-center">
                            🔥 {stats.userStats.currentStreak}
                        </span>
                        <span className="text-sm opacity-90">Best: {stats.userStats.longestStreak}</span>
                    </div>
                </div>

                {/* Total Time */}
                <div className="bg-white rounded-xl shadow p-6 border border-gray-100 transform transition hover:-translate-y-1">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Hours</h3>
                    <div className="flex items-end justify-between">
                        <span className="text-4xl font-bold text-gray-900">{stats.totalHours}h</span>
                        <span className="text-sm text-gray-400">All Time</span>
                    </div>
                </div>

                {/* Active Skills */}
                <div className="bg-white rounded-xl shadow p-6 border border-gray-100 transform transition hover:-translate-y-1">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Active Skills</h3>
                    <div className="flex items-end justify-between">
                        <span className="text-4xl font-bold text-gray-900">{stats.activeSkills}</span>
                        <span className="text-sm text-gray-400">In Progress</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Charts Area (Span 2) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* XP Growth Chart */}
                    <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">XP Growth (Last 30 Days)</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData.daily}>
                                    <defs>
                                        <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8a4fff" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#8a4fff" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                    <XAxis dataKey="_id" tick={{fontSize: 12, fill: '#888'}} tickMargin={10} minTickGap={30} />
                                    <YAxis tick={{fontSize: 12, fill: '#888'}} axisLine={false} tickLine={false} />
                                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Area type="monotone" dataKey="xp" stroke="#8a4fff" fillOpacity={1} fill="url(#colorXp)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Skill Distribution */}
                    <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Time by Category</h3>
                        <div className="h-64 w-full">
                            {chartData.distribution.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={chartData.distribution} dataKey="totalMinutes" nameKey="_id" cx="50%" cy="50%" outerRadius={80} label>
                                            {chartData.distribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400">No data available yet.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Goals Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl shadow border border-gray-100 h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800">Learning Goals</h3>
                            <button className="text-purple-600 hover:text-purple-800 text-sm font-semibold">+ Add Goal</button>
                        </div>
                        <div className="space-y-6">
                            {goals.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-4">No active goals. Create one to track progress!</p>
                            ) : goals.map(goal => {
                                const percentage = Math.min(Math.round((goal.currentHours / goal.targetHours) * 100), 100);
                                return (
                                    <div key={goal._id} className="mb-4">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-semibold text-gray-700">{goal.title}</span>
                                            <span className="text-gray-500">{goal.currentHours.toFixed(1)} / {goal.targetHours}h</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div className={`h-2.5 rounded-full ${percentage === 100 ? 'bg-green-500' : 'bg-purple-600'}`} style={{ width: `${percentage}%` }}></div>
                                        </div>
                                        <p className="text-xs text-right mt-1 text-gray-400">{percentage}% Completed</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Log Activity Modal */}
            {isLogging && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-white font-bold text-xl">Log Learning Activity</h2>
                            <button onClick={() => setIsLogging(false)} className="text-white hover:text-gray-200">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleLogSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Skill Category</label>
                                <select className="w-full border-gray-300 rounded-md shadow-sm p-2 border" value={logForm.skillCategory} onChange={e => setLogForm({...logForm, skillCategory: e.target.value})}>
                                    <option>Web Development</option>
                                    <option>Data Science</option>
                                    <option>Design</option>
                                    <option>Marketing</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Specific Skill Name</label>
                                <input type="text" required placeholder="e.g. React.js, Figma, Python" className="w-full border-gray-300 rounded-md shadow-sm p-2 border" value={logForm.skillName} onChange={e => setLogForm({...logForm, skillName: e.target.value})} />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
                                    <input type="number" min="0" required className="w-full border-gray-300 rounded-md shadow-sm p-2 border" value={logForm.hoursLogged} onChange={e => setLogForm({...logForm, hoursLogged: e.target.value})} />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Minutes</label>
                                    <input type="number" min="0" max="59" required className="w-full border-gray-300 rounded-md shadow-sm p-2 border" value={logForm.minutesLogged} onChange={e => setLogForm({...logForm, minutesLogged: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                                <input type="text" placeholder="e.g. hooks, tutorial, side-project" className="w-full border-gray-300 rounded-md shadow-sm p-2 border" value={logForm.tags} onChange={e => setLogForm({...logForm, tags: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select className="w-full border-gray-300 rounded-md shadow-sm p-2 border" value={logForm.learningStatus} onChange={e => setLogForm({...logForm, learningStatus: e.target.value})}>
                                    <option>Learning</option>
                                    <option>Completed</option>
                                    <option>Paused</option>
                                </select>
                            </div>
                            <div className="pt-4">
                                <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg shadow transition-colors">
                                    Save Progress & Earn XP
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LearningTracker;
