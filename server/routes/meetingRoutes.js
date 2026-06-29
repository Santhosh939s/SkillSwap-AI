const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const meetingController = require('../controllers/meetingController');

router.get('/', auth, meetingController.getMeetings);
router.post('/', auth, meetingController.requestMeeting);
router.put('/:id', auth, meetingController.updateMeetingStatus);

router.post('/:id/cancel', auth, meetingController.cancelMeeting);
router.put('/:id/reschedule', auth, meetingController.rescheduleMeeting);
router.post('/:id/end', auth, meetingController.endMeeting);

router.post('/:id/join', auth, meetingController.joinMeeting);
router.post('/:id/leave', auth, meetingController.leaveMeeting);

module.exports = router;
