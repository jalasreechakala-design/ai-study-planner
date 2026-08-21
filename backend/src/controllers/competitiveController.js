const firestoreService = require('../services/firestoreService');

// 1. COMPETITIVE DASHBOARD SUMMARY & COUNTDOWN
exports.getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    // Fetch target exam
    const target = await firestoreService.getUserTargetExam(userId).catch(() => null);

    let examId = target ? target.exam_id || target.examId : '1';
    let targetDate = target && target.target_exam_date ? target.target_exam_date : (target && target.targetExamDate ? target.targetExamDate : new Date(Date.now() + 86400000 * 120).toISOString().split('T')[0]);

    const exam = await firestoreService.getExamById(examId).catch(() => ({ id: examId, title: 'GATE CS & IT', code: 'GATE_CS' })) || { id: examId, title: 'GATE CS & IT', code: 'GATE_CS' };

    // Calculate Countdown
    const examTime = new Date(targetDate).getTime();
    const nowTime = new Date().getTime();
    const diffMs = Math.max(0, examTime - nowTime);

    const daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minsLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    // Roadmap Data
    const roadmap = await firestoreService.getExamRoadmap(examId, userId).catch(() => ({ subjects: [], totalTopics: 0, completedTopics: 0, overallPercentage: 0 }));

    // Quiz & Mock Performance
    const quizResults = await firestoreService.getUserQuizResults(userId).catch(() => []);
    let avgQuizScore = 0;
    if (quizResults && quizResults.length > 0) {
      const totalPct = quizResults.reduce((acc, r) => acc + (Number(r.score) / Number(r.total_questions || r.totalQuestions || 1)) * 100, 0);
      avgQuizScore = Math.round(totalPct / quizResults.length);
    }

    const mockResults = await firestoreService.getUserMockResults(userId).catch(() => []);
    let avgMockScore = 0;
    if (mockResults && mockResults.length > 0) {
      const totalPct = mockResults.reduce((acc, r) => acc + Number(r.percentage || r.score || 0), 0);
      avgMockScore = Math.round(totalPct / mockResults.length);
    }

    // Study Sessions
    const sessionsData = await firestoreService.getUserStudySessions(userId, 'all').catch(() => ({ allSessions: [] }));
    let totalMinutes = 0;
    (sessionsData.allSessions || []).forEach(s => totalMinutes += Number(s.durationMinutes || s.duration_minutes || 0));

    const syllabusCompletionPct = roadmap.overallPercentage || 0;

    return res.json({
      selectedExam: exam,
      targetExamDate: targetDate,
      countdown: {
        days: daysLeft,
        hours: hoursLeft,
        minutes: minsLeft
      },
      syllabusSummary: {
        completionPercentage: syllabusCompletionPct,
        totalTopics: roadmap.totalTopics || 0,
        completedTopics: roadmap.completedTopics || 0,
        inProgressTopics: 0,
        pendingTopics: (roadmap.totalTopics || 0) - (roadmap.completedTopics || 0)
      },
      performance: {
        avgQuizScore,
        avgMockScore,
        totalStudyHours: (totalMinutes / 60).toFixed(1),
        overallPreparationPct: Math.round((syllabusCompletionPct * 0.5) + (avgQuizScore * 0.25) + (avgMockScore * 0.25))
      },
      recommendation: {
        recommendedNextTopic: 'TCP/IP Architecture & Protocol Suite',
        weakSubject: 'Computer Networks',
        message: `Focus on revision and practice questions for optimal preparation.`
      }
    });
  } catch (err) {
    console.error('getDashboardSummary Error:', err.message);
    return res.status(500).json({ error: `Failed to load competitive dashboard from Cloud Firestore: ${err.message}` });
  }
};

// 2. EXAM SELECTION & TARGET SETTING
exports.getExams = async (req, res) => {
  try {
    const { search } = req.query;
    let exams = await firestoreService.getExams();

    if (search) {
      const q = search.toLowerCase();
      exams = exams.filter(e => (e.title && e.title.toLowerCase().includes(q)) || (e.category && e.category.toLowerCase().includes(q)) || (e.code && e.code.toLowerCase().includes(q)));
    }

    return res.json({ exams });
  } catch (err) {
    console.error('getExams Error:', err.message);
    return res.status(500).json({ error: `Failed to fetch exams from Cloud Firestore: ${err.message}` });
  }
};

