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
        if (!recipient.friendRequests.includes(req.user.id)) {
            recipient.friendRequests.push(req.user.id);
            await recipient.save();
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
            await requester.save();
        }

        res.json({ msg: 'Friend added' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
