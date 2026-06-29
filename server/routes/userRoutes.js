const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

router.get('/profile', auth, userController.getProfile);
router.get('/matches', auth, userController.getMatches);
router.get('/users', auth, userController.getUsers);
router.post('/friends/request/:id', auth, userController.sendFriendRequest);
router.post('/friends/accept/:id', auth, userController.acceptFriendRequest);
router.get('/notifications', auth, userController.getNotifications);
router.put('/notifications/read', auth, userController.markNotificationsRead);
router.put('/profile/visibility', auth, userController.updateVisibility);

module.exports = router;
