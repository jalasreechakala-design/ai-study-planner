const db = require('../config/db');
const firestoreService = require('../services/firestoreService');

// 1. COMPETITIVE DASHBOARD SUMMARY & COUNTDOWN
exports.getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch target exam
    const targetRows = await db.query('SELECT * FROM student_exam_targets WHERE user_id = ?', [userId]);
    let target = targetRows && targetRows.length > 0 ? targetRows[0] : null;

    let examId = target ? target.exam_id : 1;
    let targetDate = target && target.target_exam_date ? target.target_exam_date : new Date(Date.now() + 86400000 * 120).toISOString().split('T')[0];

    const examRows = await db.query('SELECT * FROM exams WHERE id = ?', [examId]);
    const exam = (examRows && examRows.length > 0) ? examRows[0] : { id: 1, title: 'GATE CS & IT', code: 'GATE_CS' };

    // Calculate Countdown
    const examTime = new Date(targetDate).getTime();
    const nowTime = new Date().getTime();
    const diffMs = Math.max(0, examTime - nowTime);

    const daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minsLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    // Fetch Syllabus Progress
    const subjects = await db.query('SELECT * FROM exam_subjects WHERE exam_id = ?', [examId]);
    const topics = await db.query('SELECT * FROM topics', []);
    const userProgress = await db.query('SELECT * FROM user_topic_progress WHERE user_id = ?', [userId]);

    const progressMap = {};
    (userProgress || []).forEach(p => { progressMap[p.topic_id] = p.status; });

    let completedTopicsCount = 0;
    let inProgressTopicsCount = 0;

    (topics || []).forEach(t => {
      const st = progressMap[t.id] || 'not_started';
      if (st === 'completed') completedTopicsCount++;
      else if (st === 'in_progress') inProgressTopicsCount++;
    });

    const pendingTopicsCount = (topics || []).length - completedTopicsCount;
    const syllabusCompletionPct = (topics || []).length > 0 ? Math.round((completedTopicsCount / topics.length) * 100) : 0;

    // Fetch Quiz & Mock Test Performance
    const quizResults = await db.query('SELECT * FROM quiz_results WHERE user_id = ?', [userId]);
    let avgQuizScore = 0;
    if (quizResults && quizResults.length > 0) {
      const totalPct = quizResults.reduce((acc, r) => acc + (Number(r.score) / Number(r.total_questions || 1)) * 100, 0);
      avgQuizScore = Math.round(totalPct / quizResults.length);
    }

    const mockResults = await db.query('SELECT * FROM mock_test_results WHERE user_id = ?', [userId]);
    let avgMockScore = 0;
    if (mockResults && mockResults.length > 0) {
      const totalPct = mockResults.reduce((acc, r) => acc + Number(r.percentage), 0);
      avgMockScore = Math.round(totalPct / mockResults.length);
    }

    // Study Hours
    const sessions = await db.query('SELECT * FROM study_sessions WHERE user_id = ?', [userId]);
    let totalMinutes = 0;
    (sessions || []).forEach(s => totalMinutes += Number(s.duration_minutes));

    // Personalized Recommendation Rule Engine
    let recommendedTopic = 'TCP/IP Architecture & Protocol Suite';
    let weakSubject = 'DBMS';
    let recommendationMsg = `Your ${weakSubject} score is lower than your other subjects. Complete Normalization before attempting the next mock test.`;

    if (pendingTopicsCount > 0) {
      const pendingTop = (topics || []).find(t => (progressMap[t.id] || 'not_started') !== 'completed');
      if (pendingTop) {
        recommendedTopic = pendingTop.title;
        const sub = (subjects || []).find(s => s.id === pendingTop.subject_id);
        if (sub) weakSubject = sub.title;
        recommendationMsg = `${weakSubject} is currently your weakest area (${syllabusCompletionPct}% syllabus complete). Study ${recommendedTopic} today and attempt the recommended quiz.`;
      }
    }

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
        totalTopics: (topics || []).length,
        completedTopics: completedTopicsCount,
        inProgressTopics: inProgressTopicsCount,
        pendingTopics: pendingTopicsCount
      },
      performance: {
        avgQuizScore,
        avgMockScore,
        totalStudyHours: (totalMinutes / 60).toFixed(1),
        overallPreparationPct: Math.round((syllabusCompletionPct * 0.5) + (avgQuizScore * 0.25) + (avgMockScore * 0.25))
      },
      recommendation: {
        recommendedNextTopic: recommendedTopic,
        weakSubject,
        message: recommendationMsg
      }
    });
  } catch (err) {
    console.error('getDashboardSummary Error:', err);
    return res.status(500).json({ error: 'Failed to load competitive dashboard.' });
  }
};

