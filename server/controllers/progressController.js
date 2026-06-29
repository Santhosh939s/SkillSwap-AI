const Progress = require('../models/Progress');
const Goal = require('../models/Goal');
const User = require('../models/User');
const { calculateXP, calculateLevel } = require('../utils/xpEngine');
const mongoose = require('mongoose');

// Helper to calculate streak
const updateStreak = (user) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
    if (lastActive) lastActive.setHours(0, 0, 0, 0);
    
    const diffDays = lastActive ? Math.round((today - lastActive) / (1000 * 60 * 60 * 24)) : -1;
    
    if (diffDays === 1) {
        // Logged consecutive day
        user.currentStreak += 1;
    } else if (diffDays > 1 || diffDays === -1) {
        // Streak broken or first log
        user.currentStreak = 1;
    }
    // If diffDays === 0, they already logged today, streak remains same.

    if (user.currentStreak > user.longestStreak) {
        user.longestStreak = user.currentStreak;
    }
    
    user.lastActiveDate = new Date();
    return user.currentStreak;
};

exports.logProgress = async (req, res) => {
    try {
        const { skillCategory, skillName, hoursLogged, minutesLogged, notes, tags, learningStatus, visibility } = req.body;
        
        if (hoursLogged < 0 || minutesLogged < 0) {
            return res.status(400).json({ success: false, message: 'Invalid time logged' });
        }
        
        const sessionDuration = (parseInt(hoursLogged) * 60) + parseInt(minutesLogged);
        if (sessionDuration <= 0) {
            return res.status(400).json({ success: false, message: 'Duration must be greater than zero' });
        }

        const user = await User.findById(req.user.id);
        
        // Calculate streak and update user's streak fields
        const currentStreak = updateStreak(user);
        
        // Check goals (simplified for brevity: checking if any active goal is hit)
        // In a real app, you'd match the category and update currentHours in Goal
        const activeGoals = await Goal.find({ user: req.user.id, status: 'Active' });
        let goalCompleted = false;
        let goalType = null;
        for (let goal of activeGoals) {
            if (!goal.skillCategory || goal.skillCategory === skillCategory) {
                goal.currentHours += (sessionDuration / 60);
                if (goal.currentHours >= goal.targetHours) {
                    goal.status = 'Completed';
                    goalCompleted = true;
                    goalType = goal.type;
                }
                await goal.save();
            }
        }

        const xpEarned = calculateXP(sessionDuration, currentStreak, goalCompleted, goalType);
        
        user.totalXP += xpEarned;
        user.level = calculateLevel(user.totalXP);
        await user.save();

        const progress = new Progress({
            user: req.user.id,
            skillCategory,
            skillName,
            hoursLogged,
            minutesLogged,
            sessionDuration,
            notes,
            tags,
            learningStatus,
            visibility,
            xpEarned,
            streak: currentStreak
        });

        await progress.save();

        res.json({
            success: true,
            data: {
                progress,
                totalXP: user.totalXP,
                level: user.level,
                currentStreak: user.currentStreak
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getDashboardAnalytics = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('totalXP level currentStreak longestStreak');
        
        const stats = await Progress.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
            { 
                $group: { 
                    _id: null, 
                    totalDuration: { $sum: '$sessionDuration' },
                    skillsLearned: { $addToSet: '$skillName' }
                } 
            }
        ]);
        
        const totalHours = stats.length > 0 ? (stats[0].totalDuration / 60).toFixed(1) : 0;
        const activeSkills = stats.length > 0 ? stats[0].skillsLearned.length : 0;

        const activeGoals = await Goal.find({ user: req.user.id, status: 'Active' });
        const completedGoalsCount = await Goal.countDocuments({ user: req.user.id, status: 'Completed' });

        res.json({
            success: true,
            data: {
                userStats: user,
                totalHours,
                activeSkills,
                activeGoals,
                completedGoalsCount
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getChartsData = async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        // Aggregate session duration per day
        const dailyData = await Progress.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(req.user.id), date: { $gte: startDate } } },
            { 
                $group: { 
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    minutes: { $sum: '$sessionDuration' },
                    xp: { $sum: '$xpEarned' }
                } 
            },
            { $sort: { _id: 1 } }
        ]);

        // Aggregate skills distribution
        const skillDistribution = await Progress.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
            {
                $group: {
                    _id: '$skillCategory',
                    totalMinutes: { $sum: '$sessionDuration' }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                daily: dailyData,
                distribution: skillDistribution
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.createGoal = async (req, res) => {
    try {
        const goal = new Goal({
            user: req.user.id,
            ...req.body
        });
        await goal.save();
        res.json({ success: true, data: goal });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getGoals = async (req, res) => {
    try {
        const goals = await Goal.find({ user: req.user.id });
        res.json({ success: true, data: goals });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
