const express = require('express');
const router = express.Router();
const collegeController = require('../controllers/collegeController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

// Dashboard
router.get('/dashboard', collegeController.getDashboardSummary);

// Tasks
router.get('/tasks', collegeController.getTasks);
router.post('/tasks', collegeController.createTask);
router.put('/tasks/:id', collegeController.updateTask);
router.put('/tasks/:id/status', collegeController.updateTaskStatus);
router.delete('/tasks/:id', collegeController.deleteTask);

// Notes
router.get('/notes', collegeController.getNotes);
router.post('/notes', collegeController.createNote);
router.put('/notes/:id', collegeController.updateNote);
router.delete('/notes/:id', collegeController.deleteNote);

// Attendance
router.get('/attendance', collegeController.getAttendance);
router.post('/attendance', collegeController.addAttendance);
router.put('/attendance/:id', collegeController.updateAttendance);
router.delete('/attendance/:id', collegeController.deleteAttendance);

// CGPA
router.get('/cgpa', collegeController.getCgpaRecords);
router.post('/cgpa', collegeController.addCgpaRecord);
router.put('/cgpa/:id', collegeController.updateCgpaRecord);
router.delete('/cgpa/:id', collegeController.deleteCgpaRecord);

// Goals
router.get('/goals', collegeController.getGoals);
router.post('/goals', collegeController.createGoal);
router.put('/goals/:id', collegeController.updateGoal);
router.delete('/goals/:id', collegeController.deleteGoal);

// Pomodoro & Sessions & Streaks & Analytics
router.post('/study-session', collegeController.logStudySession);
router.get('/streaks-badges', collegeController.getStreaksAndBadges);
router.get('/analytics', collegeController.getStudyAnalytics);

// Subjects
router.get('/subjects', collegeController.getSubjects);
router.post('/subjects', collegeController.createSubject);
router.delete('/subjects/:id', collegeController.deleteSubject);

// Assignments
router.get('/assignments', collegeController.getAssignments);
router.post('/assignments', collegeController.createAssignment);
router.put('/assignments/:id', collegeController.updateAssignment);
router.delete('/assignments/:id', collegeController.deleteAssignment);

// Reminders
router.get('/reminders', collegeController.getReminders);
router.post('/reminders', collegeController.createReminder);
router.delete('/reminders/:id', collegeController.deleteReminder);

module.exports = router;
