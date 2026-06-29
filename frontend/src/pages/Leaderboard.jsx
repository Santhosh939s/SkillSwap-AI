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
        <div className="max-w-5xl mx-auto px-4 py-12">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Leaderboard</h1>
                <p className="text-xl text-gray-500">Compete with friends and learners worldwide.</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-10">
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setScope('Global')}
                        className={`px-6 py-2 rounded-md font-semibold text-sm transition-colors ${scope === 'Global' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        Global
                    </button>
                    <button 
                        onClick={() => setScope('Friends')}
                        className={`px-6 py-2 rounded-md font-semibold text-sm transition-colors ${scope === 'Friends' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        Friends
                    </button>
                </div>
                
                <select 
                    value={metric} 
                    onChange={(e) => setMetric(e.target.value)}
                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 px-4 py-2"
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
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 mb-8 text-white flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center font-bold text-xl">
                            {currentUserStats.rank === 'Private' ? '👻' : currentUserStats.rank}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">My Ranking</h3>
                            <p className="text-blue-100 text-sm">
                                {currentUserStats.rank === 'Private' 
                                    ? 'You are hidden from the leaderboard. Update visibility in Profile.' 
                                    : `You are ranked #${currentUserStats.rank} in ${scope}`}
                            </p>
                        </div>
                    </div>
                    {currentUserStats.data && (
                        <div className="text-right">
                            <p className="text-3xl font-black">{currentUserStats.data.metricValue}</p>
                            <p className="text-blue-100 text-sm uppercase font-semibold">{getMetricLabel()}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Leaderboard Table */}
            <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-500 font-medium">Loading rankings...</div>
                ) : leaderboard.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 font-medium">No users found for this category.</div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Rank</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Level</th>
                                <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">{getMetricLabel()}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {leaderboard.map((user, index) => (
                                <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-2xl">{getRankIcon(index)}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-bold text-gray-900">{user.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                            Lvl {user.level || 1}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-lg font-black text-gray-900">
                                        {user.metricValue}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Leaderboard;
