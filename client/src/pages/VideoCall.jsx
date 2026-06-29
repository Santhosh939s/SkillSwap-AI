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

    // Fetch meeting details
    useEffect(() => {
        const fetchMeeting = async () => {
            if (!meetingId) return;
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                const res = await axios.get(`${API_URL}/api/meetings`, { headers: { 'x-auth-token': token } });
                if (res.data.success) {
                    const found = res.data.data.find(m => m.meetingId === meetingId);
                    if (found) setMeeting(found);
                    else {
                        alert('Meeting not found or unauthorized');
                        navigate('/schedule');
                    }
                }
            } catch (err) {
                console.error(err);
            }
        };
        if (token) fetchMeeting();
    }, [token, meetingId, navigate]);

    // WebSocket and WebRTC setup
    useEffect(() => {
        if (!token || !ws || !isJoined || !meetingId) return;

        const handleMessage = async (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'room-user-joined') {
                // Another user joined, initiate offer if we are the host, or just always initiate?
                // For a 2-person room, the one already there should initiate.
                startCallOffer();
            } else if (data.type === 'webrtc-signal') {
                handleSignalingData(data.signal);
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

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const setupPeerConnection = () => {
        const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });

        pc.onicecandidate = (event) => {
            if (event.candidate && ws && meetingId) {
                ws.send(JSON.stringify({
                    type: 'webrtc-signal',
                    roomId: meetingId,
                    signal: { candidate: event.candidate }
                }));
            }
        };

        pc.ontrack = (event) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
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
            ws.send(JSON.stringify({
                type: 'webrtc-signal',
                roomId: meetingId,
                signal: { answer }
            }));
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
        ws.send(JSON.stringify({
            type: 'webrtc-signal',
            roomId: meetingId,
            signal: { offer }
        }));
    };

    const joinRoom = async () => {
        if (!meeting) return;
        
        try {
            // Validate join window
            const mtgTime = new Date(meeting.date).getTime();
            const now = Date.now();
            const tenMinsBefore = mtgTime - (10 * 60 * 1000);
            const endTime = mtgTime + (meeting.duration * 60 * 1000);
            
            if (now < tenMinsBefore || now > endTime) {
                return alert('Meeting is not currently active.');
            }

            // Register attendance via API
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            await axios.post(`${API_URL}/api/meetings/${meeting._id}/join`, {}, { headers: { 'x-auth-token': token } });
            
            // Get local media
            localStream.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (localVideoRef.current) localVideoRef.current.srcObject = localStream.current;
            
            setupPeerConnection();
            
            // Join WebSocket Room
            ws.send(JSON.stringify({ type: 'join-room', roomId: meetingId }));
            
            setIsJoined(true);
        } catch (err) {
            console.error(err);
            alert('Failed to join room or access media devices.');
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
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            await axios.post(`${API_URL}/api/meetings/${meeting._id}/leave`, {}, { headers: { 'x-auth-token': token } });
        } catch (err) {
            console.error('Failed to log leave attendance', err);
        }

        setIsJoined(false);
        navigate('/schedule');
    };
    
    if (!meetingId) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8 text-center">
                <p className="text-gray-500">No meeting ID provided. <a href="/schedule" className="text-blue-600 underline">Go to Schedule</a></p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{meeting ? meeting.topic : 'Loading Meeting...'}</h1>
                    {meeting && <p className="text-gray-500 mt-1">Host: {meeting.requester.name} • {meeting.duration} minutes</p>}
                </div>
                {isJoined && (
                    <div className="bg-gray-900 text-white px-4 py-2 rounded-lg font-mono text-xl shadow">
                        {formatTime(timer)}
                    </div>
                )}
            </div>
            
            <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 h-[70vh] flex flex-col relative overflow-hidden">
                {!isJoined ? (
                    <div className="flex-1 flex flex-col items-center justify-center bg-gray-800">
                        <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Ready to join?</h2>
                        <p className="text-gray-400 mb-8 max-w-md text-center">Make sure you are in a quiet environment. Your camera and microphone will be activated upon joining.</p>
                        <button 
                            onClick={joinRoom}
                            disabled={!meeting}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105"
                        >
                            {meeting ? 'Join Meeting Now' : 'Loading...'}
                        </button>
                    </div>
                ) : (
                    <div className="flex-1 relative w-full h-full">
                        {/* Remote Video (Main) */}
                        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover bg-black" />
                        
                        {/* Local Video (PiP) */}
                        <div className="absolute bottom-24 right-6 w-64 h-48 bg-gray-900 rounded-xl shadow-2xl overflow-hidden border-2 border-gray-700 z-10">
                            <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                            <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">You</div>
                        </div>
                        
                        {/* Controls Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/70 to-transparent flex justify-center items-center space-x-6 z-20">
                            <button className="bg-gray-800 hover:bg-gray-700 text-white p-4 rounded-full shadow-lg transition-colors" title="Toggle Mute (Not fully implemented yet)">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            </button>
                            <button className="bg-gray-800 hover:bg-gray-700 text-white p-4 rounded-full shadow-lg transition-colors" title="Toggle Video (Not fully implemented yet)">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </button>
                            <button onClick={leaveRoom} className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-bold shadow-lg transition-transform transform hover:scale-105">
                                Leave Meeting
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoCall;
