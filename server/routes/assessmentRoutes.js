const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const assessmentController = require('../controllers/assessmentController');

router.get('/', auth, assessmentController.getAssessments);
router.get('/:id/start', auth, assessmentController.startAssessment);
router.post('/:id/submit', auth, assessmentController.submitAssessment);
router.get('/badges', auth, assessmentController.getUserBadges);

module.exports = router;