// 2. EXAM SELECTION & TARGET SETTING
exports.getExams = async (req, res) => {
  try {
    const { search } = req.query;
    let exams = await db.query('SELECT * FROM exams WHERE is_active = 1 ORDER BY title ASC');

    if (search) {
      const q = search.toLowerCase();
      exams = exams.filter(e => e.title.toLowerCase().includes(q) || e.category.toLowerCase().includes(q) || e.code.toLowerCase().includes(q));
    }

    return res.json({ exams });
  } catch (err) {
    console.error('getExams Error:', err);
    return res.status(500).json({ error: 'Failed to fetch exams.' });
  }
};

exports.setStudentExamTarget = async (req, res) => {
  try {
    const userId = req.user.id;
    const { exam_id, target_exam_date } = req.body;

    if (!exam_id) {
      return res.status(400).json({ error: 'Exam ID is required.' });
    }

    const existing = await db.query('SELECT * FROM student_exam_targets WHERE user_id = ?', [userId]);

    if (existing && existing.length > 0) {
      await db.query('UPDATE student_exam_targets SET exam_id = ?, target_exam_date = ? WHERE user_id = ?', [
        Number(exam_id), target_exam_date || null, userId
      ]);
    } else {
      await db.query('INSERT INTO student_exam_targets (user_id, exam_id, target_exam_date) VALUES (?, ?, ?)', [
        userId, Number(exam_id), target_exam_date || null
      ]);
    }

    return res.json({ message: 'Target exam updated successfully!' });
  } catch (err) {
    console.error('setStudentExamTarget Error:', err);
    return res.status(500).json({ error: 'Failed to set exam target.' });
  }
};

// 3. EXAM ROADMAP & SUBTOPICS
exports.getExamRoadmap = async (req, res) => {
  try {
    const { examId } = req.params;
    const userId = req.user.id;

    const examRows = await db.query('SELECT * FROM exams WHERE id = ?', [examId]);
    const exam = (examRows && examRows.length > 0) ? examRows[0] : { id: Number(examId), title: 'GATE CS & IT' };

    const subjects = await db.query('SELECT * FROM exam_subjects WHERE exam_id = ?', [examId]);
    const topics = await db.query('SELECT * FROM topics', []);
    const subtopics = await db.query('SELECT * FROM subtopics', []);
    const userProgress = await db.query('SELECT * FROM user_topic_progress WHERE user_id = ?', [userId]);

    const progressMap = {};
    (userProgress || []).forEach(p => { progressMap[p.topic_id] = p.status; });

    let totalTopics = (topics || []).length;
    let completedTopics = 0;

    const subjectsWithHierarchy = (subjects || []).map(sub => {
      const subTopics = (topics || []).filter(t => t.subject_id === sub.id).map(t => {
        const status = progressMap[t.id] || 'not_started';
        if (status === 'completed') completedTopics++;

        const topicSubtopics = (subtopics || []).filter(st => st.topic_id === t.id);
        return {
          ...t,
          status,
          subtopics: topicSubtopics
        };
      });

      const subCompleted = subTopics.filter(t => t.status === 'completed').length;
      const subPct = subTopics.length > 0 ? Math.round((subCompleted / subTopics.length) * 100) : 0;

      return {
        ...sub,
        topics: subTopics,
        completionPercentage: subPct
      };
    });

    const overallPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    return res.json({
      exam,
      subjects: subjectsWithHierarchy,
      totalTopics,
      completedTopics,
      overallPercentage: overallPct
    });
  } catch (err) {
    console.error('getExamRoadmap Error:', err);
    return res.status(500).json({ error: 'Failed to fetch exam roadmap.' });
  }
};

