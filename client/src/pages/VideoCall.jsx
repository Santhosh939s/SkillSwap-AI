import { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const VideoCall = () => {
    const { token } = useContext(AuthContext);
    const [friends, setFriends] = useState([]);
    const [activeFriend, setActiveFriend] = useState(null);
    const [isCalling, setIsCalling] = useState(false);
    const ws = useRef(null);
    const peerConnection = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const localStream = useRef(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                const res = await axios.get(`${API_URL}/api/profile`, {
                    headers: { 'x-auth-token': token }
                });
                setFriends(res.data.friends || []);
            } catch (err) {
                console.error('Failed to load friends');
            }
        };
        if (token) fetchProfile();
    }, [token]);

    useEffect(() => {
        if (!token) return;

        const WS_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/^http/, 'ws');
        ws.current = new WebSocket(`${WS_URL}?token=${token}`);

        ws.current.onmessage = async (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'webrtc-signal') {
                handleSignalingData(data.signal);
            }
        };

        return () => {
            if (ws.current) ws.current.close();
            if (localStream.current) localStream.current.getTracks().forEach(t => t.stop());
            if (peerConnection.current) peerConnection.current.close();
        };
    }, [token]);

    const setupPeerConnection = () => {
        const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });

        pc.onicecandidate = (event) => {
            if (event.candidate && ws.current && activeFriend) {
                ws.current.send(JSON.stringify({
                    type: 'webrtc-signal',
                    to: activeFriend._id,
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
            ws.current.send(JSON.stringify({
                type: 'webrtc-signal',
                to: activeFriend._id,
                signal: { answer }
            }));
            setIsCalling(true);
        } else if (signal.answer) {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal.answer));
            setIsCalling(true);
        } else if (signal.candidate) {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
    };

    const startCall = async () => {
        if (!activeFriend) return alert('Select a friend to call');
        
        try {
            localStream.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (localVideoRef.current) localVideoRef.current.srcObject = localStream.current;
            
            setupPeerConnection();
            
            const offer = await peerConnection.current.createOffer();
            await peerConnection.current.setLocalDescription(offer);
            
            ws.current.send(JSON.stringify({
                type: 'webrtc-signal',
                to: activeFriend._id,
                signal: { offer }
            }));
        } catch (err) {
            console.error('Error starting video call', err);
            alert('Could not access camera/microphone');
        }
    };

    const endCall = () => {
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        if (localStream.current) {
            localStream.current.getTracks().forEach(t => t.stop());
            localStream.current = null;
        }
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        setIsCalling(false);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Video Call</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[600px]">
                {/* Friend Selection */}
                <div className="md:col-span-1 bg-white shadow rounded-lg p-4 border overflow-y-auto">
                    <h3 className="font-bold text-gray-700 mb-4">Select Friend to Call</h3>
                    {friends.length === 0 ? <p className="text-gray-500 text-sm">No friends available.</p> : friends.map(f => (
                        <button 
                            key={f._id}
                            onClick={() => setActiveFriend(f)}
                            className={`w-full text-left p-3 rounded mb-2 border ${activeFriend?._id === f._id ? 'bg-blue-100 border-blue-500 font-bold' : 'hover:bg-gray-50'}`}
                        >
                            {f.name}
                        </button>
                    ))}
                </div>

                {/* Video Area */}
                <div className="md:col-span-3 bg-gray-900 shadow rounded-lg border relative flex items-center justify-center overflow-hidden">
                    {!activeFriend ? (
                        <p className="text-gray-400">Select a friend to begin.</p>
                    ) : (
                        <div className="w-full h-full relative">
                            {/* Remote Video */}
                            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover bg-black" />
                            
                            {/* Local Video Picture-in-Picture */}
                            <video ref={localVideoRef} autoPlay muted playsInline className="absolute bottom-6 right-6 w-48 h-36 bg-gray-800 border-2 border-white rounded shadow-lg object-cover z-10" />
                            
                            {/* Controls */}
                            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-4 z-20">
                                {!isCalling ? (
                                    <button onClick={startCall} className="bg-green-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-green-700">
                                        Start Call with {activeFriend.name}
                                    </button>
                                ) : (
                                    <button onClick={endCall} className="bg-red-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-red-700">
                                        End Call
                                    </button>
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
