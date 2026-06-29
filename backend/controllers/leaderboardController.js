const User = require('../models/User');
const VerifiedBadge = require('../models/VerifiedBadge');
const mongoose = require('mongoose');

exports.getLeaderboard = async (req, res) => {
    try {
        const { metric = 'totalXP', scope = 'Global', page = 1, limit = 50 } = req.query;
        const currentUser = await User.findById(req.user.id).populate('friends', '_id');
        
        let matchStage = {};

        // 1. Privacy Scope Filtering
        if (scope === 'Global') {
            // Only include users who have opted in to Global
            matchStage.leaderboardVisibility = 'Global';
        } else if (scope === 'Friends') {
            // Include user's friends who have visibility as Friends or Global, plus the user themselves
            const friendIds = currentUser.friends.map(f => f._id);
            friendIds.push(currentUser._id); // Include self
            matchStage = {
                _id: { $in: friendIds },
                leaderboardVisibility: { $in: ['Friends', 'Global'] }
            };
        } else {
            return res.status(400).json({ success: false, message: 'Invalid scope' });
        }

        // 2. Metric Aggregation
        let pipeline = [];
        pipeline.push({ $match: matchStage });

        if (metric === 'totalXP' || metric === 'currentStreak' || metric === 'longestStreak' || metric === 'level') {
            // Direct fields on User model
            pipeline.push({
                $project: {
                    name: 1,
                    profilePicture: 1,
                    level: 1,
                    [metric]: 1, // dynamically project the requested metric
                    metricValue: `$${metric}` // alias for standard frontend rendering
                }
            });
            pipeline.push({ $sort: { metricValue: -1, _id: 1 } });
        } else if (metric === 'badges') {
            // Needs lookup from VerifiedBadge
            pipeline.push({
                $lookup: {
                    from: 'verifiedbadges', // mongoose collection name is usually pluralized lower case
                    localField: '_id',
                    foreignField: 'user',
                    as: 'badges'
                }
            });
            pipeline.push({
                $project: {
                    name: 1,
                    profilePicture: 1,
                    level: 1,
                    metricValue: { $size: '$badges' }
                }
            });
            pipeline.push({ $sort: { metricValue: -1, _id: 1 } });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid metric' });
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: parseInt(limit) });

        const results = await User.aggregate(pipeline);

        // Find current user's rank if they are in the scope
        // For performance, we can just find their index in the array if it's < 50
        // Or run a count query for their specific metric
        let currentUserRank = null;
        let currentUserData = null;

        if (currentUser.leaderboardVisibility === 'Private') {
            currentUserRank = 'Private';
        } else {
            const userInResults = results.findIndex(u => u._id.toString() === req.user.id);
            if (userInResults !== -1) {
                currentUserRank = skip + userInResults + 1;
                currentUserData = results[userInResults];
            } else {
                // If not in the first page, calculate rank by counting users with higher metric
                // (Omitted here for simplicity in initial implementation, but architecturally supported)
                currentUserRank = '50+'; 
            }
        }

        res.json({
            success: true,
            data: {
                leaderboard: results,
                currentUser: {
                    rank: currentUserRank,
                    data: currentUserData
                }
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