exports.updateTopicProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { topicId, status } = req.body;

    if (!topicId || !status) {
      return res.status(400).json({ error: 'Topic ID and status are required.' });
    }

    await db.query('INSERT INTO user_topic_progress (user_id, topic_id, status) VALUES (?, ?, ?)', [userId, Number(topicId), status]);

    return res.json({ message: 'Topic status updated!' });
  } catch (err) {
    console.error('updateTopicProgress Error:', err);
    return res.status(500).json({ error: 'Failed to update topic progress.' });
  }
};

// 4. SYLLABUS TRACKER
exports.getSyllabusTracker = async (req, res) => {
  try {
    const userId = req.user.id;
    const targetRows = await db.query('SELECT * FROM student_exam_targets WHERE user_id = ?', [userId]);
    const examId = targetRows && targetRows.length > 0 ? targetRows[0].exam_id : 1;

    const subjects = await db.query('SELECT * FROM exam_subjects WHERE exam_id = ?', [examId]);
    const topics = await db.query('SELECT * FROM topics', []);
    const userProgress = await db.query('SELECT * FROM user_topic_progress WHERE user_id = ?', [userId]);

    const progressMap = {};
    (userProgress || []).forEach(p => { progressMap[p.topic_id] = p.status; });

    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;

    const subjectBreakdown = (subjects || []).map(sub => {
      const subTopics = (topics || []).filter(t => t.subject_id === sub.id);
      let subDone = 0;
      subTopics.forEach(t => {
        const st = progressMap[t.id] || 'not_started';
        if (st === 'completed') { completed++; subDone++; }
        else if (st === 'in_progress') inProgress++;
        else notStarted++;
      });

      const pct = subTopics.length > 0 ? Math.round((subDone / subTopics.length) * 100) : 0;
      return {
        subjectTitle: sub.title,
        completionPercentage: pct,
        totalTopics: subTopics.length,
        completedTopics: subDone
      };
    });

    const total = (topics || []).length;
    const overallPct = total > 0 ? Math.round((completed / total) * 100) : 0;

    return res.json({
      totalTopics: total,
      completed,
      inProgress,
      notStarted,
      overallPercentage: overallPct,
      subjectBreakdown
    });
  } catch (err) {
    console.error('getSyllabusTracker Error:', err);
    return res.status(500).json({ error: 'Failed to fetch syllabus tracker.' });
  }
};

