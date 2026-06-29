// Load environment variables
require('dotenv').config();

// Import Dependencies
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const cors = require('cors');

// Import modular architecture components
const connectDB = require('./config/db');
const User = require('./models/User');
const Message = require('./models/Message');
const auth = require('./middleware/auth');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const meetingRoutes = require('./routes/meetingRoutes');

// Initialize App
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

// Middleware
app.use(cors());
app.use(express.json());
// Serve static files from parent directory where html files currently reside
app.use(express.static(path.join(__dirname, '..')));

// --- Database Connection ---
connectDB();

// --- WebSocket (Chat & Signaling) ---
const clients = new Map(); // id -> ws
const rooms = new Map();   // roomId -> Set<ws>
app.set('wsClients', clients);
app.set('wsRooms', rooms);

wss.on('connection', (ws, req) => {
    const token = req.url.split('token=')[1];
    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            clients.set(decoded.id, ws);
            console.log(`WebSocket Client connected for user: ${decoded.id}`);

            ws.on('message', message => {
                const data = JSON.parse(message);
                
                // Legacy point-to-point chat
                if (data.type === 'chat') {
                    const recipientWs = clients.get(data.to);
                    if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
                        recipientWs.send(JSON.stringify(data));
                    }
                    Message.create({ from: decoded.id, to: data.to, content: data.content });
                }
                
                // Room join
                if (data.type === 'join-room') {
                    const roomId = data.roomId;
                    if (!rooms.has(roomId)) rooms.set(roomId, new Set());
                    rooms.get(roomId).add(ws);
                    ws.roomId = roomId; // Tag the socket
                    
                    // Notify others in room
                    rooms.get(roomId).forEach(client => {
                        if (client !== ws && client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({ type: 'room-user-joined', userId: decoded.id }));
                        }
                    });
                }
                
                // Room chat
                if (data.type === 'room-chat') {
                    if (ws.roomId && rooms.has(ws.roomId)) {
                        rooms.get(ws.roomId).forEach(client => {
                            if (client !== ws && client.readyState === WebSocket.OPEN) {
                                client.send(JSON.stringify(data));
                            }
                        });
                    }
                }
                
                // Legacy & Room WebRTC Signaling
                if (data.type === 'webrtc-signal') {
                    if (data.roomId && rooms.has(data.roomId)) {
                        // Room-based signaling
                        rooms.get(data.roomId).forEach(client => {
                            if (client !== ws && client.readyState === WebSocket.OPEN) {
                                client.send(JSON.stringify({ type: 'webrtc-signal', from: decoded.id, signal: data.signal }));
                            }
                        });
                    } else if (data.to) {
                        // Legacy point-to-point signaling
                        const recipientWs = clients.get(data.to);
                        if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
                            recipientWs.send(JSON.stringify({ type: 'webrtc-signal', from: decoded.id, signal: data.signal }));
                        }
                    }
                }
            });

            ws.on('close', () => {
                clients.delete(decoded.id);
                if (ws.roomId && rooms.has(ws.roomId)) {
                    rooms.get(ws.roomId).delete(ws);
                    rooms.get(ws.roomId).forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({ type: 'room-user-left', userId: decoded.id }));
                        }
                    });
                    if (rooms.get(ws.roomId).size === 0) rooms.delete(ws.roomId);
                }
                console.log(`WebSocket Client disconnected for user: ${decoded.id}`);
            });
        } catch (error) {
            ws.close();
        }
    } else {
        ws.close();
    }
});

// --- API Routes ---

// Use Modular Routes
app.use('/', authRoutes); // mounts /register and /login
app.use('/api', userRoutes); // mounts /api/profile and /api/matches
app.use('/api/meetings', meetingRoutes);

// Legacy Routes (To be migrated in future phases)

app.get('/api/messages/:friendId', auth, async (req, res) => {
    try {
        const friendId = req.params.friendId;
        const userId = req.user.id;
        const messages = await Message.find({
            $or: [{ from: userId, to: friendId }, { from: friendId, to: userId }]
        }).sort({ timestamp: 1 });
        res.json(messages);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

app.post('/forgot-password/question', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.json({ securityQuestion: user.securityQuestion });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

app.post('/forgot-password/reset', async (req, res) => {
    try {
        const { email, securityAnswer, newPassword } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const isAnswerMatch = await bcrypt.compare(securityAnswer.toLowerCase(), user.securityAnswer);
        if (!isAnswerMatch) return res.status(400).json({ msg: 'Incorrect answer to security question' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();
        res.json({ msg: 'Password has been reset successfully' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// --- Final Setup ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));