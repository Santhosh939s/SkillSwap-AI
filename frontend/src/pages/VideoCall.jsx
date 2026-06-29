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
            <div className="min-h-screen bg-background px-4 py-16 text-center">
                <p className="text-text-muted">No meeting ID provided. <a href="/schedule" className="text-primary hover:text-primary-hover underline transition-colors">Go to Schedule</a></p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-text-primary">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary tracking-tight">{meeting ? meeting.topic : 'Loading Meeting...'}</h1>
                        {meeting && <p className="text-text-secondary mt-1">Host: {meeting.requester.name} • Session Active</p>}
                    </div>
                    {isJoined && (
                        <div className="bg-card border border-border text-text-primary px-5 py-2.5 rounded-xl font-mono text-xl shadow-sm flex items-center gap-2">
                            <span className="w-2.5 h-2.5 bg-error rounded-full animate-pulse"></span>
                            {formatTime(timer)}
                        </div>
                    )}
                </div>
                
                <div className={`flex flex-col lg:flex-row gap-6 h-[75vh] ${!isJoined ? 'justify-center items-center' : ''}`}>
                    
                    {/* Video Area */}
                    <div className={`bg-card rounded-2xl shadow-sm border border-border relative overflow-hidden transition-all duration-300 ${isJoined ? 'lg:w-2/3 h-full' : 'w-full max-w-2xl h-[400px]'}`}>
                        {!isJoined ? (
                            <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-background-secondary/50">
                                <div className="w-24 h-24 bg-card border border-border rounded-full flex items-center justify-center mb-6 shadow-lg">
                                    <svg className="w-12 h-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-text-primary mb-3">Ready to join?</h2>
                                <button 
                                    onClick={joinRoom}
                                    disabled={!meeting}
                                    className="mt-4 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-bold py-3.5 px-10 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95"
                                >
                                    {meeting ? 'Join Meeting Now' : 'Loading...'}
                                </button>
                            </div>
                        ) : (
                            <div className="w-full h-full relative bg-[#0F172A]">
                                {/* Remote Video */}
                                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                
                                {/* Local Video (PiP) */}
                                <div className="absolute top-6 right-6 w-48 h-36 bg-background rounded-xl shadow-2xl overflow-hidden border-2 border-primary/50 z-10">
                                    <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                                </div>
                                
                                {/* Controls Overlay */}
                                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex justify-center items-center space-x-6 z-20">
                                    <button onClick={leaveRoom} className="bg-error hover:bg-red-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-colors active:scale-95">
                                        Leave Meeting
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Collaboration Sidebar */}
                    {isJoined && (
                        <div className="lg:w-1/3 h-full bg-card rounded-2xl shadow-sm border border-border flex flex-col overflow-hidden">
                            
                            {/* Tabs */}
                            <div className="flex border-b border-border bg-background-secondary/50">
                                <button onClick={() => setActiveTab('chat')} className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'chat' ? 'border-primary text-primary bg-card' : 'border-transparent text-text-muted hover:text-text-secondary'}`}>Chat</button>
                                <button onClick={() => setActiveTab('files')} className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'files' ? 'border-primary text-primary bg-card' : 'border-transparent text-text-muted hover:text-text-secondary'}`}>Files</button>
                                <button onClick={() => setActiveTab('notes')} className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'notes' ? 'border-primary text-primary bg-card' : 'border-transparent text-text-muted hover:text-text-secondary'}`}>Notes</button>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 overflow-y-auto p-5">
                                
                                {/* CHAT TAB */}
                                {activeTab === 'chat' && (
                                    <div className="h-full flex flex-col">
                                        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
                                            {chatMessages.map((msg, i) => (
                                                <div key={i} className={`flex flex-col ${msg.sender._id === user.id ? 'items-end' : 'items-start'}`}>
                                                    <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] ${msg.sender._id === user.id ? 'bg-primary text-white rounded-br-sm' : 'bg-background-secondary border border-border text-text-primary rounded-bl-sm'}`}>
                                                        <p className="text-sm leading-relaxed">{msg.message}</p>
                                                    </div>
                                                    <span className="text-[10px] font-medium text-text-muted mt-1.5 px-1">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                </div>
                                            ))}
                                            <div ref={chatEndRef} />
                                        </div>
                                        <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-border">
                                            <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type a message..." className="appearance-none flex-1 bg-background-secondary border border-border text-text-primary rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent px-4 py-2.5 transition-all" />
                                            <button type="submit" className="bg-primary text-white rounded-xl p-2.5 w-11 h-11 flex items-center justify-center hover:bg-primary-hover transition-colors shadow-sm active:scale-95">
                                                <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                                            </button>
                                        </form>
                                    </div>
                                )}

                                {/* FILES TAB */}
                                {activeTab === 'files' && (
                                    <div>
                                        <div className="mb-6 p-6 bg-primary/5 rounded-xl border border-primary/20 border-dashed hover:bg-primary/10 transition-colors">
                                            <label className="flex flex-col items-center justify-center cursor-pointer">
                                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                                                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                                                </div>
                                                <span className="text-sm text-primary font-bold">Click to upload a file</span>
                                                <input type="file" className="hidden" onChange={handleFileUpload} />
                                            </label>
                                        </div>
                                        <div className="space-y-3">
                                            {files.length === 0 ? (
                                                <p className="text-center text-text-muted text-sm mt-10 p-6 bg-background-secondary rounded-xl border border-border border-dashed">No files shared yet.</p>
                                            ) : files.map((f, i) => (
                                                <a key={i} href={import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL + f.url : f.url} target="_blank" rel="noreferrer" className="flex items-center p-4 bg-background-secondary rounded-xl border border-border hover:border-primary/50 transition-colors group">
                                                    <div className="w-10 h-10 bg-card rounded-lg border border-border flex items-center justify-center mr-4 group-hover:bg-primary/5 group-hover:border-primary/20 transition-colors">
                                                        <svg className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                                                    </div>
                                                    <div className="flex-1 overflow-hidden">
                                                        <p className="text-sm font-bold text-text-primary truncate group-hover:text-primary transition-colors">{f.filename}</p>
                                                        <p className="text-xs text-text-secondary mt-0.5 font-medium">{new Date(f.timestamp).toLocaleDateString()}</p>
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
                                            <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-accent"></span> Shared Notes (Everyone)
                                            </label>
                                            <textarea 
                                                value={sharedNotes}
                                                onChange={e => { setSharedNotes(e.target.value); autoSaveNotes(e.target.value, undefined); }}
                                                placeholder="Type shared notes here..."
                                                className="appearance-none flex-1 w-full bg-background-secondary border border-border text-text-primary placeholder-text-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent p-4 text-sm resize-none transition-all custom-scrollbar"
                                            />
                                        </div>
                                        <div className="flex-1 flex flex-col">
                                            <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-warning"></span> Personal Notes (Only you)
                                            </label>
                                            <textarea 
                                                value={personalNotes}
                                                onChange={e => { setPersonalNotes(e.target.value); autoSaveNotes(undefined, e.target.value); }}
                                                placeholder="Type private notes here..."
                                                className="appearance-none flex-1 w-full bg-background-secondary border border-border text-text-primary placeholder-text-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-warning focus:border-transparent p-4 text-sm resize-none transition-all custom-scrollbar"
                                            />
                                        </div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted text-center py-2 bg-background-secondary rounded-lg">Notes save automatically</p>
                                    </div>
                                )}

                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoCall;
