const mongoose = require('mongoose');

const assessmentAttemptSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true, index: true },
    score: { type: Number, required: true },
    percentage: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    xpEarned: { type: Number, default: 0 },
    timeTaken: { type: Number, required: true }, // in seconds
    answers: [{
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AssessmentQuestion' },
        userAnswers: [{ type: String }],
        isCorrect: { type: Boolean }
    }]
}, { timestamps: true });

module.exports = mongoose.model('AssessmentAttempt', assessmentAttemptSchema);