exports.setStudentExamTarget = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const { exam_id, target_exam_date } = req.body;
    if (!exam_id) return res.status(400).json({ error: 'Exam ID is required.' });

    await firestoreService.setTargetExam(userId, exam_id, target_exam_date);
    return res.json({ message: 'Target exam updated successfully in Cloud Firestore!' });
  } catch (err) {
    console.error('setStudentExamTarget Error:', err.message);
    return res.status(500).json({ error: `Failed to set exam target in Cloud Firestore: ${err.message}` });
  }
};

// 3. EXAM ROADMAP & SUBTOPICS
exports.getExamRoadmap = async (req, res) => {
  try {
    const { examId } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const roadmap = await firestoreService.getExamRoadmap(examId, userId);
    const exam = await firestoreService.getExamById(examId).catch(() => null) || { id: examId, title: 'GATE CS & IT' };

    return res.json({
      exam,
      subjects: roadmap.subjects || [],
      totalTopics: roadmap.totalTopics || 0,
      completedTopics: roadmap.completedTopics || 0,
      overallPercentage: roadmap.overallPercentage || 0
    });
  } catch (err) {
    console.error('getExamRoadmap Error:', err.message);
    return res.status(500).json({ error: `Failed to fetch exam roadmap from Cloud Firestore: ${err.message}` });
  }
};

exports.updateTopicProgress = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const { topicId, status } = req.body;
    if (!topicId || !status) {
      return res.status(400).json({ error: 'Topic ID and status are required.' });
    }

    await firestoreService.updateTopicProgress(userId, topicId, status);
    return res.json({ message: 'Topic status updated in Cloud Firestore!' });
  } catch (err) {
    console.error('updateTopicProgress Error:', err.message);
    return res.status(500).json({ error: `Failed to update topic progress in Cloud Firestore: ${err.message}` });
  }
};

// 4. SYLLABUS TRACKER
exports.getSyllabusTracker = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const target = await firestoreService.getUserTargetExam(userId).catch(() => null);
    const examId = target ? target.exam_id || target.examId : '1';

    const roadmap = await firestoreService.getExamRoadmap(examId, userId);

    const subjectBreakdown = (roadmap.subjects || []).map(sub => ({
      subjectTitle: sub.title,
      completionPercentage: sub.completionPercentage || 0,
      totalTopics: sub.topics ? sub.topics.length : 0,
      completedTopics: sub.topics ? sub.topics.filter(t => t.status === 'completed').length : 0
    }));

    return res.json({
      totalTopics: roadmap.totalTopics || 0,
      completed: roadmap.completedTopics || 0,
      inProgress: 0,
      notStarted: (roadmap.totalTopics || 0) - (roadmap.completedTopics || 0),
      overallPercentage: roadmap.overallPercentage || 0,
      subjectBreakdown
    });
  } catch (err) {
    console.error('getSyllabusTracker Error:', err.message);
    return res.status(500).json({ error: `Failed to fetch syllabus tracker from Cloud Firestore: ${err.message}` });
  }
};

// 5. STUDY MATERIALS / LEARNING RESOURCES
exports.getStudyMaterials = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const materials = await firestoreService.getLearningResources(req.query, userId);
    return res.json({ materials, resources: materials });
  } catch (err) {
    console.error('getStudyMaterials Error:', err.message);
    return res.status(500).json({ error: `Failed to fetch learning resources from Cloud Firestore: ${err.message}` });
  }
};

exports.trackMaterialDownload = async (req, res) => {
  try {
    const { id } = req.params;
    await firestoreService.incrementResourceClicks(id);
    return res.json({ message: 'Click count updated in Cloud Firestore.' });
  } catch (err) {
    console.error('trackMaterialDownload Error:', err.message);
    return res.status(500).json({ error: `Failed to track resource click: ${err.message}` });
  }
};

exports.toggleBookmark = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const { material_id } = req.body;
    const result = await firestoreService.toggleBookmark(userId, material_id);
    return res.json(result);
  } catch (err) {
    console.error('toggleBookmark Error:', err.message);
    return res.status(500).json({ error: `Failed to toggle bookmark in Cloud Firestore: ${err.message}` });
  }
};

// 6 & 7. PREVIOUS YEAR QUESTIONS & QUESTION BANK
exports.getPyqs = async (req, res) => {
  try {
    const questions = await firestoreService.getQuestionBank(req.query);
    return res.json({ questions });
  } catch (err) {
    console.error('getPyqs Error:', err.message);
    return res.status(500).json({ error: `Failed to fetch PYQs from Cloud Firestore: ${err.message}` });
  }
};