exports.getStudyMaterials = async (req, res) => {
  try {
    const userId = req.user.id;
    const { exam_id, subject_id, topic_id, resource_type, material_type, difficulty, search, sort, only_bookmarked } = req.query;

    let materials = await db.query('SELECT * FROM study_materials', []);
    const bookmarks = await db.query('SELECT material_id FROM bookmarked_materials WHERE user_id = ?', [userId]);
    const bookmarkedSet = new Set((bookmarks || []).map(b => b.material_id));

    // Filter active resources for students
    if (req.user.role !== 'admin') {
      materials = (materials || []).filter(m => m.is_active === undefined || m.is_active === 1 || m.is_active === true);
    }

    if (exam_id) materials = (materials || []).filter(m => m.exam_id === Number(exam_id));
    if (subject_id) materials = (materials || []).filter(m => m.subject_id === Number(subject_id));
    if (topic_id) materials = (materials || []).filter(m => m.topic_id === Number(topic_id));
    
    const targetType = resource_type || material_type;
    if (targetType) {
      materials = (materials || []).filter(m => 
        (m.resource_type && m.resource_type.toLowerCase() === targetType.toLowerCase()) ||
        (m.material_type && m.material_type.toLowerCase() === targetType.toLowerCase())
      );
    }

    if (difficulty) {
      materials = (materials || []).filter(m => m.difficulty && m.difficulty.toLowerCase() === difficulty.toLowerCase());
    }

    if (only_bookmarked === 'true' || only_bookmarked === '1') {
      materials = (materials || []).filter(m => bookmarkedSet.has(m.id));
    }

    if (search) {
      const q = search.toLowerCase();
      materials = (materials || []).filter(m => 
        (m.title && m.title.toLowerCase().includes(q)) || 
        (m.description && m.description.toLowerCase().includes(q)) ||
        (m.source_name && m.source_name.toLowerCase().includes(q))
      );
    }

    if (sort === 'popular') {
      materials.sort((a, b) => Number(b.clicks_count || b.download_count || 0) - Number(a.clicks_count || a.download_count || 0));
    } else if (sort === 'newest') {
      materials.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    const result = (materials || []).map(m => ({
      ...m,
      resource_type: m.resource_type || m.material_type || 'video',
      url: m.url || m.file_url,
      source_name: m.source_name || 'Educational Source',
      difficulty: m.difficulty || 'intermediate',
      clicks_count: Number(m.clicks_count || m.download_count || 0),
      isBookmarked: bookmarkedSet.has(m.id)
    }));

    return res.json({ materials: result, resources: result });
  } catch (err) {
    console.error('getStudyMaterials Error:', err);
    return res.status(500).json({ error: 'Failed to fetch learning resources.' });
  }
};

exports.trackMaterialDownload = async (req, res) => {
  try {
    const { id } = req.params;
    const mats = await db.query('SELECT * FROM study_materials WHERE id = ?', [id]);
    if (mats && mats.length > 0) {
      const newCount = Number(mats[0].clicks_count || mats[0].download_count || 0) + 1;
      await db.query('UPDATE study_materials SET clicks_count = ?, download_count = ? WHERE id = ?', [newCount, newCount, Number(id)]);
    }
    return res.json({ message: 'Click count updated.' });
  } catch (err) {
    console.error('trackMaterialDownload Error:', err);
    return res.status(500).json({ error: 'Failed to track resource click.' });
  }
};

exports.toggleBookmark = async (req, res) => {
  try {
    const userId = req.user.id;
    const { material_id } = req.body;

    const existing = await db.query('SELECT * FROM bookmarked_materials WHERE user_id = ? AND material_id = ?', [userId, Number(material_id)]);

    if (existing && existing.length > 0) {
      await db.query('DELETE FROM bookmarked_materials WHERE user_id = ? AND material_id = ?', [userId, Number(material_id)]);
      return res.json({ message: 'Bookmark removed.', isBookmarked: false });
    } else {
      await db.query('INSERT INTO bookmarked_materials (user_id, material_id) VALUES (?, ?)', [userId, Number(material_id)]);
      return res.json({ message: 'Material bookmarked!', isBookmarked: true });
    }
  } catch (err) {
    console.error('toggleBookmark Error:', err);
    return res.status(500).json({ error: 'Failed to toggle bookmark.' });
  }
};

// 6 & 7. PREVIOUS YEAR QUESTIONS & QUESTION BANK
exports.getPyqs = async (req, res) => {
  try {
    const { exam_id, year, subject_id, difficulty } = req.query;
    let questions = await db.query('SELECT * FROM questions', []);

    if (exam_id) questions = (questions || []).filter(q => q.exam_id === Number(exam_id));
    if (year) questions = (questions || []).filter(q => q.year === year);
    if (subject_id) questions = (questions || []).filter(q => q.subject_id === Number(subject_id));
    if (difficulty) questions = (questions || []).filter(q => q.difficulty === difficulty);

    return res.json({ questions: questions || [] });
  } catch (err) {
    console.error('getPyqs Error:', err);
    return res.status(500).json({ error: 'Failed to fetch PYQs.' });
  }
};

exports.getQuestionBank = async (req, res) => {
  try {
    const { subject_id, topic_id, difficulty } = req.query;
    let questions = await db.query('SELECT * FROM questions', []);

    if (subject_id) questions = (questions || []).filter(q => q.subject_id === Number(subject_id));
    if (topic_id) questions = (questions || []).filter(q => q.topic_id === Number(topic_id));
    if (difficulty) questions = (questions || []).filter(q => q.difficulty === difficulty);

    return res.json({ questions: questions || [] });
  } catch (err) {
    console.error('getQuestionBank Error:', err);
    return res.status(500).json({ error: 'Failed to fetch question bank.' });
  }
};

// 8. QUIZ SYSTEM
exports.getQuizzes = async (req, res) => {
  try {
    const { exam_id } = req.query;
    let quizzes = await db.query('SELECT * FROM quizzes', []);

    if (exam_id) quizzes = (quizzes || []).filter(q => q.exam_id === Number(exam_id));
    return res.json({ quizzes: quizzes || [] });
  } catch (err) {
    console.error('getQuizzes Error:', err);
    return res.status(500).json({ error: 'Failed to fetch quizzes.' });
  }
};

exports.getQuizDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const quizRows = await db.query('SELECT * FROM quizzes WHERE id = ?', [id]);
    if (!quizRows || quizRows.length === 0) return res.status(404).json({ error: 'Quiz not found.' });

    const quiz = quizRows[0];
    const questions = await db.query('SELECT * FROM quiz_questions WHERE quiz_id = ?', [id]);

    return res.json({ quiz, questions: questions || [] });
  } catch (err) {
    console.error('getQuizDetails Error:', err);
    return res.status(500).json({ error: 'Failed to fetch quiz details.' });
  }
};

