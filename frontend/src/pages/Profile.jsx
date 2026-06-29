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
        <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-text-primary mb-8">My Profile</h1>
                {profile ? (
                    <div className="bg-card border border-border shadow-xl rounded-2xl p-8">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-8 border-b border-border">
                            <div className="flex items-center space-x-6">
                                <div className="h-24 w-24 rounded-full bg-background-secondary border-2 border-primary flex items-center justify-center text-primary font-bold text-4xl shadow-[0_0_15px_rgba(79,70,229,0.2)]">
                                    {profile.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-text-primary">{profile.name}</h2>
                                    <p className="text-text-secondary mt-1">{profile.email}</p>
                                </div>
                            </div>
                            <div className="mt-6 sm:mt-0 bg-background-secondary p-4 rounded-xl border border-border">
                                <label className="block text-sm font-medium text-text-secondary mb-2">Leaderboard Visibility</label>
                                <select 
                                    className="appearance-none bg-card border border-border text-text-primary text-sm rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent block w-full p-2.5 transition-all"
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
                                    <p className="text-xs text-error mt-2">Leaderboard participation disabled.</p>
                                )}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-background-secondary rounded-xl p-6 border border-border">
                                <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-accent"></span> Skills I Have
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {profile.skillsKnown.map((skill, i) => (
                                        <span key={i} className="bg-card border border-border px-3 py-1.5 rounded-lg text-text-secondary text-sm font-medium">{skill}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-background-secondary rounded-xl p-6 border border-border">
                                <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-primary"></span> Skills I Want
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {profile.skillsWanted.map((skill, i) => (
                                        <span key={i} className="bg-card border border-border px-3 py-1.5 rounded-lg text-text-secondary text-sm font-medium">{skill}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Verified Badges Section */}
                        <div className="mt-12">
                            <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
                                <span className="text-warning">🏆</span> Verified Badges
                            </h3>
                            {badges.length === 0 ? (
                                <div className="bg-background-secondary border border-border border-dashed rounded-xl p-8 text-center">
                                    <p className="text-text-muted">No badges earned yet. Take an assessment to earn one!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {badges.map(b => (
                                        <div key={b._id} className="flex items-center p-5 bg-card border border-border rounded-xl shadow-sm hover:border-primary/50 transition-colors">
                                            <div className="text-4xl mr-5 bg-background-secondary p-3 rounded-xl">{b.icon}</div>
                                            <div>
                                                <h4 className="font-bold text-text-primary">{b.name}</h4>
                                                <p className="text-xs text-primary font-semibold uppercase mt-1">{b.skill} • {b.difficulty}</p>
                                                <p className="text-xs text-text-muted mt-1">Issued: {new Date(b.issueDate).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