exports.getQuestionBank = async (req, res) => {
  try {
    const questions = await firestoreService.getQuestionBank(req.query);
    return res.json({ questions });
  } catch (err) {
    console.error('getQuestionBank Error:', err.message);
    return res.status(500).json({ error: `Failed to fetch question bank from Cloud Firestore: ${err.message}` });
  }
};

// 8. QUIZ SYSTEM
exports.getQuizzes = async (req, res) => {
  try {
    const quizzes = await firestoreService.getQuizzes(req.query);
    return res.json({ quizzes });
  } catch (err) {
    console.error('getQuizzes Error:', err.message);
    return res.status(500).json({ error: `Failed to fetch quizzes from Cloud Firestore: ${err.message}` });
  }
};

exports.getQuizDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await firestoreService.getQuizById(id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found.' });

    return res.json({ quiz, questions: quiz.questions || [] });
  } catch (err) {
    console.error('getQuizDetails Error:', err.message);
    return res.status(500).json({ error: `Failed to fetch quiz details from Cloud Firestore: ${err.message}` });
  }
};

exports.submitQuizResult = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const { quiz_id, answers, time_taken_seconds } = req.body;
    const quiz = await firestoreService.getQuizById(quiz_id).catch(() => null) || { total_marks: 10, questions: [] };

    let correctCount = 0;
    const questions = quiz.questions || [];
    const feedback = questions.map(q => {
      const choice = (answers || {})[q.id];
      const isCorrect = choice === (q.correct_option || q.correctOption);
      if (isCorrect) correctCount++;
      return {
        questionId: q.id,
        questionText: q.question_text || q.questionText || '',
        userChoice: choice,
        correctOption: q.correct_option || q.correctOption,
        isCorrect,
        explanation: q.explanation || ''
      };
    });

    const totalQuestions = questions.length || 1;
    const score = ((correctCount / totalQuestions) * Number(quiz.total_marks || 10)).toFixed(2);
    const percentage = Math.round((correctCount / totalQuestions) * 100);

    const savedResult = await firestoreService.saveQuizResult(userId, quiz_id, {
      score: Number(score),
      total_questions: totalQuestions,
      correct_count: correctCount,
      time_taken_seconds: time_taken_seconds || 0,
      percentage
    });

    return res.json({
      message: 'Quiz submitted successfully to Cloud Firestore!',
      score: Number(score),
      totalQuestions,
      correctCount,
      percentage,
      feedback,
      result: savedResult
    });
  } catch (err) {
    console.error('submitQuizResult Error:', err.message);
    return res.status(500).json({ error: `Failed to submit quiz to Cloud Firestore: ${err.message}` });
  }
};

// 9. MOCK TEST SYSTEM
exports.getMockTests = async (req, res) => {
  try {
    const mockTests = await firestoreService.getMockTests(req.query);
    return res.json({ mockTests });
  } catch (err) {
    console.error('getMockTests Error:', err.message);
    return res.status(500).json({ error: `Failed to fetch mock tests from Cloud Firestore: ${err.message}` });
  }
};

exports.submitMockTestResult = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const { mock_test_id, score, total_questions, correct_count } = req.body;
    const mock = await firestoreService.getMockTestById(mock_test_id).catch(() => null) || { passing_score: 50 };

    const percentage = total_questions > 0 ? Math.round((correct_count / total_questions) * 100) : Number(score || 0);
    const passed = percentage >= Number(mock.passing_score || 50);
    const weakSubjects = ['DBMS Normalization', 'TCP Congestion Control'];

    const savedResult = await firestoreService.saveMockTestResult(userId, mock_test_id, {
      score: score || percentage,
      percentage,
      passed,
      weakSubjects
    });

    return res.json({
      message: 'Mock Test submitted to Cloud Firestore!',
      score: score || percentage,
      percentage,
      passed,
      weakSubjects,
      result: savedResult
    });
  } catch (err) {
    console.error('submitMockTestResult Error:', err.message);
    return res.status(500).json({ error: `Failed to submit mock test to Cloud Firestore: ${err.message}` });
  }
};

// 10. COMPETITIVE ANALYTICS
exports.getAnalytics = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const analytics = await firestoreService.getUserAnalytics(userId);
    return res.json(analytics);
  } catch (err) {
    console.error('getAnalytics Error:', err.message);
    return res.status(500).json({ error: `Failed to fetch competitive analytics from Cloud Firestore: ${err.message}` });
  }
};
