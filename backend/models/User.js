const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    skillsKnown: [{ type: String }],
    skillsWanted: [{ type: String }],
    location: { lat: Number, lng: Number },
    profilePicture: { type: String, default: 'https://via.placeholder.com/150' },
    securityQuestion: { type: String, required: true },
    securityAnswer: { type: String, required: true },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reviews: [{
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating: Number,
        comment: String
    }],
    activityLog: [{
        action: String,
        timestamp: { type: Date, default: Date.now }
    }],
    notifications: [{
        type: { type: String }, // e.g. 'friendRequest', 'message'
        message: String,
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now },
    // Phase 13: Learning Tracker
    totalXP: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date },
    // Phase 15: Gamification Leaderboards
    leaderboardVisibility: { type: String, enum: ['Private', 'Friends', 'Global'], default: 'Private' },
    // Phase 16: Admin Architecture
    role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    refreshToken: { type: String }
});

module.exports = mongoose.model('User', userSchema);
