import { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { useSearchParams, useNavigate } from 'react-router-dom';

const VideoCall = () => {
    const { token, user } = useContext(AuthContext);
    const { ws } = useContext(NotificationContext);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const meetingId = searchParams.get('meetingId');
    const [meeting, setMeeting] = useState(null);
    const [isJoined, setIsJoined] = useState(false);
    
    const peerConnection = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const localStream = useRef(null);
    const [timer, setTimer] = useState(0);

    // Collaboration State
    const [activeTab, setActiveTab] = useState('chat'); // chat, files, notes
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [files, setFiles] = useState([]);
    const [sharedNotes, setSharedNotes] = useState('');
    const [personalNotes, setPersonalNotes] = useState('');
    const chatEndRef = useRef(null);
    const notesTimeout = useRef(null);

    // Fetch meeting details
    useEffect(() => {
        const fetchMeeting = async () => {
            if (!meetingId) return;
            try {
                const API_URL = import.meta.env.VITE_API_URL ;
                const res = await axios.get(`${API_URL}/api/meetings`, { headers: { 'x-auth-token': token } });
                if (res.data.success) {
                    const found = res.data.data.find(m => m.meetingId === meetingId);
                    if (found) {
                        setMeeting(found);
                        setChatMessages(found.chat || []);
                        setFiles(found.files || []);
                        setSharedNotes(found.notes?.shared || '');
                        const pNote = found.notes?.personal?.find(p => p.user === user.id);
                        if (pNote) setPersonalNotes(pNote.content);
                    } else {
                        alert('Meeting not found or unauthorized');
                        navigate('/schedule');
                    }
                }
            } catch (err) {
                console.error(err);
            }
        };
        if (token) fetchMeeting();
    }, [token, meetingId, navigate, user.id]);

    // WebSocket and WebRTC setup
    useEffect(() => {
        if (!token || !ws || !isJoined || !meetingId) return;

        const handleMessage = async (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'room-user-joined') {
                startCallOffer();
            } else if (data.type === 'webrtc-signal') {
                handleSignalingData(data.signal);
            } else if (data.type === 'room-chat') {
                setChatMessages(prev => [...prev, { sender: { _id: data.senderId, name: data.senderName }, message: data.message, timestamp: Date.now() }]);
            }
        };

        ws.addEventListener('message', handleMessage);

        return () => {
            ws.removeEventListener('message', handleMessage);
        };
    }, [token, ws, isJoined, meetingId]);

    // Timer
    useEffect(() => {
        let interval;
        if (isJoined) {
            interval = setInterval(() => setTimer(t => t + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isJoined]);

    // Scroll chat to bottom
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages, activeTab]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const setupPeerConnection = () => {
        const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        pc.onicecandidate = (event) => {
            if (event.candidate && ws && meetingId) {
                ws.send(JSON.stringify({ type: 'webrtc-signal', roomId: meetingId, signal: { candidate: event.candidate } }));
            }
        };
        pc.ontrack = (event) => {
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
        };
        if (localStream.current) {
            localStream.current.getTracks().forEach(track => pc.addTrack(track, localStream.current));
        }
        peerConnection.current = pc;
    };

    const handleSignalingData = async (signal) => {
        if (!peerConnection.current) setupPeerConnection();
        if (signal.offer) {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal.offer));
            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);
            ws.send(JSON.stringify({ type: 'webrtc-signal', roomId: meetingId, signal: { answer } }));
        } else if (signal.answer) {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal.answer));
        } else if (signal.candidate) {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
    };

    const startCallOffer = async () => {
        if (!peerConnection.current) setupPeerConnection();
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        ws.send(JSON.stringify({ type: 'webrtc-signal', roomId: meetingId, signal: { offer } }));
    };

    const joinRoom = async () => {
        if (!meeting) return;
        try {
            const API_URL = import.meta.env.VITE_API_URL ;
            await axios.post(`${API_URL}/api/meetings/${meeting._id}/join`, {}, { headers: { 'x-auth-token': token } });
            localStream.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (localVideoRef.current) localVideoRef.current.srcObject = localStream.current;
            setupPeerConnection();
            ws.send(JSON.stringify({ type: 'join-room', roomId: meetingId }));
            setIsJoined(true);
        } catch (err) {
            console.error(err);
            alert('Failed to join room or access media devices. Make sure meeting is within active window.');
        }
    };

    const leaveRoom = async () => {
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        if (localStream.current) {
            localStream.current.getTracks().forEach(t => t.stop());
            localStream.current = null;
        }
        try {
            const API_URL = import.meta.env.VITE_API_URL ;
            await axios.post(`${API_URL}/api/meetings/${meeting._id}/leave`, {}, { headers: { 'x-auth-token': token } });
        } catch (err) {
            console.error('Failed to log leave attendance', err);
        }
        setIsJoined(false);
        navigate('/schedule');
    };

    // Collaboration Functions
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!chatInput.trim() || !ws) return;
        ws.send(JSON.stringify({
            type: 'room-chat',
            roomId: meetingId,
            senderId: user.id,
            senderName: user.name || 'You', // fallback
            message: chatInput
        }));
        setChatMessages(prev => [...prev, { sender: { _id: user.id, name: 'You' }, message: chatInput, timestamp: Date.now() }]);
        setChatInput('');
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const API_URL = import.meta.env.VITE_API_URL ;
            const res = await axios.post(`${API_URL}/api/meetings/${meeting._id}/files`, formData, {
                headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.success) {
                setFiles(prev => [...prev, res.data.data]);
            }
        } catch (err) {
            alert('Failed to upload file');
        }
    };

    const autoSaveNotes = (shared, personal) => {
        if (notesTimeout.current) clearTimeout(notesTimeout.current);
        notesTimeout.current = setTimeout(async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL ;
                await axios.put(`${API_URL}/api/meetings/${meeting._id}/notes`, { shared, personal }, { headers: { 'x-auth-token': token } });
            } catch (err) {
                console.error('Failed to save notes');
            }
        }, 1000);
    };

    if (!meetingId) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8 text-center">
                <p className="text-gray-500">No meeting ID provided. <a href="/schedule" className="text-blue-600 underline">Go to Schedule</a></p>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{meeting ? meeting.topic : 'Loading Meeting...'}</h1>
                    {meeting && <p className="text-gray-500 mt-1">Host: {meeting.requester.name} • Session Active</p>}
                </div>
                {isJoined && (
                    <div className="bg-gray-900 text-white px-4 py-2 rounded-lg font-mono text-xl shadow">
                        {formatTime(timer)}
                    </div>
                )}
            </div>
            
            <div className={`flex flex-col lg:flex-row gap-6 h-[75vh] ${!isJoined ? 'justify-center items-center' : ''}`}>
                
                {/* Video Area */}
                <div className={`bg-gray-900 rounded-xl shadow-2xl border border-gray-800 relative overflow-hidden transition-all duration-300 ${isJoined ? 'lg:w-2/3 h-full' : 'w-full max-w-2xl h-[400px]'}`}>
                    {!isJoined ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 p-8">
                            <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Ready to join?</h2>
                            <button 
                                onClick={joinRoom}
                                disabled={!meeting}
                                className="mt-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105"
                            >
                                {meeting ? 'Join Meeting Now' : 'Loading...'}
                            </button>
                        </div>
                    ) : (
                        <div className="w-full h-full relative">
                            {/* Remote Video */}
                            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover bg-black" />
                            
                            {/* Local Video (PiP) */}
                            <div className="absolute top-6 right-6 w-48 h-36 bg-gray-900 rounded-xl shadow-2xl overflow-hidden border-2 border-gray-700 z-10">
                                <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                            </div>
                            
                            {/* Controls Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/70 to-transparent flex justify-center items-center space-x-6 z-20">
                                <button onClick={leaveRoom} className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-bold shadow-lg transition-colors">
                                    Leave Meeting
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Collaboration Sidebar */}
                {isJoined && (
                    <div className="lg:w-1/3 h-full bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden">
                        
                        {/* Tabs */}
                        <div className="flex border-b">
                            <button onClick={() => setActiveTab('chat')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'chat' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>Chat</button>
                            <button onClick={() => setActiveTab('files')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'files' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>Files</button>
                            <button onClick={() => setActiveTab('notes')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'notes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>Notes</button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                            
                            {/* CHAT TAB */}
                            {activeTab === 'chat' && (
                                <div className="h-full flex flex-col">
                                    <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                                        {chatMessages.map((msg, i) => (
                                            <div key={i} className={`flex flex-col ${msg.sender._id === user.id ? 'items-end' : 'items-start'}`}>
                                                <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${msg.sender._id === user.id ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border text-gray-800 rounded-bl-sm'}`}>
                                                    <p className="text-sm">{msg.message}</p>
                                                </div>
                                                <span className="text-[10px] text-gray-400 mt-1">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </div>
                                        ))}
                                        <div ref={chatEndRef} />
                                    </div>
                                    <form onSubmit={handleSendMessage} className="flex gap-2">
                                        <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type a message..." className="flex-1 rounded-full border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2 border" />
                                        <button type="submit" className="bg-blue-600 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center hover:bg-blue-700 transition-colors">
                                            <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* FILES TAB */}
                            {activeTab === 'files' && (
                                <div>
                                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100 border-dashed">
                                        <label className="flex flex-col items-center justify-center cursor-pointer">
                                            <svg className="w-8 h-8 text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                                            <span className="text-sm text-blue-700 font-medium">Click to upload a file</span>
                                            <input type="file" className="hidden" onChange={handleFileUpload} />
                                        </label>
                                    </div>
                                    <div className="space-y-3">
                                        {files.length === 0 ? (
                                            <p className="text-center text-gray-500 text-sm mt-8">No files shared yet.</p>
                                        ) : files.map((f, i) => (
                                            <a key={i} href={import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL + f.url : f.url} target="_blank" rel="noreferrer" className="flex items-center p-3 bg-white rounded-lg border hover:shadow-sm transition-shadow">
                                                <svg className="w-8 h-8 text-gray-400 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-sm font-medium text-gray-900 truncate">{f.filename}</p>
                                                    <p className="text-xs text-gray-500">{new Date(f.timestamp).toLocaleDateString()}</p>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* NOTES TAB */}
                            {activeTab === 'notes' && (
                                <div className="space-y-6 h-full flex flex-col">
                                    <div className="flex-1 flex flex-col">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Shared Notes (Everyone)</label>
                                        <textarea 
                                            value={sharedNotes}
                                            onChange={e => { setSharedNotes(e.target.value); autoSaveNotes(e.target.value, undefined); }}
                                            placeholder="Type shared notes here..."
                                            className="flex-1 w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 text-sm resize-none"
                                        />
                                    </div>
                                    <div className="flex-1 flex flex-col">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Personal Notes (Only you)</label>
                                        <textarea 
                                            value={personalNotes}
                                            onChange={e => { setPersonalNotes(e.target.value); autoSaveNotes(undefined, e.target.value); }}
                                            placeholder="Type private notes here..."
                                            className="flex-1 w-full rounded-lg border-gray-300 bg-yellow-50 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 p-3 text-sm resize-none"
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-400 text-center">Notes save automatically</p>
                                </div>
                            )}

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoCall;
