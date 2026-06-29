import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const { token, logout } = useContext(AuthContext);
    const [profile, setProfile] = useState(null);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL ;
                
                const profileRes = await axios.get(`${API_URL}/api/profile`, {
                    headers: { 'x-auth-token': token }
                });
                setProfile(profileRes.data);

                const matchesRes = await axios.get(`${API_URL}/api/matches`, {
                    headers: { 'x-auth-token': token }
                });
                setMatches(matchesRes.data);

            } catch (err) {
                console.error(err);
                setError('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchDashboardData();
        }
    }, [token]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>;
    }

    if (error) {
        return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">SkillSwap Dashboard</h1>
                    <div className="flex items-center space-x-4">
                        <span className="text-gray-700">Welcome, {profile?.name}!</span>
                        <Link to="/community" className="text-blue-600 hover:text-blue-800 font-medium">Community</Link>
                        <Link to="/chat" className="text-blue-600 hover:text-blue-800 font-medium">Chat</Link>
                        <Link to="/video-call" className="text-blue-600 hover:text-blue-800 font-medium">Video Call</Link>
                        <Link to="/profile" className="text-blue-600 hover:text-blue-800 font-medium">Profile</Link>
                        <button onClick={logout} className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 text-sm font-medium">Logout</button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Left Column */}
                    <div className="space-y-6 md:col-span-1">
                        {/* Profile Card */}
                        <section className="bg-white p-6 rounded-lg shadow">
                            <div className="text-center">
                                <div className="h-24 w-24 rounded-full bg-blue-100 mx-auto flex items-center justify-center text-blue-500 text-3xl font-bold mb-4">
                                    {profile?.name?.charAt(0).toUpperCase()}
                                </div>
                                <h2 className="text-xl font-bold">{profile?.name}</h2>
                                <p className="text-gray-500 text-sm">{profile?.email}</p>
                            </div>
                            
                            <div className="mt-6 border-t pt-4">
                                <h3 className="text-sm font-bold text-gray-700 mb-2">Skills I Have</h3>
                                <div className="flex flex-wrap gap-2">
                                    {profile?.skillsKnown?.map((skill, idx) => (
                                        <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{skill}</span>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="mt-4 border-t pt-4">
                                <h3 className="text-sm font-bold text-gray-700 mb-2">Skills I Want</h3>
                                <div className="flex flex-wrap gap-2">
                                    {profile?.skillsWanted?.map((skill, idx) => (
                                        <span key={idx} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">{skill}</span>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Recent Activity */}
                        <section className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
                            <ul className="space-y-3">
                                {profile?.activityLog?.length > 0 ? profile.activityLog.map((log, idx) => (
                                    <li key={idx} className="text-sm text-gray-600 border-l-2 border-blue-500 pl-3 py-1">
                                        {log.action} <span className="text-xs text-gray-400 block">{new Date(log.timestamp).toLocaleDateString()}</span>
                                    </li>
                                )) : (
                                    <p className="text-sm text-gray-500">No recent activity.</p>
                                )}
                            </ul>
                        </section>
                    </div>

                    {/* Middle Column */}
                    <div className="space-y-6 md:col-span-2">
                        {/* Notifications */}
                        <section className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-bold mb-4">Notifications</h3>
                            <div className="space-y-2">
                                {profile?.friendRequests?.length > 0 ? profile.friendRequests.map(req => (
                                    <div key={req._id} className="p-3 bg-yellow-50 border border-yellow-200 rounded flex justify-between items-center">
                                        <span className="text-sm text-gray-800">{req.name} sent you a friend request.</span>
                                        <button className="text-xs bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600">Accept (Coming Soon)</button>
                                    </div>
                                )) : (
                                    <p className="text-sm text-gray-500">No new notifications.</p>
                                )}
                            </div>
                        </section>

                        {/* Recommended Matches */}
                        <section className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-bold mb-4">Recommended Matches</h3>
                            {matches.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {matches.map(match => (
                                        <div key={match._id} className="border p-4 rounded flex flex-col h-full">
                                            <h4 className="font-bold text-gray-900">{match.name}</h4>
                                            <p className="text-xs text-gray-500 mt-1 flex-grow">
                                                <strong>Can teach:</strong> {match.skillsKnown.join(', ')}<br/>
                                                <strong>Wants to learn:</strong> {match.skillsWanted.join(', ')}
                                            </p>
                                            <button className="mt-3 text-sm text-blue-600 font-medium hover:underline self-start">Connect</button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No exact matches found right now. Explore the community!</p>
                            )}
                        </section>

                        {/* Friends & Chat Link */}
                        <section className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-bold mb-4 text-gray-700">Friends & Chat</h3>
                            <div className="p-4 bg-gray-50 rounded text-center border">
                                <p className="text-sm text-gray-600 mb-4">You have {profile?.friends?.length || 0} friends.</p>
                                <Link to="/chat" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-medium mr-2">Open Chat</Link>
                                <Link to="/video-call" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 font-medium">Start Video Call</Link>
                            </div>
                        </section>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default Dashboard;
