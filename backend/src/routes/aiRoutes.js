const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/recommendations', aiController.getPersonalizedRecommendations);
router.post('/timetable', aiController.generateStudyTimetable);
router.post('/summarize-note', aiController.summarizeNote);
router.post('/generate-quiz', aiController.generatePracticeQuiz);

module.exports = router;
