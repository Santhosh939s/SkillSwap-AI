const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { authorizeAdmin, authorizeSuperAdmin } = require('../middleware/authAdmin');
const adminController = require('../controllers/adminController');

// All routes require authentication and Admin privileges
router.use(auth, authorizeAdmin);

// Dashboard Analytics
router.get('/metrics', adminController.getMetrics);

// Moderation
router.get('/users', adminController.getUsers);
router.put('/users/:id', adminController.updateUserStatus); // Role & Status updates

module.exports = router;
