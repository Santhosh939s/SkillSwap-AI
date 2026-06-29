const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    skill: { type: String, required: true, index: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true, index: true },
    category: { type: String, required: true, index: true },
    passPercentage: { type: Number, default: 80 }, // Configurable passing score
    timeLimit: { type: Number, required: true }, // Time limit in minutes
    isPublished: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Assessment', assessmentSchema);
