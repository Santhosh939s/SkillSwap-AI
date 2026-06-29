const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    skillCategory: { type: String, required: true, index: true },
    skillName: { type: String, required: true },
    hoursLogged: { type: Number, required: true },
    minutesLogged: { type: Number, required: true },
    sessionDuration: { type: Number, required: true }, // Total duration in minutes
    date: { type: Date, default: Date.now, index: true },
    notes: { type: String },
    tags: [{ type: String }],
    learningStatus: { type: String, enum: ['Learning', 'Completed', 'Paused'], default: 'Learning' },
    visibility: { type: String, enum: ['Private', 'Friends Only', 'Public'], default: 'Private' },
    xpEarned: { type: Number, default: 0 },
    streak: { type: Number, default: 1 }
}, { timestamps: true });

// Optimize for dashboard queries
progressSchema.index({ user: 1, date: -1 });
progressSchema.index({ user: 1, skillCategory: 1 });

module.exports = mongoose.model('Progress', progressSchema);
