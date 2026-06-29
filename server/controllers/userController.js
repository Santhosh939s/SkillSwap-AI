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
