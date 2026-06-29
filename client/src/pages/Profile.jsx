import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Profile = () => {
    const { token } = useContext(AuthContext);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                const res = await axios.get(`${API_URL}/api/profile`, {
                    headers: { 'x-auth-token': token }
                });
                setProfile(res.data);
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
                    <div className="flex items-center space-x-6 mb-8">
                        <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 font-bold text-4xl">
                            {profile.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
                            <p className="text-gray-500">{profile.email}</p>
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
                </div>
            ) : (
                <p>Loading profile...</p>
            )}
        </div>
    );
};

export default Profile;
