import { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';

const Chat = () => {
    const { token } = useContext(AuthContext);
    const { ws } = useContext(NotificationContext);
    const [friends, setFriends] = useState([]);
    const [activeFriend, setActiveFriend] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMsg, setInputMsg] = useState('');
    const [userId, setUserId] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Fetch profile to get friends and my user ID
        const fetchProfile = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL ;
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
        if (!token || !ws) return;

        const handleMessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'chat') {
                setMessages(prev => {
                    if (activeFriend && (data.from === activeFriend._id || data.to === activeFriend._id)) {
                        return [...prev, data];
                    }
                    return prev;
                });
            }
        };

        ws.addEventListener('message', handleMessage);

        return () => {
            ws.removeEventListener('message', handleMessage);
        };
    }, [token, activeFriend, ws]);

    // Fetch message history when friend is selected
    useEffect(() => {
        const fetchMessages = async () => {
            if (!activeFriend) return;
            try {
                const API_URL = import.meta.env.VITE_API_URL ;
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
        ws.send(JSON.stringify(msgData));
        setInputMsg('');
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 h-[calc(100vh-80px)]">
            <div className="bg-card border border-border shadow-xl rounded-2xl h-full flex overflow-hidden">
                
                {/* Friends List (Sidebar) */}
                <div className="w-1/3 border-r border-border bg-background-secondary flex flex-col">
                    <div className="p-5 border-b border-border bg-card">
                        <h2 className="text-xl font-bold text-text-primary tracking-tight">Messages</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {friends.length === 0 ? (
                            <p className="text-text-muted text-center mt-8 text-sm px-4">No friends yet. Head to the community to connect!</p>
                        ) : (
                            friends.map(friend => (
                                <button 
                                    key={friend._id}
                                    onClick={() => setActiveFriend(friend)}
                                    className={`w-full text-left p-4 border-b border-border/50 hover:bg-card-hover transition-colors flex items-center ${activeFriend?._id === friend._id ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}
                                >
                                    <div className="h-12 w-12 rounded-xl bg-card border border-border flex items-center justify-center text-primary font-bold text-lg mr-4 shadow-sm">
                                        {friend.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="overflow-hidden">
                                        <div className="font-semibold text-text-primary truncate">{friend.name}</div>
                                        <div className="text-xs text-text-muted truncate mt-1">{friend.skillsKnown.join(', ')}</div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="w-2/3 flex flex-col bg-background">
                    {activeFriend ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-border bg-card flex items-center shadow-sm z-10">
                                <div className="h-10 w-10 rounded-xl bg-background-secondary border border-primary/30 flex items-center justify-center text-primary font-bold mr-3 shadow-[0_0_10px_rgba(79,70,229,0.1)]">
                                    {activeFriend.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-text-primary">{activeFriend.name}</h3>
                                </div>
                            </div>

                            {/* Messages List */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {messages.map((msg, idx) => {
                                    const isMe = msg.from === userId;
                                    return (
                                        <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] rounded-2xl px-5 py-3 shadow-sm ${isMe ? 'bg-primary text-white rounded-br-none shadow-primary/20' : 'bg-card border border-border text-text-primary rounded-bl-none'}`}>
                                                <p className="text-sm">{msg.content}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Form */}
                            <form onSubmit={sendMessage} className="p-4 border-t border-border bg-card flex gap-3">
                                <input 
                                    type="text" 
                                    value={inputMsg}
                                    onChange={(e) => setInputMsg(e.target.value)}
                                    placeholder="Type a message..." 
                                    className="flex-1 bg-background-secondary border border-border text-text-primary placeholder-text-muted rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                />
                                <button type="submit" className="bg-primary text-white rounded-xl px-8 py-3 font-medium hover:bg-primary-hover shadow-lg shadow-primary/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary transition-all active:scale-95">
                                    Send
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-text-muted bg-background/50">
                            <div className="w-20 h-20 mb-6 rounded-2xl bg-card border border-border flex items-center justify-center shadow-sm">
                                <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            </div>
                            <p className="font-medium text-text-secondary">Select a conversation</p>
                            <p className="text-sm mt-1">Choose a friend from the sidebar to start chatting</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Chat;
