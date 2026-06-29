const User = require('../models/User');

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password -securityAnswer')
            .populate('friends', 'name skillsKnown')
            .populate('friendRequests', 'name');
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.getMatches = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        const matches = await User.find({
            _id: { $ne: req.user.id },
            skillsWanted: { $in: currentUser.skillsKnown },
            skillsKnown: { $in: currentUser.skillsWanted }
        }).select('name skillsKnown skillsWanted profilePicture');
        res.json(matches);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('name skillsKnown skillsWanted location profilePicture');
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.sendFriendRequest = async (req, res) => {
    try {
        const recipient = await User.findById(req.params.id);
        const sender = await User.findById(req.user.id);
        
        if (!recipient.friendRequests.includes(req.user.id)) {
            recipient.friendRequests.push(req.user.id);
            
            // Add notification
            const notif = {
                type: 'friendRequest',
                message: `${sender.name} sent you a friend request.`
            };
            recipient.notifications.push(notif);
            
            await recipient.save();

            // Emit real-time notification
            const clients = req.app.get('wsClients');
            if (clients) {
                const recipientWs = clients.get(recipient._id.toString());
                if (recipientWs && recipientWs.readyState === 1) {
                    recipientWs.send(JSON.stringify({ type: 'notification', payload: notif }));
                }
            }
        }
        res.json({ msg: 'Friend request sent' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.acceptFriendRequest = async (req, res) => {
    try {
        const requesterId = req.params.id;
        const currentUser = await User.findById(req.user.id);
        
        if (!currentUser.friends.includes(requesterId)) {
            currentUser.friends.push(requesterId);
        }
        currentUser.friendRequests = currentUser.friendRequests.filter(id => id.toString() !== requesterId);
        await currentUser.save();
        
        const requester = await User.findById(requesterId);
        if (!requester.friends.includes(req.user.id)) {
            requester.friends.push(req.user.id);
            
            const notif = {
                type: 'friendAccept',
                message: `${currentUser.name} accepted your friend request.`
            };
            requester.notifications.push(notif);
            await requester.save();

            const clients = req.app.get('wsClients');
            if (clients) {
                const requesterWs = clients.get(requester._id.toString());
                if (requesterWs && requesterWs.readyState === 1) {
                    requesterWs.send(JSON.stringify({ type: 'notification', payload: notif }));
                }
            }
        }

        res.json({ msg: 'Friend added' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.getNotifications = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('notifications');
        // Return notifications sorted by newest first
        const sortedNotifications = user.notifications.sort((a, b) => b.createdAt - a.createdAt);
        res.json(sortedNotifications);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.markNotificationsRead = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.notifications.forEach(n => n.read = true);
        await user.save();
        res.json({ msg: 'Notifications marked as read' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.updateVisibility = async (req, res) => {
    try {
        const { visibility } = req.body;
        if (!['Private', 'Friends', 'Global'].includes(visibility)) {
            return res.status(400).json({ success: false, message: 'Invalid visibility option' });
        }
        const user = await User.findById(req.user.id);
        user.leaderboardVisibility = visibility;
        await user.save();
        res.json({ success: true, data: user.leaderboardVisibility });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
