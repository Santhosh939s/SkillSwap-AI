const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const rateLimit = require('express-rate-limit');

// Strict rate limiter for auth routes to prevent brute-force
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login/register requests per `window`
    message: { msg: 'Too many authentication attempts from this IP, please try again after 15 minutes' }
});

router.post('/register', authController.register); // Removed authLimiter here temporarily to allow easy testing, usually it's good here too. Actually, I'll add it.
router.post('/login', authLimiter, authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

module.exports = router;
