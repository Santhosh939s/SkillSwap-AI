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
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">SkillSwap Community</h1>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search */}
                <div className="mb-8">
                    <input 
                        type="text" 
                        placeholder="Search for users or skills..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg shadow-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Users Grid */}
                <div className="mb-12">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Discover Members</h2>
                    {loading ? (
                        <p>Loading community members...</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredUsers.map(user => (
                                <div key={user._id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                                    <div className="flex items-center space-x-4 mb-4">
                                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 font-bold text-xl">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900">{user.name}</h3>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-600 mb-4">
                                        <p><strong className="text-gray-800">Teaches:</strong> {user.skillsKnown.join(', ')}</p>
                                        <p className="mt-1"><strong className="text-gray-800">Learns:</strong> {user.skillsWanted.join(', ')}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleSendFriendRequest(user._id)}
                                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                                    >
                                        Send Friend Request
                                    </button>
                                </div>
                            ))}
                            {filteredUsers.length === 0 && <p className="col-span-3 text-gray-500">No users found matching your search.</p>}
                        </div>
                    )}
                </div>

                {/* Global Map */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Global Reach</h2>
                    <div className="h-[400px] w-full rounded overflow-hidden">
                        <MapContainer center={[20, 0]} zoom={2} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            {users.map(user => user.location && (
                                <Marker key={user._id} position={[user.location.lat, user.location.lng]}>
                                    <Popup>
                                        <strong>{user.name}</strong><br />
                                        Teaches: {user.skillsKnown.join(', ')}
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
