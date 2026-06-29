const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Multer storage setup
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });
const meetingController = require('../controllers/meetingController');

router.get('/', auth, meetingController.getMeetings);
router.post('/', auth, meetingController.requestMeeting);
router.put('/:id', auth, meetingController.updateMeetingStatus);

router.post('/:id/cancel', auth, meetingController.cancelMeeting);
router.put('/:id/reschedule', auth, meetingController.rescheduleMeeting);
router.post('/:id/end', auth, meetingController.endMeeting);

router.post('/:id/join', auth, meetingController.joinMeeting);
router.post('/:id/leave', auth, meetingController.leaveMeeting);

// Collaboration
router.put('/:id/notes', auth, meetingController.updateNotes);
router.post('/:id/files', auth, upload.single('file'), meetingController.uploadFile);
router.get('/:id/files', auth, meetingController.getFiles);

module.exports = router;
