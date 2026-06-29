const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const progressController = require('../controllers/progressController');

router.post('/log', auth, progressController.logProgress);
router.get('/dashboard', auth, progressController.getDashboardAnalytics);
router.get('/charts', auth, progressController.getChartsData);

router.post('/goals', auth, progressController.createGoal);
router.get('/goals', auth, progressController.getGoals);

module.exports = router;
