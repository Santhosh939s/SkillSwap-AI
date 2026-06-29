import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const COLORS = ['#4F46E5', '#06B6D4', '#22C55E', '#F59E0B', '#EF4444'];

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

    if (!stats || !chartData) return (
        <div className="min-h-screen bg-background flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-text-primary">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary tracking-tight">Learning Tracker</h1>
                        <p className="text-text-secondary mt-1">Track your skills, visualize your growth, and earn XP.</p>
                    </div>
                    <button 
                        onClick={() => setIsLogging(true)}
                        className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-primary/20 flex items-center transition-all active:scale-95"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        Log Activity
                    </button>
                </div>

                {/* Dashboard Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {/* Level & XP */}
                    <div className="bg-card border border-border rounded-2xl shadow-sm p-6 hover:border-primary/50 transition-colors">
                        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Current Level</h3>
                        <div className="flex items-end justify-between">
                            <span className="text-4xl font-bold text-text-primary">Lvl {stats.userStats.level}</span>
                            <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded-lg">{stats.userStats.totalXP} Total XP</span>
                        </div>
                    </div>

                    {/* Streaks */}
                    <div className="bg-card border border-border rounded-2xl shadow-sm p-6 hover:border-primary/50 transition-colors">
                        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Learning Streak</h3>
                        <div className="flex items-end justify-between">
                            <span className="text-4xl font-bold text-text-primary flex items-center">
                                🔥 {stats.userStats.currentStreak}
                            </span>
                            <span className="text-sm font-medium text-warning bg-warning/10 px-2 py-1 rounded-lg">Best: {stats.userStats.longestStreak}</span>
                        </div>
                    </div>

                    {/* Total Time */}
                    <div className="bg-card border border-border rounded-2xl shadow-sm p-6 hover:border-primary/50 transition-colors">
                        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Total Hours</h3>
                        <div className="flex items-end justify-between">
                            <span className="text-4xl font-bold text-text-primary">{stats.totalHours}h</span>
                            <span className="text-sm font-medium text-text-secondary bg-background-secondary px-2 py-1 rounded-lg">All Time</span>
                        </div>
                    </div>

                    {/* Active Skills */}
                    <div className="bg-card border border-border rounded-2xl shadow-sm p-6 hover:border-primary/50 transition-colors">
                        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Active Skills</h3>
                        <div className="flex items-end justify-between">
                            <span className="text-4xl font-bold text-text-primary">{stats.activeSkills}</span>
                            <span className="text-sm font-medium text-accent bg-accent/10 px-2 py-1 rounded-lg">In Progress</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* Charts Area (Span 2) */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* XP Growth Chart */}
                        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
                            <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary"></span> XP Growth (Last 30 Days)
                            </h3>
                            <div className="h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData.daily}>
                                        <defs>
                                            <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.5}/>
                                                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                        <XAxis dataKey="_id" tick={{fontSize: 12, fill: '#94A3B8'}} tickMargin={10} minTickGap={30} axisLine={false} tickLine={false} />
                                        <YAxis tick={{fontSize: 12, fill: '#94A3B8'}} axisLine={false} tickLine={false} />
                                        <RechartsTooltip 
                                            contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '12px' }}
                                            itemStyle={{ color: '#F8FAFC' }}
                                        />
                                        <Area type="monotone" dataKey="xp" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorXp)" activeDot={{ r: 6, fill: '#06B6D4', strokeWidth: 0 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Skill Distribution */}
                        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
                            <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-accent"></span> Time by Category
                            </h3>
                            <div className="h-72 w-full">
                                {chartData.distribution.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={chartData.distribution} dataKey="totalMinutes" nameKey="_id" cx="50%" cy="50%" outerRadius={90} label={{ fill: '#F8FAFC' }}>
                                                {chartData.distribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip 
                                                contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '12px' }}
                                            />
                                            <Legend wrapperStyle={{ color: '#94A3B8' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-text-muted bg-background-secondary rounded-xl border border-border border-dashed">
                                        No data available yet. Log some hours!
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Goals Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border h-full">
                            <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
                                <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-success"></span> Learning Goals
                                </h3>
                                <button className="text-primary hover:text-primary-hover text-sm font-bold bg-primary/10 px-3 py-1 rounded-lg transition-colors">+ Add</button>
                            </div>
                            <div className="space-y-6">
                                {goals.length === 0 ? (
                                    <div className="text-text-muted text-sm text-center py-10 bg-background-secondary rounded-xl border border-border border-dashed">
                                        No active goals. Create one to track progress!
                                    </div>
                                ) : goals.map(goal => {
                                    const percentage = Math.min(Math.round((goal.currentHours / goal.targetHours) * 100), 100);
                                    return (
                                        <div key={goal._id} className="bg-background-secondary p-4 rounded-xl border border-border/50">
                                            <div className="flex justify-between text-sm mb-3">
                                                <span className="font-bold text-text-primary">{goal.title}</span>
                                                <span className="text-text-secondary font-medium">{goal.currentHours.toFixed(1)} / {goal.targetHours}h</span>
                                            </div>
                                            <div className="w-full bg-card rounded-full h-3 border border-border overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-1000 ${percentage === 100 ? 'bg-success' : 'bg-primary'}`} style={{ width: `${percentage}%` }}></div>
                                            </div>
                                            <p className="text-xs text-right mt-2 font-bold text-text-muted">{percentage}% Completed</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Log Activity Modal */}
                {isLogging && (
                    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                        <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                            <div className="bg-background-secondary px-6 py-5 flex justify-between items-center border-b border-border">
                                <h2 className="text-text-primary font-bold text-xl">Log Learning Activity</h2>
                                <button onClick={() => setIsLogging(false)} className="text-text-muted hover:text-text-primary bg-card border border-border rounded-lg p-1 transition-colors">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <form onSubmit={handleLogSubmit} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Skill Category</label>
                                    <select className="appearance-none w-full bg-background-secondary border border-border text-text-primary rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" value={logForm.skillCategory} onChange={e => setLogForm({...logForm, skillCategory: e.target.value})}>
                                        <option>Web Development</option>
                                        <option>Data Science</option>
                                        <option>Design</option>
                                        <option>Marketing</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Specific Skill Name</label>
                                    <input type="text" required placeholder="e.g. React.js, Figma, Python" className="appearance-none w-full bg-background-secondary border border-border text-text-primary placeholder-text-muted rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" value={logForm.skillName} onChange={e => setLogForm({...logForm, skillName: e.target.value})} />
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-text-secondary mb-1.5">Hours</label>
                                        <input type="number" min="0" required className="appearance-none w-full bg-background-secondary border border-border text-text-primary rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" value={logForm.hoursLogged} onChange={e => setLogForm({...logForm, hoursLogged: e.target.value})} />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-text-secondary mb-1.5">Minutes</label>
                                        <input type="number" min="0" max="59" required className="appearance-none w-full bg-background-secondary border border-border text-text-primary rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" value={logForm.minutesLogged} onChange={e => setLogForm({...logForm, minutesLogged: e.target.value})} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Tags (comma separated)</label>
                                    <input type="text" placeholder="e.g. hooks, tutorial, side-project" className="appearance-none w-full bg-background-secondary border border-border text-text-primary placeholder-text-muted rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" value={logForm.tags} onChange={e => setLogForm({...logForm, tags: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Status</label>
                                    <select className="appearance-none w-full bg-background-secondary border border-border text-text-primary rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" value={logForm.learningStatus} onChange={e => setLogForm({...logForm, learningStatus: e.target.value})}>
                                        <option>Learning</option>
                                        <option>Completed</option>
                                        <option>Paused</option>
                                    </select>
                                </div>
                                <div className="pt-4">
                                    <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95">
                                        Save Progress & Earn XP
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LearningTracker;
