const Assessment = require('../models/Assessment');
const AssessmentQuestion = require('../models/AssessmentQuestion');
const AssessmentAttempt = require('../models/AssessmentAttempt');
const VerifiedBadge = require('../models/VerifiedBadge');
const User = require('../models/User');

exports.getAssessments = async (req, res) => {
    try {
        const assessments = await Assessment.find({ isPublished: true }).sort('-createdAt');
        res.json({ success: true, data: assessments });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.startAssessment = async (req, res) => {
    try {
        const assessmentId = req.params.id;
        const assessment = await Assessment.findById(assessmentId);
        
        if (!assessment || !assessment.isPublished) {
            return res.status(404).json({ success: false, message: 'Assessment not found' });
        }

        // Check retry rules: max 3 attempts per day
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const attemptsToday = await AssessmentAttempt.countDocuments({
            user: req.user.id,
            assessmentId,
            createdAt: { $gte: today }
        });

        if (attemptsToday >= 3) {
            return res.status(403).json({ success: false, message: 'Maximum attempts reached for today. Try again tomorrow.' });
        }

        // Fetch questions and randomize them
        const questions = await AssessmentQuestion.find({ assessmentId }).lean();
        
        // Randomize questions
        questions.sort(() => Math.random() - 0.5);

        // Remove correct answers and randomize options before sending to client
        const safeQuestions = questions.map(q => {
            const safeQ = { ...q };
            delete safeQ.correctAnswers;
            delete safeQ.explanation; // Hide explanation during quiz
            if (safeQ.options && safeQ.options.length > 0) {
                safeQ.options.sort(() => Math.random() - 0.5); // Randomize options
            }
            return safeQ;
        });

        res.json({ 
            success: true, 
            data: {
                assessment,
                questions: safeQuestions
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.submitAssessment = async (req, res) => {
    try {
        const assessmentId = req.params.id;
        const { answers, timeTaken } = req.body; // answers is array of { questionId, userAnswers: [] }

        const assessment = await Assessment.findById(assessmentId);
        if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found' });

        const questions = await AssessmentQuestion.find({ assessmentId });
        
        let totalPoints = 0;
        let earnedPoints = 0;
        const gradedAnswers = [];

        // Grade each answer
        questions.forEach(q => {
            totalPoints += q.points;
            
            const userAnswerEntry = answers.find(a => a.questionId.toString() === q._id.toString());
            const userAnswers = userAnswerEntry ? userAnswerEntry.userAnswers : [];
            
            // Check if userAnswers matches correctAnswers exactly
            const isCorrect = 
                userAnswers.length === q.correctAnswers.length &&
                userAnswers.every(val => q.correctAnswers.includes(val));

            if (isCorrect) {
                earnedPoints += q.points;
            }

            gradedAnswers.push({
                questionId: q._id,
                userAnswers,
                isCorrect
            });
        });

        const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
        const passed = percentage >= assessment.passPercentage;
        const xpEarned = passed ? 100 + Math.round(percentage) : 10; // Basic XP formula

        // Create attempt record
        const attempt = new AssessmentAttempt({
            user: req.user.id,
            assessmentId,
            score: earnedPoints,
            percentage,
            passed,
            xpEarned,
            timeTaken,
            answers: gradedAnswers
        });
        await attempt.save();

        let badge = null;
        if (passed) {
            // Check if user already has this badge
            const existingBadge = await VerifiedBadge.findOne({ user: req.user.id, assessmentId });
            if (!existingBadge) {
                badge = new VerifiedBadge({
                    user: req.user.id,
                    assessmentId,
                    name: `Verified ${assessment.skill}`,
                    skill: assessment.skill,
                    difficulty: assessment.difficulty,
                    description: `Passed the ${assessment.title} assessment with a score of ${percentage.toFixed(1)}%`,
                    verificationId: `VER-${Date.now()}-${req.user.id.toString().substring(0, 5)}`
                });
                await badge.save();
                
                // Add XP to user
                await User.findByIdAndUpdate(req.user.id, { $inc: { totalXP: xpEarned } });
            }
        }

        res.json({
            success: true,
            data: {
                attempt,
                badgeAwarded: badge,
                message: passed ? 'Congratulations! You passed.' : 'Keep learning and try again!'
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getUserBadges = async (req, res) => {
    try {
        const badges = await VerifiedBadge.find({ user: req.user.id }).sort('-issueDate');
        res.json({ success: true, data: badges });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
