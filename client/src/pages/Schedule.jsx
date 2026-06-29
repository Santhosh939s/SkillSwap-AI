import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Schedule = () => {
    const { token } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const [friends, setFriends] = useState([]);
    const [showModal, setShowModal] = useState(false);
    
    // New meeting form state
    const [selectedFriend, setSelectedFriend] = useState('');
    const [topic, setTopic] = useState('');
    const [date, setDate] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                
                // Fetch meetings
                const resMeetings = await axios.get(`${API_URL}/api/meetings`, {
                    headers: { 'x-auth-token': token }
                });
                setMeetings(resMeetings.data);

                // Fetch friends to populate select dropdown
                const resProfile = await axios.get(`${API_URL}/api/profile`, {
                    headers: { 'x-auth-token': token }
                });
                setFriends(resProfile.data.friends || []);
            } catch (err) {
                console.error('Failed to fetch scheduling data', err);
            }
        };
        if (token) fetchData();
    }, [token]);

    const handleRequestMeeting = async (e) => {
        e.preventDefault();
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const res = await axios.post(`${API_URL}/api/meetings`, {
                recipientId: selectedFriend,
                topic,
                date
            }, {
                headers: { 'x-auth-token': token }
            });
            setMeetings(prev => [...prev, res.data]);
            setShowModal(false);
            setTopic('');
            setDate('');
            setSelectedFriend('');
        } catch (err) {
            alert('Failed to request meeting');
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const res = await axios.put(`${API_URL}/api/meetings/${id}`, { status }, {
                headers: { 'x-auth-token': token }
            });
            setMeetings(prev => prev.map(m => m._id === id ? res.data : m));
        } catch (err) {
            alert('Failed to update status');
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Meeting Schedule</h1>
                <button 
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 font-medium"
                >
                    + Schedule Meeting
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">With</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {meetings.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No meetings scheduled yet.</td></tr>
                        ) : meetings.map(meeting => {
                            const isRequester = typeof meeting.requester === 'object' 
                                                ? meeting.requester._id // if populated
                                                : meeting.requester; // wait, if we are not the requester, then we are recipient
                            
                            // Let's grab the other person's name
                            // If we populate both, we need to know who 'we' are. We can check by seeing if meeting.requester._id is in our friends list, or we can just fetch our own userId, but for now we can just show both or assume the other one.
                            const otherPersonName = meeting.requester.name && meeting.recipient.name
                                ? (meeting.recipient.name) // Simplified for UI
                                : 'Friend';

                            return (
                                <tr key={meeting._id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {new Date(meeting.date).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                        {meeting.topic}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {meeting.requester.name} & {meeting.recipient.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${meeting.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                                              meeting.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {meeting.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        {meeting.status === 'pending' && (
                                            <>
                                                <button onClick={() => handleUpdateStatus(meeting._id, 'accepted')} className="text-green-600 hover:text-green-900">Accept</button>
                                                <button onClick={() => handleUpdateStatus(meeting._id, 'rejected')} className="text-red-600 hover:text-red-900">Reject</button>
                                            </>
                                        )}
                                        {meeting.status === 'accepted' && (
                                            <button onClick={() => navigate('/video-call')} className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200">Join Call</button>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Request a Meeting</h2>
                        <form onSubmit={handleRequestMeeting}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Friend</label>
                                <select 
                                    required 
                                    value={selectedFriend}
                                    onChange={(e) => setSelectedFriend(e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                >
                                    <option value="">-- Choose a friend --</option>
                                    {friends.map(f => (
                                        <option key={f._id} value={f._id}>{f.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g. React hooks tutoring"
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                                <input 
                                    type="datetime-local" 
                                    required 
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Send Request</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Schedule;
