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
                    <div className="meeting-indicator-container flex justify-center mt-1 gap-1">
                        {dayMtgs.slice(0, 3).map(m => (
                            <div key={m._id} className={`w-1.5 h-1.5 rounded-full ${m.status === 'accepted' ? 'bg-success' : 'bg-warning'}`} title={m.topic}></div>
                        ))}
                        {dayMtgs.length > 3 && <div className="text-[10px] font-bold text-text-muted leading-none">+{dayMtgs.length - 3}</div>}
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
        <div className="min-h-screen bg-background text-text-primary">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary tracking-tight">Meeting Schedule</h1>
                        <p className="text-text-secondary mt-1">Manage your sessions, track attendance, and join rooms.</p>
                    </div>
                    <button 
                        onClick={() => setShowModal(true)}
                        className="bg-primary text-white px-6 py-3 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-hover font-bold transition-all active:scale-95"
                    >
                        + Schedule Meeting
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Calendar Column */}
                    <div className="lg:col-span-2">
                        <div className="bg-card rounded-2xl shadow-sm p-6 border border-border">
                            {/* We assume custom-calendar in Schedule.css overrides styles for dark mode */}
                            <Calendar 
                                onChange={handleDateClick} 
                                value={selectedDate} 
                                tileContent={tileContent}
                                className="react-calendar custom-calendar"
                            />
                        </div>

                        {/* Upcoming Meetings Overview */}
                        <div className="mt-8">
                            <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-accent"></span> All Upcoming Meetings
                            </h2>
                            <div className="bg-card rounded-2xl shadow-sm overflow-hidden border border-border">
                                {meetings.filter(m => new Date(m.date) >= new Date() && !['cancelled', 'rejected'].includes(m.status)).length === 0 ? (
                                    <p className="p-8 text-text-muted text-center border-dashed border-border border m-4 rounded-xl">No upcoming meetings.</p>
                                ) : (
                                    <ul className="divide-y divide-border max-h-96 overflow-y-auto">
                                        {meetings
                                            .filter(m => new Date(m.date) >= new Date() && !['cancelled', 'rejected'].includes(m.status))
                                            .sort((a,b) => new Date(a.date) - new Date(b.date))
                                            .map(m => (
                                            <li key={m._id} className="p-5 hover:bg-card-hover flex justify-between items-center transition-colors">
                                                <div>
                                                    <p className="font-bold text-text-primary">{m.topic}</p>
                                                    <p className="text-sm text-text-secondary mt-1">{new Date(m.date).toLocaleString()} • {m.duration} min</p>
                                                </div>
                                                <div>
                                                    <span className={`px-3 py-1 inline-flex text-xs font-bold rounded-lg uppercase tracking-wider
                                                        ${m.status === 'accepted' ? 'bg-success/10 text-success border border-success/20' : 'bg-warning/10 text-warning border border-warning/20'}`}>
                                                        {m.status}
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
                        <div className="bg-card rounded-2xl shadow-sm border border-border h-full flex flex-col">
                            <div className="p-6 border-b border-border bg-background-secondary rounded-t-2xl">
                                <h2 className="text-xl font-bold text-text-primary">Agenda</h2>
                                <p className="text-sm text-text-secondary mt-1">{selectedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                            <div className="p-6 flex-1 overflow-y-auto">
                                {dayMeetings.length === 0 ? (
                                    <div className="text-center text-text-muted py-12 border border-border border-dashed rounded-xl h-full flex flex-col items-center justify-center">
                                        <svg className="h-12 w-12 text-text-muted opacity-50 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <p>No meetings scheduled for this day.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {dayMeetings.map(meeting => {
                                            const isHost = meeting.requester._id === user?.id; // Assuming user context has id
                                            const otherPerson = isHost ? meeting.recipient.name : meeting.requester.name;

                                            return (
                                                <div key={meeting._id} className="border border-border rounded-xl p-5 hover:border-primary/50 transition-colors bg-background-secondary shadow-sm">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <h3 className="font-bold text-text-primary line-clamp-1" title={meeting.topic}>{meeting.topic}</h3>
                                                        <span className={`px-2.5 py-1 text-xs font-bold rounded-lg uppercase tracking-wider border
                                                            ${meeting.status === 'accepted' ? 'bg-success/10 text-success border-success/20' : 
                                                              meeting.status === 'rejected' || meeting.status === 'cancelled' ? 'bg-error/10 text-error border-error/20' : 
                                                              meeting.status === 'completed' ? 'bg-background text-text-muted border-border' : 'bg-warning/10 text-warning border-warning/20'}`}>
                                                            {meeting.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-text-secondary mb-1">
                                                        <span className="font-bold text-text-primary">Time:</span> {new Date(meeting.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ({meeting.duration} min)
                                                    </p>
                                                    <p className="text-sm text-text-secondary mb-5">
                                                        <span className="font-bold text-text-primary">With:</span> {otherPerson}
                                                    </p>
                                                    
                                                    {/* Action Buttons */}
                                                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                                                        {meeting.status === 'pending' && !isHost && (
                                                            <>
                                                                <button onClick={() => handleUpdateStatus(meeting._id, 'accepted')} className="flex-1 bg-success/10 text-success border border-success/20 px-3 py-2 rounded-lg text-sm font-bold hover:bg-success hover:text-white transition-all">Accept</button>
                                                                <button onClick={() => handleUpdateStatus(meeting._id, 'rejected')} className="flex-1 bg-error/10 text-error border border-error/20 px-3 py-2 rounded-lg text-sm font-bold hover:bg-error hover:text-white transition-all">Reject</button>
                                                            </>
                                                        )}
                                                        {meeting.status === 'pending' && isHost && (
                                                            <button onClick={() => handleCancelMeeting(meeting._id)} className="w-full bg-card border border-border text-text-primary px-3 py-2 rounded-lg text-sm font-bold hover:bg-card-hover transition-colors">Cancel Request</button>
                                                        )}
                                                        {meeting.status === 'accepted' && (
                                                            <>
                                                                {canJoinMeeting(meeting) ? (
                                                                    <button onClick={() => navigate(`/video-call?meetingId=${meeting.meetingId}`)} className="flex-1 bg-primary text-white px-3 py-2 rounded-lg text-sm font-bold shadow-md shadow-primary/20 hover:bg-primary-hover transition-all active:scale-95">
                                                                        Join Room
                                                                    </button>
                                                                ) : (
                                                                    <button disabled className="flex-1 bg-background-secondary border border-border text-text-muted px-3 py-2 rounded-lg text-sm font-bold cursor-not-allowed" title="Join becomes active 10 mins before start">
                                                                        Starts soon
                                                                    </button>
                                                                )}
                                                                {isHost && (
                                                                    <button onClick={() => handleCancelMeeting(meeting._id)} className="flex-1 bg-error/10 text-error border border-error/20 px-3 py-2 rounded-lg text-sm font-bold hover:bg-error hover:text-white transition-all">Cancel</button>
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
                        <div className="bg-card border border-border rounded-2xl shadow-2xl p-8 w-full max-w-md transform transition-all">
                            <h2 className="text-2xl font-bold text-text-primary mb-6">Schedule a Session</h2>
                            <form onSubmit={handleRequestMeeting}>
                                <div className="mb-5">
                                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Select Friend</label>
                                    <select 
                                        required 
                                        value={selectedFriend}
                                        onChange={(e) => setSelectedFriend(e.target.value)}
                                        className="appearance-none w-full bg-background-secondary border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent p-3 transition-all"
                                    >
                                        <option value="">-- Choose a friend --</option>
                                        {friends.map(f => (
                                            <option key={f._id} value={f._id}>{f.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-5">
                                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Topic</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder="e.g. Code Review Session"
                                        className="appearance-none w-full bg-background-secondary border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent p-3 transition-all"
                                    />
                                </div>
                                <div className="mb-6 grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-text-secondary mb-1.5">Date & Time</label>
                                        <input 
                                            type="datetime-local" 
                                            required 
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="appearance-none w-full bg-background-secondary border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent p-3 transition-all"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-text-secondary mb-1.5">Duration (minutes)</label>
                                        <input 
                                            type="number" 
                                            min="15"
                                            step="15"
                                            required 
                                            value={duration}
                                            onChange={(e) => setDuration(parseInt(e.target.value))}
                                            className="appearance-none w-full bg-background-secondary border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent p-3 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-border">
                                    <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-text-secondary bg-background-secondary border border-border hover:bg-card-hover rounded-xl font-bold transition-colors">Cancel</button>
                                    <button type="submit" className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all active:scale-95">Send Request</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Schedule;
