import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon issue with React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const Community = () => {
    const { token } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL ;
                const res = await axios.get(`${API_URL}/api/users`, {
                    headers: { 'x-auth-token': token }
                });
                setUsers(res.data);
            } catch (err) {
                console.error('Failed to fetch users', err);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [token]);

    const handleSendFriendRequest = async (userId) => {
        try {
            const API_URL = import.meta.env.VITE_API_URL ;
            await axios.post(`${API_URL}/api/friends/request/${userId}`, {}, {
                headers: { 'x-auth-token': token }
            });
            alert('Friend request sent!');
        } catch (err) {
            alert('Failed to send request');
        }
    };

    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(search.toLowerCase()) || 
        user.skillsKnown.some(skill => skill.toLowerCase().includes(search.toLowerCase())) ||
        user.skillsWanted.some(skill => skill.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-background text-text-primary">
            <header className="bg-card border-b border-border shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <h1 className="text-2xl font-bold text-text-primary tracking-tight">SkillSwap Community</h1>
                    <p className="text-text-secondary mt-1">Connect with mentors and learners globally.</p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search */}
                <div className="mb-10 max-w-2xl">
                    <input 
                        type="text" 
                        placeholder="Search for users or skills..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-4 py-3 bg-background-secondary border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
                    />
                </div>

                {/* Users Grid */}
                <div className="mb-12">
                    <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary"></span> Discover Members
                    </h2>
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredUsers.map(user => (
                                <div key={user._id} className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:border-primary/50 transition-colors">
                                    <div className="flex items-center space-x-4 mb-6">
                                        <div className="h-14 w-14 rounded-xl bg-background-secondary border border-primary/30 flex items-center justify-center text-primary font-bold text-2xl shadow-[0_0_10px_rgba(79,70,229,0.1)]">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-text-primary">{user.name}</h3>
                                            <div className="text-xs text-text-muted mt-1">Level {user.level || 1} Learner</div>
                                        </div>
                                    </div>
                                    <div className="text-sm text-text-secondary mb-6 space-y-3 bg-background-secondary p-4 rounded-xl border border-border/50">
                                        <div>
                                            <strong className="text-text-primary block mb-1">Teaches:</strong> 
                                            <div className="flex flex-wrap gap-1">
                                                {user.skillsKnown.map((s,i) => <span key={i} className="bg-card border border-border px-2 py-0.5 rounded text-xs">{s}</span>)}
                                            </div>
                                        </div>
                                        <div>
                                            <strong className="text-text-primary block mb-1">Learns:</strong> 
                                            <div className="flex flex-wrap gap-1">
                                                {user.skillsWanted.map((s,i) => <span key={i} className="bg-card border border-border px-2 py-0.5 rounded text-xs">{s}</span>)}
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleSendFriendRequest(user._id)}
                                        className="w-full bg-primary/10 text-primary border border-primary/20 py-2.5 rounded-xl hover:bg-primary hover:text-white transition-all text-sm font-medium active:scale-95"
                                    >
                                        Send Request
                                    </button>
                                </div>
                            ))}
                            {filteredUsers.length === 0 && (
                                <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-12 bg-card border border-border border-dashed rounded-2xl">
                                    <p className="text-text-muted">No users found matching your search.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Global Map */}
                <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
                    <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-accent"></span> Global Reach
                    </h2>
                    <div className="h-[400px] w-full rounded-xl overflow-hidden border border-border">
                        <MapContainer center={[20, 0]} zoom={2} scrollWheelZoom={false} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                            <TileLayer
                                attribution='&copy; OpenStreetMap'
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            />
                            {users.map(user => user.location && (
                                <Marker key={user._id} position={[user.location.lat, user.location.lng]}>
                                    <Popup className="custom-popup">
                                        <div className="font-sans">
                                            <strong className="text-gray-900 block mb-1">{user.name}</strong>
                                            <span className="text-sm text-gray-600">Teaches: {user.skillsKnown.join(', ')}</span>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Community;
