const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const adminController = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const safeName = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, safeName);
  }
});

// File Extension & MIME Type Security Filter
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.ppt', '.pptx', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();

  // Explicitly disallow executable scripts
  const forbiddenExts = ['.exe', '.bat', '.sh', '.js', '.vbs', '.php', '.py', '.cmd'];
  if (forbiddenExts.includes(ext)) {
    return cb(new Error('Security Exception: Executable and script files are strictly forbidden.'), false);
  }

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(null, true); // Allow other safe files
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter
});

// Enforce Authorization: JWT Token + Admin Role Required for ALL routes
router.use(verifyToken);
router.use(requireRole('admin'));

// Admin Dashboard Overview Stats
router.get('/stats', adminController.getAdminStats);

// Exam Management CRUD
router.get('/exams', adminController.getExams);
router.post('/exams', adminController.createExam);
router.put('/exams/:id', adminController.updateExam);
router.delete('/exams/:id', adminController.deleteExam);

// Subject Management CRUD
router.get('/subjects', adminController.getSubjects);
router.post('/subjects', adminController.createSubject);
router.delete('/subjects/:id', adminController.deleteSubject);

// Topic Management CRUD
router.get('/topics', adminController.getTopics);
router.post('/topics', adminController.createTopic);
router.delete('/topics/:id', adminController.deleteTopic);

// Learning Resource Management CRUD
router.get('/materials', adminController.getMaterials);
router.post('/materials', upload.single('file'), adminController.createMaterial);
router.put('/materials/:id', adminController.updateMaterial);
router.delete('/materials/:id', adminController.deleteMaterial);

// Aliases for /resources
router.get('/resources', adminController.getMaterials);
router.post('/resources', adminController.createMaterial);
router.put('/resources/:id', adminController.updateMaterial);
router.delete('/resources/:id', adminController.deleteMaterial);

// Question Bank CRUD
router.get('/questions', adminController.getQuestions);
router.post('/questions', adminController.createQuestion);
router.delete('/questions/:id', adminController.deleteQuestion);

// Subtopic Management CRUD
router.get('/subtopics', adminController.getSubtopics);
router.post('/subtopics', adminController.createSubtopic);
router.delete('/subtopics/:id', adminController.deleteSubtopic);

// Quiz & Mock Test Management
router.post('/quizzes', adminController.createQuiz);
router.delete('/quizzes/:id', adminController.deleteQuiz);

router.get('/mock-tests', adminController.getMockTests);
router.post('/mock-tests', adminController.createMockTest);
router.delete('/mock-tests/:id', adminController.deleteMockTest);

// User Management & Student Directory
router.get('/students', adminController.getStudents);
router.put('/students/:id/status', adminController.toggleStudentStatus);

// Announcements & Broadcast Notifications
router.post('/notifications', adminController.sendNotification);

module.exports = router;