exports.submitQuizResult = async (req, res) => {
  try {
    const userId = req.user.id;
    const { quiz_id, answers, time_taken_seconds } = req.body;

    const quizRows = await db.query('SELECT * FROM quizzes WHERE id = ?', [quiz_id]).catch(() => []);
    const quiz = (quizRows && quizRows.length > 0) ? quizRows[0] : { total_marks: 10 };
    const questions = await db.query('SELECT * FROM questions', []).catch(() => []);

    let correctCount = 0;
    const feedback = (questions || []).slice(0, 2).map(q => {
      const choice = (answers || {})[q.id];
      const isCorrect = choice === q.correct_option;
      if (isCorrect) correctCount++;
      return {
        questionId: q.id,
        questionText: q.question_text || q.questionText,
        userChoice: choice,
        correctOption: q.correct_option || q.correctOption,
        isCorrect,
        explanation: q.explanation
      };
    });

    const totalQuestions = feedback.length || 1;
    const score = ((correctCount / totalQuestions) * Number(quiz.total_marks || 10)).toFixed(2);
    const percentage = Math.round((correctCount / totalQuestions) * 100);

    if (firestoreService.firestore) {
      await firestoreService.saveQuizResult(userId, quiz_id, {
        score: Number(score),
        total_questions: totalQuestions,
        correct_count: correctCount,
        time_taken_seconds: time_taken_seconds || 0,
        percentage
      });
    } else {
      await db.query(
        'INSERT INTO quiz_results (user_id, quiz_id, score, total_questions, correct_count, time_taken_seconds) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, Number(quiz_id), score, totalQuestions, correctCount, time_taken_seconds || 0]
      );
    }

    return res.json({
      message: 'Quiz submitted successfully!',
      score: Number(score),
      totalQuestions,
      correctCount,
      percentage,
      feedback
    });
  } catch (err) {
    console.error('submitQuizResult Error:', err);
    return res.status(500).json({ error: 'Failed to submit quiz.' });
  }
};

// 9. MOCK TEST SYSTEM
exports.getMockTests = async (req, res) => {
  try {
    if (firestoreService.firestore) {
      const mockTests = await firestoreService.getMockTests();
      return res.json({ mockTests: mockTests || [] });
    }
    const mockTests = await db.query('SELECT * FROM mock_tests', []);
    return res.json({ mockTests: mockTests || [] });
  } catch (err) {
    console.error('getMockTests Error:', err);
    return res.status(500).json({ error: 'Failed to fetch mock tests.' });
  }
};

