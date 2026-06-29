const mongoose = require('mongoose');

const verifiedBadgeSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment' },
    name: { type: String, required: true },
    skill: { type: String, required: true },
    difficulty: { type: String, required: true },
    icon: { type: String, default: '🏆' },
    color: { type: String, default: 'text-yellow-500' },
    description: { type: String },
    issueDate: { type: Date, default: Date.now },
    verificationId: { type: String, unique: true } // Unique ID for external verification
}, { timestamps: true });

module.exports = mongoose.model('VerifiedBadge', verifiedBadgeSchema);
