import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Schedule.css';
import { isSameDay, parseISO } from 'date-fns';

const Schedule = () => {
    const { token, user } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const [friends, setFriends] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [dayMeetings, setDayMeetings] = useState([]);
    
    // New meeting form state
    const [selectedFriend, setSelectedFriend] = useState('');
    const [topic, setTopic] = useState('');
    const [date, setDate] = useState('');
    const [duration, setDuration] = useState(30);
    const navigate = useNavigate();

    const fetchMeetings = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL ;
            const res = await axios.get(`${API_URL}/api/meetings`, {
                headers: { 'x-auth-token': token }
            });
            if (res.data.success) {
                setMeetings(res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch scheduling data', err);
        }
    };

    useEffect(() => {
        const fetchFriends = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL ;
                const resProfile = await axios.get(`${API_URL}/api/profile`, {
                    headers: { 'x-auth-token': token }
                });
                setFriends(resProfile.data.friends || []);
            } catch (err) {
                console.error('Failed to fetch friends data', err);
            }
        };
        if (token) {
            fetchMeetings();
            fetchFriends();
        }
    }, [token]);

    // Update day meetings when selected date or all meetings change
    useEffect(() => {
        const filtered = meetings.filter(m => isSameDay(parseISO(m.date), selectedDate));
        setDayMeetings(filtered);
    }, [selectedDate, meetings]);

    const handleDateClick = (value) => {
        setSelectedDate(value);
    };

    const handleRequestMeeting = async (e) => {
        e.preventDefault();
        try {
            const API_URL = import.meta.env.VITE_API_URL ;
            // Combine selectedDate (date part) and time from the input if we wanted, 
            // but the input is datetime-local, so it has both.
            const res = await axios.post(`${API_URL}/api/meetings`, {
                recipientId: selectedFriend,
                topic,
                date,
                duration
            }, {
                headers: { 'x-auth-token': token }
            });
            if (res.data.success) {
                setMeetings(prev => [...prev, res.data.data]);
                setShowModal(false);
                setTopic('');
                setDate('');
                setSelectedFriend('');
                setDuration(30);
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to request meeting');
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            const API_URL = import.meta.env.VITE_API_URL ;
            const res = await axios.put(`${API_URL}/api/meetings/${id}`, { status }, {
                headers: { 'x-auth-token': token }
            });
            if (res.data.success) {
                setMeetings(prev => prev.map(m => m._id === id ? res.data.data : m));
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status');
        }
    };

    const handleCancelMeeting = async (id) => {
        const reason = prompt('Reason for cancellation:');
        if (reason === null) return;
        try {
            const API_URL = import.meta.env.VITE_API_URL ;
            const res = await axios.post(`${API_URL}/api/meetings/${id}/cancel`, { reason }, {
                headers: { 'x-auth-token': token }
            });
            if (res.data.success) {
                setMeetings(prev => prev.map(m => m._id === id ? res.data.data : m));
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to cancel meeting');
        }
    };

    // Render meeting dots on calendar days
    const tileContent = ({ date, view }) => {
        if (view === 'month') {
            const dayMtgs = meetings.filter(m => isSameDay(parseISO(m.date), date) && m.status !== 'cancelled' && m.status !== 'rejected');
            if (dayMtgs.length > 0) {
                return (
                    <div className="meeting-indicator-container">
                        {dayMtgs.slice(0, 3).map(m => (
                            <div key={m._id} className={`meeting-dot ${m.status}`} title={m.topic}></div>
                        ))}
                        {dayMtgs.length > 3 && <div className="text-xs font-bold text-gray-500 leading-none">+{dayMtgs.length - 3}</div>}
                    </div>
                );
            }
        }
        return null;
    };

    const canJoinMeeting = (meeting) => {
        if (meeting.status !== 'accepted') return false;
        const mtgTime = parseISO(meeting.date).getTime();
        const now = Date.now();
        const tenMinsBefore = mtgTime - (10 * 60 * 1000);
        const endTime = mtgTime + (meeting.duration * 60 * 1000);
        // Active between 10 mins before start and the scheduled end time
        return now >= tenMinsBefore && now <= endTime;
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Meeting Schedule</h1>
                    <p className="text-gray-500 mt-1">Manage your sessions, track attendance, and join rooms.</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-lg shadow-md hover:bg-blue-700 font-medium transition-colors"
                >
                    + Schedule Meeting
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Calendar Column */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <Calendar 
                            onChange={handleDateClick} 
                            value={selectedDate} 
                            tileContent={tileContent}
                            className="react-calendar custom-calendar"
                        />
                    </div>

                    {/* Upcoming Meetings Overview */}
                    <div className="mt-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">All Upcoming Meetings</h2>
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                            {meetings.filter(m => new Date(m.date) >= new Date() && !['cancelled', 'rejected'].includes(m.status)).length === 0 ? (
                                <p className="p-6 text-gray-500 text-center">No upcoming meetings.</p>
                            ) : (
                                <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                                    {meetings
                                        .filter(m => new Date(m.date) >= new Date() && !['cancelled', 'rejected'].includes(m.status))
                                        .sort((a,b) => new Date(a.date) - new Date(b.date))
                                        .map(m => (
                                        <li key={m._id} className="p-4 hover:bg-gray-50 flex justify-between items-center transition-colors">
                                            <div>
                                                <p className="font-semibold text-gray-900">{m.topic}</p>
                                                <p className="text-sm text-gray-500">{new Date(m.date).toLocaleString()} • {m.duration} min</p>
                                            </div>
                                            <div>
                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                    ${m.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {m.status.toUpperCase()}
                                                </span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                {/* Daily Agenda Column */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
                        <div className="p-6 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                            <h2 className="text-xl font-bold text-gray-900">Agenda</h2>
                            <p className="text-sm text-gray-500">{selectedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                        <div className="p-6 flex-1 overflow-y-auto">
                            {dayMeetings.length === 0 ? (
                                <div className="text-center text-gray-500 py-10">
                                    <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p>No meetings scheduled for this day.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {dayMeetings.map(meeting => {
                                        const isHost = meeting.requester._id === user?.id; // Assuming user context has id
                                        const otherPerson = isHost ? meeting.recipient.name : meeting.requester.name;

                                        return (
                                            <div key={meeting._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-bold text-gray-900 line-clamp-1" title={meeting.topic}>{meeting.topic}</h3>
                                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full 
                                                        ${meeting.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                                                          meeting.status === 'rejected' || meeting.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                                                          meeting.status === 'completed' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                        {meeting.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-1">
                                                    <span className="font-medium">Time:</span> {new Date(meeting.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ({meeting.duration} min)
                                                </p>
                                                <p className="text-sm text-gray-600 mb-4">
                                                    <span className="font-medium">With:</span> {otherPerson}
                                                </p>
                                                
                                                {/* Action Buttons */}
                                                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                                                    {meeting.status === 'pending' && !isHost && (
                                                        <>
                                                            <button onClick={() => handleUpdateStatus(meeting._id, 'accepted')} className="flex-1 bg-green-50 text-green-700 px-3 py-1.5 rounded text-sm font-medium hover:bg-green-100 transition-colors">Accept</button>
                                                            <button onClick={() => handleUpdateStatus(meeting._id, 'rejected')} className="flex-1 bg-red-50 text-red-700 px-3 py-1.5 rounded text-sm font-medium hover:bg-red-100 transition-colors">Reject</button>
                                                        </>
                                                    )}
                                                    {meeting.status === 'pending' && isHost && (
                                                        <button onClick={() => handleCancelMeeting(meeting._id)} className="w-full bg-gray-100 text-gray-700 px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-200 transition-colors">Cancel Request</button>
                                                    )}
                                                    {meeting.status === 'accepted' && (
                                                        <>
                                                            {canJoinMeeting(meeting) ? (
                                                                <button onClick={() => navigate(`/video-call?meetingId=${meeting.meetingId}`)} className="flex-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium shadow-sm hover:bg-blue-700 transition-colors">
                                                                    Join Room
                                                                </button>
                                                            ) : (
                                                                <button disabled className="flex-1 bg-gray-100 text-gray-400 px-3 py-1.5 rounded text-sm font-medium cursor-not-allowed" title="Join becomes active 10 mins before start">
                                                                    Join (Starts soon)
                                                                </button>
                                                            )}
                                                            {isHost && (
                                                                <button onClick={() => handleCancelMeeting(meeting._id)} className="flex-1 bg-red-50 text-red-700 px-3 py-1.5 rounded text-sm font-medium hover:bg-red-100 transition-colors">Cancel</button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Schedule Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md transform transition-all">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Schedule a Session</h2>
                        <form onSubmit={handleRequestMeeting}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Friend</label>
                                <select 
                                    required 
                                    value={selectedFriend}
                                    onChange={(e) => setSelectedFriend(e.target.value)}
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border"
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
                                    placeholder="e.g. Code Review Session"
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border"
                                />
                            </div>
                            <div className="mb-4 grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                                    <input 
                                        type="datetime-local" 
                                        required 
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                                    <input 
                                        type="number" 
                                        min="15"
                                        step="15"
                                        required 
                                        value={duration}
                                        onChange={(e) => setDuration(parseInt(e.target.value))}
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-8">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">Cancel</button>
                                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium shadow-sm hover:bg-blue-700 transition-colors">Send Request</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Schedule;
