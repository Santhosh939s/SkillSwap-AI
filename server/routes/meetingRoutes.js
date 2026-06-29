const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const meetingController = require('../controllers/meetingController');

router.get('/', auth, meetingController.getMeetings);
router.post('/', auth, meetingController.requestMeeting);
router.put('/:id', auth, meetingController.updateMeetingStatus);

module.exports = router;
