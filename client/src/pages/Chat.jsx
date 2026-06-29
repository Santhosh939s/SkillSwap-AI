import { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Chat = () => {
    const { token } = useContext(AuthContext);
    const [friends, setFriends] = useState([]);
    const [activeFriend, setActiveFriend] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMsg, setInputMsg] = useState('');
    const [userId, setUserId] = useState(null);
    const ws = useRef(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Fetch profile to get friends and my user ID
        const fetchProfile = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                const res = await axios.get(`${API_URL}/api/profile`, {
                    headers: { 'x-auth-token': token }
                });
                setFriends(res.data.friends || []);
                setUserId(res.data._id);
            } catch (err) {
                console.error('Failed to load friends');
            }
        };
        if (token) fetchProfile();
    }, [token]);

    useEffect(() => {
        if (!token) return;

        // Connect to WebSocket using native WS API (backward compatible)
        const WS_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/^http/, 'ws');
        ws.current = new WebSocket(`${WS_URL}?token=${token}`);

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'chat') {
                // Only add if we are currently chatting with this sender
                setMessages(prev => {
                    // Check if message belongs to current active chat
                    if (activeFriend && (data.from === activeFriend._id || data.to === activeFriend._id)) {
                        return [...prev, data];
                    }
                    return prev; // Ignore or show unread marker in real app
                });
            }
        };

        return () => {
            if (ws.current) ws.current.close();
        };
    }, [token, activeFriend]);

    // Fetch message history when friend is selected
    useEffect(() => {
        const fetchMessages = async () => {
            if (!activeFriend) return;
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                const res = await axios.get(`${API_URL}/api/messages/${activeFriend._id}`, {
                    headers: { 'x-auth-token': token }
                });
                setMessages(res.data);
            } catch (err) {
                console.error('Failed to load messages');
            }
        };
        fetchMessages();
    }, [activeFriend, token]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!inputMsg.trim() || !activeFriend || !ws.current) return;

        const msgData = {
            type: 'chat',
            to: activeFriend._id,
            content: inputMsg,
            from: userId
        };

        // Optimistically add to UI
        setMessages(prev => [...prev, msgData]);
        
        // Send via WS
        ws.current.send(JSON.stringify(msgData));
        setInputMsg('');
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 h-[calc(100vh-80px)]">
            <div className="bg-white rounded-lg shadow h-full flex overflow-hidden border">
                
                {/* Friends List (Sidebar) */}
                <div className="w-1/3 border-r bg-gray-50 flex flex-col">
                    <div className="p-4 border-b bg-white">
                        <h2 className="text-lg font-bold text-gray-800">Messages</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {friends.length === 0 ? (
                            <p className="text-gray-500 text-center mt-6 text-sm">No friends yet. Head to the community to connect!</p>
                        ) : (
                            friends.map(friend => (
                                <button 
                                    key={friend._id}
                                    onClick={() => setActiveFriend(friend)}
                                    className={`w-full text-left p-4 border-b hover:bg-gray-100 transition-colors flex items-center ${activeFriend?._id === friend._id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                                >
                                    <div className="h-10 w-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold mr-3">
                                        {friend.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">{friend.name}</div>
                                        <div className="text-xs text-gray-500 truncate">{friend.skillsKnown.join(', ')}</div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="w-2/3 flex flex-col bg-white">
                    {activeFriend ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b bg-white flex items-center shadow-sm z-10">
                                <div className="h-10 w-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold mr-3">
                                    {activeFriend.name.charAt(0).toUpperCase()}
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">{activeFriend.name}</h3>
                            </div>

                            {/* Messages List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                                {messages.map((msg, idx) => {
                                    const isMe = msg.from === userId;
                                    return (
                                        <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] rounded-lg px-4 py-2 ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border text-gray-800 rounded-bl-none shadow-sm'}`}>
                                                <p>{msg.content}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Form */}
                            <form onSubmit={sendMessage} className="p-4 border-t bg-white flex gap-2">
                                <input 
                                    type="text" 
                                    value={inputMsg}
                                    onChange={(e) => setInputMsg(e.target.value)}
                                    placeholder="Type a message..." 
                                    className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button type="submit" className="bg-blue-600 text-white rounded-full px-6 py-2 font-medium hover:bg-blue-700 transition-colors">
                                    Send
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                            <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            <p>Select a friend from the left sidebar to start chatting</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Chat;
