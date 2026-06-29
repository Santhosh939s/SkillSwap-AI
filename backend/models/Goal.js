const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    targetHours: { type: Number, required: true },
    currentHours: { type: Number, default: 0 },
    type: { type: String, enum: ['Daily', 'Weekly', 'Monthly', 'Total'], required: true },
    status: { type: String, enum: ['Active', 'Completed'], default: 'Active' },
    skillCategory: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Goal', goalSchema);
