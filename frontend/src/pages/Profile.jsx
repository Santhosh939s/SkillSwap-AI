import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Profile = () => {
    const { token } = useContext(AuthContext);
    const [profile, setProfile] = useState(null);
    const [badges, setBadges] = useState([]);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL ;
                const [profRes, badgesRes] = await Promise.all([
                    axios.get(`${API_URL}/api/profile`, { headers: { 'x-auth-token': token } }),
                    axios.get(`${API_URL}/api/assessments/badges`, { headers: { 'x-auth-token': token } })
                ]);
                setProfile(profRes.data);
                if (badgesRes.data.success) {
                    setBadges(badgesRes.data.data);
                }
            } catch (err) {
                console.error('Failed to load profile');
            }
        };
        if (token) fetchProfile();
    }, [token]);

    return (
        <div className="max-w-4xl mx-auto py-10 px-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>
            {profile ? (
                <div className="bg-white shadow rounded-lg p-8 border">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
                        <div className="flex items-center space-x-6">
                            <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 font-bold text-4xl">
                                {profile.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
                                <p className="text-gray-500">{profile.email}</p>
                            </div>
                        </div>
                        <div className="mt-4 sm:mt-0">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Leaderboard Visibility</label>
                            <select 
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                value={profile.leaderboardVisibility || 'Private'}
                                onChange={async (e) => {
                                    const newVis = e.target.value;
                                    setProfile({...profile, leaderboardVisibility: newVis});
                                    try {
                                        const API_URL = import.meta.env.VITE_API_URL ;
                                        await axios.put(`${API_URL}/api/profile/visibility`, { visibility: newVis }, { headers: { 'x-auth-token': token } });
                                    } catch (err) {
                                        console.error('Failed to update visibility');
                                    }
                                }}
                            >
                                <option value="Private">Private (Opt-Out)</option>
                                <option value="Friends">Friends Only</option>
                                <option value="Global">Global</option>
                            </select>
                            {(!profile.leaderboardVisibility || profile.leaderboardVisibility === 'Private') && (
                                <p className="text-xs text-red-500 mt-1">Leaderboard participation disabled.</p>
                            )}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-3 border-b pb-2">Skills I Have</h3>
                            <ul className="space-y-2">
                                {profile.skillsKnown.map((skill, i) => (
                                    <li key={i} className="bg-gray-100 px-3 py-2 rounded text-gray-700">{skill}</li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-3 border-b pb-2">Skills I Want</h3>
                            <ul className="space-y-2">
                                {profile.skillsWanted.map((skill, i) => (
                                    <li key={i} className="bg-gray-100 px-3 py-2 rounded text-gray-700">{skill}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Verified Badges Section */}
                    <div className="mt-12">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2 flex items-center">
                            <span className="mr-2">🏆</span> Verified Badges
                        </h3>
                        {badges.length === 0 ? (
                            <p className="text-gray-500 italic">No badges earned yet. Take an assessment to earn one!</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {badges.map(b => (
                                    <div key={b._id} className="flex items-center p-4 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl shadow-sm hover:shadow transition-shadow">
                                        <div className="text-4xl mr-4">{b.icon}</div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{b.name}</h4>
                                            <p className="text-xs text-gray-500 font-semibold uppercase">{b.skill} • {b.difficulty}</p>
                                            <p className="text-xs text-gray-400 mt-1">Issued: {new Date(b.issueDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <p>Loading profile...</p>
            )}
        </div>
    );
};

export default Profile;
