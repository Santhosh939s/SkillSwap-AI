import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Leaderboard = () => {
    const { token } = useContext(AuthContext);
    const [leaderboard, setLeaderboard] = useState([]);
    const [currentUserStats, setCurrentUserStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const [metric, setMetric] = useState('totalXP');
    const [scope, setScope] = useState('Global');

    useEffect(() => {
        const fetchLeaderboard = async () => {
            if (!token) return;
            setLoading(true);
            try {
                const API_URL = import.meta.env.VITE_API_URL ;
                const res = await axios.get(`${API_URL}/api/leaderboard`, {
                    headers: { 'x-auth-token': token },
                    params: { metric, scope }
                });
                if (res.data.success) {
                    setLeaderboard(res.data.data.leaderboard);
                    setCurrentUserStats(res.data.data.currentUser);
                }
            } catch (err) {
                console.error('Failed to load leaderboard', err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, [token, metric, scope]);

    const getRankIcon = (index) => {
        if (index === 0) return '🥇';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return `#${index + 1}`;
    };

    const getMetricLabel = () => {
        switch (metric) {
            case 'totalXP': return 'Total XP';
            case 'currentStreak': return 'Current Streak';
            case 'longestStreak': return 'Longest Streak';
            case 'badges': return 'Verified Badges';
            case 'level': return 'Level';
            default: return 'Score';
        }
    };

    return (
        <div className="min-h-screen bg-background text-text-primary">
            <div className="max-w-5xl mx-auto px-4 py-12">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-text-primary mb-4 tracking-tight">Leaderboard</h1>
                    <p className="text-xl text-text-secondary">Compete with friends and learners worldwide.</p>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-10">
                    <div className="flex bg-background-secondary p-1 rounded-xl border border-border">
                        <button 
                            onClick={() => setScope('Global')}
                            className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all ${scope === 'Global' ? 'bg-card text-primary shadow-sm border border-border' : 'text-text-muted hover:text-text-secondary'}`}
                        >
                            Global
                        </button>
                        <button 
                            onClick={() => setScope('Friends')}
                            className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all ${scope === 'Friends' ? 'bg-card text-primary shadow-sm border border-border' : 'text-text-muted hover:text-text-secondary'}`}
                        >
                            Friends
                        </button>
                    </div>
                    
                    <select 
                        value={metric} 
                        onChange={(e) => setMetric(e.target.value)}
                        className="appearance-none bg-background-secondary border border-border text-text-primary text-sm rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent px-5 py-2.5 outline-none transition-all cursor-pointer shadow-sm"
                    >
                        <option value="totalXP">Total XP (Top Learners)</option>
                        <option value="currentStreak">Current Streak</option>
                        <option value="longestStreak">Longest Streak</option>
                        <option value="badges">Verified Badges</option>
                        <option value="level">Level</option>
                    </select>
                </div>

                {/* Current User Banner */}
                {currentUserStats && (
                    <div className="bg-gradient-to-r from-primary to-accent rounded-2xl shadow-lg p-6 mb-8 text-white flex items-center justify-between shadow-primary/20">
                        <div className="flex items-center space-x-4">
                            <div className="h-14 w-14 bg-white/20 rounded-xl flex items-center justify-center font-bold text-2xl border border-white/30">
                                {currentUserStats.rank === 'Private' ? '👻' : currentUserStats.rank}
                            </div>
                            <div>
                                <h3 className="font-bold text-xl text-white">My Ranking</h3>
                                <p className="text-white/80 text-sm mt-1">
                                    {currentUserStats.rank === 'Private' 
                                        ? 'You are hidden from the leaderboard. Update visibility in Profile.' 
                                        : `You are ranked #${currentUserStats.rank} in ${scope}`}
                                </p>
                            </div>
                        </div>
                        {currentUserStats.data && (
                            <div className="text-right">
                                <p className="text-4xl font-black">{currentUserStats.data.metricValue}</p>
                                <p className="text-white/80 text-sm uppercase font-bold tracking-wider mt-1">{getMetricLabel()}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Leaderboard Table */}
                <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : leaderboard.length === 0 ? (
                        <div className="p-12 text-center text-text-muted font-medium bg-background-secondary border border-border border-dashed m-4 rounded-xl">No users found for this category.</div>
                    ) : (
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-background-secondary">
                                <tr>
                                    <th scope="col" className="px-6 py-5 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Rank</th>
                                    <th scope="col" className="px-6 py-5 text-left text-xs font-bold text-text-muted uppercase tracking-wider">User</th>
                                    <th scope="col" className="px-6 py-5 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Level</th>
                                    <th scope="col" className="px-6 py-5 text-right text-xs font-bold text-text-muted uppercase tracking-wider">{getMetricLabel()}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-card divide-y divide-border">
                                {leaderboard.map((user, index) => (
                                    <tr key={user._id} className="hover:bg-card-hover transition-colors">
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <span className="text-3xl drop-shadow-sm">{getRankIcon(index)}</span>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-12 w-12">
                                                    <div className="h-12 w-12 rounded-xl bg-background-secondary border border-primary/20 flex items-center justify-center text-primary font-bold shadow-[0_0_10px_rgba(79,70,229,0.1)]">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                </div>
                                                <div className="ml-5">
                                                    <div className="text-base font-bold text-text-primary">{user.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-lg bg-primary/10 text-primary border border-primary/20">
                                                Lvl {user.level || 1}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-right text-xl font-black text-text-primary">
                                            {user.metricValue}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
