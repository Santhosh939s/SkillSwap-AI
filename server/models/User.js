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
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
