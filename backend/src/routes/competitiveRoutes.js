const express = require('express');
const router = express.Router();
const competitiveController = require('../controllers/competitiveController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

// Competitive Dashboard
router.get('/dashboard', competitiveController.getDashboardSummary);

// Exam Selection & Targets
router.get('/exams', competitiveController.getExams);
router.post('/target', competitiveController.setStudentExamTarget);

// Syllabus Roadmap & Subtopics
router.get('/roadmap/:examId', competitiveController.getExamRoadmap);
router.post('/topic-progress', competitiveController.updateTopicProgress);
router.get('/syllabus-tracker', competitiveController.getSyllabusTracker);

// Learning Resources & Bookmarks
router.get('/materials', competitiveController.getStudyMaterials);
router.post('/materials/:id/download', competitiveController.trackMaterialDownload);
router.get('/resources', competitiveController.getStudyMaterials);
router.post('/resources/:id/click', competitiveController.trackMaterialDownload);
router.post('/resources/:id/bookmark', competitiveController.toggleBookmark);
router.post('/bookmark', competitiveController.toggleBookmark);

// PYQs & Question Bank
router.get('/pyqs', competitiveController.getPyqs);
router.get('/question-bank', competitiveController.getQuestionBank);

// Quizzes & Timed Tests
router.get('/quizzes', competitiveController.getQuizzes);
router.get('/quizzes/:id', competitiveController.getQuizDetails);
router.post('/quizzes/submit', competitiveController.submitQuizResult);

// Mock Tests
router.get('/mock-tests', competitiveController.getMockTests);
router.post('/mock-tests/submit', competitiveController.submitMockTestResult);

// Competitive Analytics
router.get('/analytics', competitiveController.getAnalytics);

module.exports = router;

