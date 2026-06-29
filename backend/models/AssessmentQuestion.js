const mongoose = require('mongoose');

const assessmentQuestionSchema = new mongoose.Schema({
    assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true, index: true },
    questionText: { type: String, required: true },
    type: { type: String, enum: ['Multiple Choice', 'Multiple Select', 'True/False'], default: 'Multiple Choice' },
    options: [{ type: String }], // The possible answers
    correctAnswers: [{ type: String, required: true }], // Array supports Multiple Select
    explanation: { type: String },
    points: { type: Number, default: 10 },
    tags: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('AssessmentQuestion', assessmentQuestionSchema);
