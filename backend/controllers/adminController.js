const User = require('../models/User');
const Meeting = require('../models/Meeting');
const AssessmentAttempt = require('../models/AssessmentAttempt');
const VerifiedBadge = require('../models/VerifiedBadge');
const mongoose = require('mongoose');

exports.getMetrics = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        
        // Calculate new users today
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const activeUsersToday = await User.countDocuments({ lastActiveDate: { $gte: startOfToday } });
        
        // Meeting stats
        const totalMeetings = await Meeting.countDocuments();
        const completedMeetings = await Meeting.countDocuments({ status: 'completed' });
        
        // Assessment stats
        const totalAssessmentsTaken = await AssessmentAttempt.countDocuments();
        const passedAssessments = await AssessmentAttempt.countDocuments({ passed: true });
        
        // Badge stats
        const totalBadges = await VerifiedBadge.countDocuments();

        // Calculate total XP across all users
        const xpAggregation = await User.aggregate([
            { $group: { _id: null, totalXP: { $sum: "$totalXP" } } }
        ]);
        const totalXPAwarded = xpAggregation.length > 0 ? xpAggregation[0].totalXP : 0;

        // Dummy data for charts to avoid massive complex aggregations on an empty DB
        // In a real prod env, these would be built via time-series aggregations
        const userGrowthData = [
            { name: 'Mon', users: Math.max(10, totalUsers - 20) },
            { name: 'Tue', users: Math.max(15, totalUsers - 15) },
            { name: 'Wed', users: Math.max(22, totalUsers - 10) },
            { name: 'Thu', users: Math.max(25, totalUsers - 5) },
            { name: 'Fri', users: Math.max(30, totalUsers - 2) },
            { name: 'Sat', users: totalUsers },
            { name: 'Sun', users: totalUsers + 2 },
        ];

        // System Health Placeholders
        const systemHealth = {
            serverStatus: 'Online',
            dbStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
            apiResponseTime: '45ms',
            errorCount: 0
        };

        res.json({
            success: true,
            data: {
                summary: {
                    totalUsers,
                    activeUsersToday,
                    totalMeetings,
                    completedMeetings,
                    totalAssessmentsTaken,
                    passedAssessments,
                    totalBadges,
                    totalXPAwarded
                },
                charts: {
                    userGrowth: userGrowthData
                },
                systemHealth
            }
        });
    } catch (err) {
        console.error('getMetrics error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const { search, role, status, page = 1, limit = 50 } = req.query;
        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        if (role) query.role = role;
        if (status) query.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const users = await User.find(query)
            .select('name email role status createdAt lastActiveDate totalXP')
            .sort('-createdAt')
            .skip(skip)
            .limit(parseInt(limit));
            
        const total = await User.countDocuments(query);

        res.json({
            success: true,
            data: {
                users,
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('getUsers error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, status } = req.body;
        
        // Prevent modifying superadmins unless the requester is a superadmin
        const targetUser = await User.findById(id);
        if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

        const reqUser = await User.findById(req.user.id);

        if (targetUser.role === 'superadmin' && reqUser.role !== 'superadmin') {
            return res.status(403).json({ success: false, message: 'Cannot modify a superadmin account' });
        }

        if (role && ['user', 'admin', 'superadmin'].includes(role)) {
            // Only superadmin can promote to superadmin or admin
            if (reqUser.role !== 'superadmin' && (role === 'admin' || role === 'superadmin')) {
                return res.status(403).json({ success: false, message: 'Superadmin privileges required to assign admin roles' });
            }
            targetUser.role = role;
        }

        if (status && ['active', 'suspended'].includes(status)) {
            targetUser.status = status;
        }

        await targetUser.save();

        res.json({ success: true, message: 'User updated successfully', data: targetUser });
    } catch (err) {
        console.error('updateUserStatus error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
