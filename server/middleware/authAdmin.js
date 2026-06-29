const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.authorizeAdmin = async (req, res, next) => {
    try {
        // req.user is set by the standard auth middleware
        const user = await User.findById(req.user.id);
        
        if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
            return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
        }
        
        if (user.status === 'suspended') {
            return res.status(403).json({ success: false, message: 'Account suspended.' });
        }

        next();
    } catch (err) {
        console.error('authAdmin middleware error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.authorizeSuperAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user || user.role !== 'superadmin') {
            return res.status(403).json({ success: false, message: 'Access denied. Superadmin privileges required.' });
        }
        
        if (user.status === 'suspended') {
            return res.status(403).json({ success: false, message: 'Account suspended.' });
        }

        next();
    } catch (err) {
        console.error('authSuperAdmin middleware error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