exports.submitMockTestResult = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mock_test_id, score, total_questions, correct_count } = req.body;

    const mockRows = await db.query('SELECT * FROM mock_tests WHERE id = ?', [mock_test_id]).catch(() => []);
    const mock = (mockRows && mockRows.length > 0) ? mockRows[0] : { passing_score: 50 };

    const percentage = total_questions > 0 ? Math.round((correct_count / total_questions) * 100) : Number(score || 0);
    const passed = percentage >= Number(mock.passing_score || 50);
    const weakSubjects = ['DBMS Normalization', 'TCP Congestion Control'];

    if (firestoreService.firestore) {
      await firestoreService.saveMockTestResult(userId, mock_test_id, {
        score: score || percentage,
        percentage,
        passed,
        weakSubjects
      });
    } else {
      await db.query(
        'INSERT INTO mock_test_results (user_id, mock_test_id, score, percentage, passed, weak_subjects_json) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, Number(mock_test_id), score || percentage, percentage, passed ? 1 : 0, JSON.stringify(weakSubjects)]
      );
    }

    return res.json({
      message: 'Mock Test submitted!',
      score: score || percentage,
      percentage,
      passed,
      weakSubjects
    });
  } catch (err) {
    console.error('submitMockTestResult Error:', err);
    return res.status(500).json({ error: 'Failed to submit mock test.' });
  }
};

// 10. COMPETITIVE ANALYTICS
exports.getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    if (firestoreService.firestore) {
      const analytics = await firestoreService.getUserAnalytics(userId);
      return res.json(analytics);
    }

    const targetRows = await db.query('SELECT * FROM student_exam_targets WHERE user_id = ?', [userId]);
    const examId = targetRows && targetRows.length > 0 ? targetRows[0].exam_id : 1;

    const examRows = await db.query('SELECT * FROM exams WHERE id = ?', [examId]);
    const exam = (examRows && examRows.length > 0) ? examRows[0] : { title: 'GATE CS & IT' };

    const subjects = await db.query('SELECT * FROM exam_subjects WHERE exam_id = ?', [examId]);
    const topics = await db.query('SELECT * FROM topics', []);
    const userProgress = await db.query('SELECT * FROM user_topic_progress WHERE user_id = ?', [userId]);
    const quizResults = await db.query('SELECT * FROM quiz_results WHERE user_id = ?', [userId]);
    const mockResults = await db.query('SELECT * FROM mock_test_results WHERE user_id = ?', [userId]);
    const sessions = await db.query('SELECT * FROM study_sessions WHERE user_id = ?', [userId]);

    let totalMinutes = 0;
    (sessions || []).forEach(s => totalMinutes += Number(s.duration_minutes || 0));

    const progressMap = {};
    (userProgress || []).forEach(p => { progressMap[p.topic_id] = p.status; });

    let completedTopics = 0;
    (topics || []).forEach(t => { if (progressMap[t.id] === 'completed') completedTopics++; });

    const subjectStats = (subjects || []).map(s => {
      const subTopics = (topics || []).filter(t => t.subject_id === s.id);
      const subDone = subTopics.filter(t => progressMap[t.id] === 'completed').length;
      return {
        id: s.id,
        title: s.title,
        completionPercentage: subTopics.length ? Math.round((subDone / subTopics.length) * 100) : 0,
        totalTopics: subTopics.length,
        completedTopics: subDone
      };
    });

    return res.json({
      examTitle: exam.title,
      totalStudyHours: (totalMinutes / 60).toFixed(1),
      completedTopics,
      totalTopics: (topics || []).length,
      syllabusCompletionPct: (topics || []).length ? Math.round((completedTopics / (topics || []).length) * 100) : 0,
      quizCount: (quizResults || []).length,
      avgQuizScore: quizResults && quizResults.length ? Math.round(quizResults.reduce((acc, r) => acc + (Number(r.score) / Number(r.total_questions || 1)) * 100, 0) / quizResults.length) : 0,
      mockCount: (mockResults || []).length,
      avgMockScore: mockResults && mockResults.length ? Math.round(mockResults.reduce((acc, r) => acc + Number(r.percentage), 0) / mockResults.length) : 0,
      subjectStats,
      recentQuizzes: (quizResults || []).slice(-5),
      recentMockTests: (mockResults || []).slice(-5)
    });
  } catch (err) {
    console.error('getAnalytics Error:', err);
    return res.status(500).json({ error: 'Failed to fetch competitive analytics.' });
  }
};

