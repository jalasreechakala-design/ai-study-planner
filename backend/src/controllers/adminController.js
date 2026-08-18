const db = require('../config/db');
const firestoreService = require('../services/firestoreService');

// 1. ADMIN DASHBOARD STATS & METRICS
exports.getAdminStats = async (req, res) => {
  try {
    if (firestoreService.firestore) {
      const statsData = await firestoreService.getAdminStats();
      return res.json(statsData);
    }

    const students = await db.query("SELECT * FROM users WHERE role = 'student'");
    const exams = await db.query('SELECT * FROM exams');
    const subjects = await db.query('SELECT * FROM exam_subjects');
    const topics = await db.query('SELECT * FROM topics');
    const materials = await db.query('SELECT * FROM study_materials');
    const questions = await db.query('SELECT * FROM questions');
    const quizzes = await db.query('SELECT * FROM quizzes');
    const mockTests = await db.query('SELECT * FROM mock_tests');
    const quizResults = await db.query('SELECT * FROM quiz_results');
    const mockResults = await db.query('SELECT * FROM mock_test_results');

    const materialsByExam = (exams || []).map(e => ({
      examTitle: e.title || e.name,
      count: (materials || []).filter(m => m.exam_id === e.id || String(m.examId) === String(e.id)).length
    }));

    return res.json({
      stats: {
        totalStudents: (students || []).length,
        totalExams: (exams || []).length,
        totalSubjects: (subjects || []).length,
        totalTopics: (topics || []).length,
        totalMaterials: (materials || []).length,
        totalQuestions: (questions || []).length,
        totalQuizzes: (quizzes || []).length,
        totalMockTests: (mockTests || []).length,
        totalQuizAttempts: (quizResults || []).length,
        totalMockAttempts: (mockResults || []).length
      },
      charts: {
        materialsByExam,
        studentsByPlatform: [
          { name: 'College Platform Active', value: (students || []).length },
          { name: 'Competitive Platform Active', value: (students || []).length }
        ]
      }
    });
  } catch (err) {
    console.error('getAdminStats Error:', err);
    return res.status(500).json({ error: 'Failed to load admin statistics.' });
  }
};

// 2. EXAM MANAGEMENT CRUD
exports.getExams = async (req, res) => {
  try {
    if (firestoreService.firestore) {
      const exams = await firestoreService.getExams(req.query.search);
      return res.json({ exams: exams || [] });
    }

    const exams = await db.query('SELECT * FROM exams ORDER BY id ASC');
    return res.json({ exams: exams || [] });
  } catch (err) {
    console.error('getExams Error:', err);
    return res.status(500).json({ error: 'Failed to fetch exams.' });
  }
};

exports.createExam = async (req, res) => {
  try {
    const { title, name, code, shortName, category, description, icon, duration, eligibility, examDate } = req.body;

    const examTitle = (title || name || '').trim();
    const examCode = (code || shortName || '').trim();

    if (!examTitle || !examCode) {
      return res.status(400).json({ error: 'Exam name/title and code/shortName are required.' });
    }

    if (firestoreService.firestore) {
      const created = await firestoreService.createExam({
        title: examTitle,
        name: examTitle,
        code: examCode.toUpperCase(),
        shortName: examCode.toUpperCase(),
        category: category || 'Engineering',
        description: description || '',
        icon: icon || 'BookOpen',
        duration: duration || '3 Hours',
        eligibility: eligibility || 'Graduates / Final Year',
        examDate: examDate || null,
        isActive: true
      });
      return res.status(201).json({ message: 'Exam created successfully in Firestore!', examId: created.id });
    }

    const result = await db.query(
      'INSERT INTO exams (title, code, category, description, icon, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [examTitle, examCode.toUpperCase(), category || 'General', description || '', icon || 'BookOpen', 1]
    );

    return res.status(201).json({ message: 'Exam created successfully!', examId: result.insertId || result.id });
  } catch (err) {
    console.error('createExam Error:', err);
    return res.status(500).json({ error: 'Failed to create exam.' });
  }
};

exports.updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const examData = req.body;

    if (firestoreService.firestore) {
      await firestoreService.updateExam(id, examData);
      return res.json({ message: 'Exam updated successfully in Firestore!' });
    }

    const { title, code, category, description, icon, is_active } = req.body;
    await db.query(
      'UPDATE exams SET title = ?, code = ?, category = ?, description = ?, icon = ?, is_active = ? WHERE id = ?',
      [title, code, category, description, icon, is_active ? 1 : 0, id]
    );

    return res.json({ message: 'Exam updated successfully!' });
  } catch (err) {
    console.error('updateExam Error:', err);
    return res.status(500).json({ error: 'Failed to update exam.' });
  }
};

exports.deleteExam = async (req, res) => {
  try {
    const { id } = req.params;
    if (firestoreService.firestore) {
      await firestoreService.deleteExam(id);
      return res.json({ message: 'Exam deleted from Firestore!' });
    }

    await db.query('DELETE FROM exams WHERE id = ?', [id]);
    return res.json({ message: 'Exam deleted successfully!' });
  } catch (err) {
    console.error('deleteExam Error:', err);
    return res.status(500).json({ error: 'Failed to delete exam.' });
  }
};

// 3. SUBJECT MANAGEMENT CRUD
exports.getSubjects = async (req, res) => {
  try {
    const examId = req.query.exam_id || req.query.examId;

    if (firestoreService.firestore && examId) {
      const subjects = await firestoreService.getExamSubjects(examId);
      return res.json({ subjects: subjects || [] });
    }

    let subjects = await db.query('SELECT * FROM exam_subjects ORDER BY id ASC');
    if (examId) {
      subjects = (subjects || []).filter(s => String(s.exam_id) === String(examId) || String(s.examId) === String(examId));
    }

    return res.json({ subjects: subjects || [] });
  } catch (err) {
    console.error('getSubjects Error:', err);
    return res.status(500).json({ error: 'Failed to fetch subjects.' });
  }
};

exports.createSubject = async (req, res) => {
  try {
    const examId = req.body.exam_id || req.body.examId;
    const subjectTitle = req.body.title || req.body.name;
    const { code, weightage } = req.body;

    if (!examId || !subjectTitle) {
      return res.status(400).json({ error: 'Exam ID and subject title/name are required.' });
    }

    if (firestoreService.firestore) {
      const created = await firestoreService.createExamSubject(examId, {
        title: subjectTitle,
        name: subjectTitle,
        code: code || '',
        weightage: weightage || '10%'
      });
      return res.status(201).json({ message: 'Subject created in Firestore!', subjectId: created.id });
    }

    const result = await db.query(
      'INSERT INTO exam_subjects (exam_id, title, code, weightage) VALUES (?, ?, ?, ?)',
      [Number(examId), subjectTitle, code || '', weightage || '10%']
    );

    return res.status(201).json({ message: 'Subject created successfully!', subjectId: result.insertId || result.id });
  } catch (err) {
    console.error('createSubject Error:', err);
    return res.status(500).json({ error: 'Failed to create subject.' });
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const examId = req.query.examId || req.body.examId || 1;

    if (firestoreService.firestore) {
      await firestoreService.deleteExamSubject(examId, id);
      return res.json({ message: 'Subject deleted from Firestore!' });
    }

    await db.query('DELETE FROM exam_subjects WHERE id = ?', [id]);
    return res.json({ message: 'Subject deleted successfully!' });
  } catch (err) {
    console.error('deleteSubject Error:', err);
    return res.status(500).json({ error: 'Failed to delete subject.' });
  }
};

// 4. TOPIC MANAGEMENT CRUD
exports.getTopics = async (req, res) => {
  try {
    const examId = req.query.exam_id || req.query.examId || 1;
    const subjectId = req.query.subject_id || req.query.subjectId;

    if (firestoreService.firestore && subjectId) {
      const topics = await firestoreService.getTopics(examId, subjectId);
      return res.json({ topics: topics || [] });
    }

    let topics = await db.query('SELECT * FROM topics ORDER BY id ASC');
    if (subjectId) {
      topics = (topics || []).filter(t => String(t.subject_id) === String(subjectId) || String(t.subjectId) === String(subjectId));
    }

    return res.json({ topics: topics || [] });
  } catch (err) {
    console.error('getTopics Error:', err);
    return res.status(500).json({ error: 'Failed to fetch topics.' });
  }
};

exports.createTopic = async (req, res) => {
  try {
    const examId = req.body.exam_id || req.body.examId || 1;
    const subjectId = req.body.subject_id || req.body.subjectId;
    const topicTitle = req.body.title || req.body.name;
    const { description, estimated_hours, estimatedHours, difficulty } = req.body;

    if (!subjectId || !topicTitle) {
      return res.status(400).json({ error: 'Subject ID and topic title/name are required.' });
    }

    if (firestoreService.firestore) {
      const created = await firestoreService.createTopic(examId, subjectId, {
        title: topicTitle,
        name: topicTitle,
        description: description || '',
        estimatedHours: Number(estimatedHours || estimated_hours || 3),
        difficulty: difficulty || 'intermediate',
        orderIndex: 1
      });
      return res.status(201).json({ message: 'Topic created in Firestore!', topicId: created.id });
    }

    const result = await db.query(
      'INSERT INTO topics (subject_id, title, description, estimated_hours, order_index) VALUES (?, ?, ?, ?, ?)',
      [Number(subjectId), topicTitle, description || '', estimated_hours || 3, 1]
    );

    return res.status(201).json({ message: 'Topic created successfully!', topicId: result.insertId || result.id });
  } catch (err) {
    console.error('createTopic Error:', err);
    return res.status(500).json({ error: 'Failed to create topic.' });
  }
};

exports.deleteTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const examId = req.query.examId || 1;
    const subjectId = req.query.subjectId || 1;

    if (firestoreService.firestore) {
      await firestoreService.deleteTopic(examId, subjectId, id);
      return res.json({ message: 'Topic deleted from Firestore!' });
    }

    await db.query('DELETE FROM topics WHERE id = ?', [id]);
    return res.json({ message: 'Topic deleted successfully!' });
  } catch (err) {
    console.error('deleteTopic Error:', err);
    return res.status(500).json({ error: 'Failed to delete topic.' });
  }
};

// 5. LEARNING RESOURCE MANAGEMENT CRUD
exports.getMaterials = async (req, res) => {
  try {
    if (firestoreService.firestore) {
      const materials = await firestoreService.getLearningResources(req.query);
      return res.json({ materials: materials || [], resources: materials || [] });
    }

    const materials = await db.query('SELECT * FROM study_materials ORDER BY id DESC');
    return res.json({ materials: materials || [], resources: materials || [] });
  } catch (err) {
    console.error('getMaterials Error:', err);
    return res.status(500).json({ error: 'Failed to fetch learning resources.' });
  }
};

exports.createMaterial = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { title, exam_id, examId, subject_id, subjectId, topic_id, topicId, resource_type, material_type, url, file_url, source_name, sourceName, difficulty, description } = req.body;

    const targetUrl = (url || file_url || '').trim();

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Resource title is required.' });
    }
    const finalExamId = exam_id || examId;
    if (!finalExamId) {
      return res.status(400).json({ error: 'Exam selection is required.' });
    }
    if (!targetUrl || (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://'))) {
      return res.status(400).json({ error: 'Please enter a valid educational URL starting with http:// or https://' });
    }

    try {
      new URL(targetUrl);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format. Please provide a full valid web address.' });
    }

    const typeValue = resource_type || material_type || 'video';
    const sourceValue = (source_name || sourceName || 'Educational Source').trim();
    const diffValue = (difficulty || 'intermediate').toLowerCase();

    if (firestoreService.firestore) {
      const created = await firestoreService.createLearningResource({
        examId: finalExamId,
        subjectId: subject_id || subjectId || null,
        topicId: topic_id || topicId || null,
        title: title.trim(),
        description: description || '',
        resourceType: typeValue,
        sourceName: sourceValue,
        url: targetUrl,
        difficulty: diffValue,
        uploadedBy: adminId
      });
      return res.status(201).json({ message: 'Learning resource published to Firestore!', resourceId: created.id });
    }

    const result = await db.query(
      'INSERT INTO study_materials (title, exam_id, subject_id, topic_id, material_type, resource_type, file_url, url, source_name, difficulty, description, uploaded_by, clicks_count, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1)',
      [
        title.trim(),
        Number(finalExamId),
        subject_id || subjectId ? Number(subject_id || subjectId) : null,
        topic_id || topicId ? Number(topic_id || topicId) : null,
        'link',
        typeValue,
        targetUrl,
        targetUrl,
        sourceValue,
        diffValue,
        description || '',
        adminId
      ]
    );

    return res.status(201).json({ message: 'Learning resource published successfully!', resourceId: result.insertId || result.id });
  } catch (err) {
    console.error('createMaterial Error:', err);
    return res.status(500).json({ error: `Failed to create resource: ${err.message}` });
  }
};

exports.updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, exam_id, examId, subject_id, subjectId, topic_id, topicId, resource_type, url, source_name, sourceName, difficulty, description, is_active } = req.body;

    const targetUrl = (url || '').trim();
    if (targetUrl && !targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      return res.status(400).json({ error: 'Please enter a valid educational URL starting with http:// or https://' });
    }

    if (firestoreService.firestore) {
      await firestoreService.updateLearningResource(id, {
        title,
        examId: exam_id || examId,
        subjectId: subject_id || subjectId,
        topicId: topic_id || topicId,
        resourceType: resource_type,
        sourceName: source_name || sourceName,
        url: targetUrl,
        difficulty,
        description
      });
      return res.json({ message: 'Resource updated in Firestore!' });
    }

    await db.query(
      'UPDATE study_materials SET title = ?, exam_id = ?, subject_id = ?, topic_id = ?, resource_type = ?, file_url = ?, url = ?, source_name = ?, difficulty = ?, description = ?, is_active = ? WHERE id = ?',
      [
        title,
        Number(exam_id || examId),
        subject_id || subjectId ? Number(subject_id || subjectId) : null,
        topic_id || topicId ? Number(topic_id || topicId) : null,
        resource_type || 'video',
        targetUrl,
        targetUrl,
        source_name || sourceName || 'Educational Source',
        difficulty || 'intermediate',
        description || '',
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
        id
      ]
    );

    return res.json({ message: 'Resource updated successfully!' });
  } catch (err) {
    console.error('updateMaterial Error:', err);
    return res.status(500).json({ error: 'Failed to update resource.' });
  }
};

exports.deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    if (firestoreService.firestore) {
      await firestoreService.deleteLearningResource(id);
      return res.json({ message: 'Learning resource deleted from Firestore!' });
    }

    await db.query('DELETE FROM study_materials WHERE id = ?', [id]);
    return res.json({ message: 'Learning resource deleted successfully!' });
  } catch (err) {
    console.error('deleteMaterial Error:', err);
    return res.status(500).json({ error: 'Failed to delete resource.' });
  }
};

// 6. QUESTION BANK MANAGEMENT CRUD
exports.getQuestions = async (req, res) => {
  try {
    if (firestoreService.firestore) {
      const questions = await firestoreService.getQuestions(req.query);
      return res.json({ questions: questions || [] });
    }

    const questions = await db.query('SELECT * FROM questions ORDER BY id DESC');
    return res.json({ questions: questions || [] });
  } catch (err) {
    console.error('getQuestions Error:', err);
    return res.status(500).json({ error: 'Failed to fetch questions.' });
  }
};

exports.createQuestion = async (req, res) => {
  try {
    const { subject_id, subjectId, topic_id, topicId, exam_id, examId, year, question_text, questionText, option_a, optionA, option_b, optionB, option_c, optionC, option_d, optionD, correct_option, correctOption, explanation, difficulty } = req.body;

    const text = question_text || questionText;
    const correct = correct_option || correctOption;

    if (!text || !correct) {
      return res.status(400).json({ error: 'Question Text and Correct Option are required.' });
    }

    if (firestoreService.firestore) {
      const created = await firestoreService.createQuestion({
        examId: exam_id || examId || '1',
        subjectId: subject_id || subjectId || '1',
        topicId: topic_id || topicId || null,
        questionText: text,
        optionA: option_a || optionA || 'Option A',
        optionB: option_b || optionB || 'Option B',
        optionC: option_c || optionC || 'Option C',
        optionD: option_d || optionD || 'Option D',
        correctOption: correct,
        explanation: explanation || '',
        difficulty: difficulty || 'medium'
      });
      return res.status(201).json({ message: 'Question added to Firestore Question Bank!', questionId: created.id });
    }

    const result = await db.query(
      'INSERT INTO questions (subject_id, topic_id, exam_id, year, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [Number(subject_id || subjectId || 1), topic_id || topicId ? Number(topic_id || topicId) : null, exam_id || examId ? Number(exam_id || examId) : null, year || null, text, option_a || optionA || 'Option A', option_b || optionB || 'Option B', option_c || optionC || 'Option C', option_d || optionD || 'Option D', correct, explanation || '', difficulty || 'medium']
    );

    return res.status(201).json({ message: 'Question added to Question Bank!', questionId: result.insertId || result.id });
  } catch (err) {
    console.error('createQuestion Error:', err);
    return res.status(500).json({ error: 'Failed to create question.' });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    if (firestoreService.firestore) {
      await firestoreService.deleteQuestion(id);
      return res.json({ message: 'Question deleted from Firestore!' });
    }

    await db.query('DELETE FROM questions WHERE id = ?', [id]);
    return res.json({ message: 'Question deleted!' });
  } catch (err) {
    console.error('deleteQuestion Error:', err);
    return res.status(500).json({ error: 'Failed to delete question.' });
  }
};

// 7. QUIZ & MOCK TEST MANAGEMENT
exports.createQuiz = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { title, exam_id, examId, subject_id, subjectId, time_limit_mins, total_marks } = req.body;

    const finalExamId = exam_id || examId;
    if (!title || !finalExamId) {
      return res.status(400).json({ error: 'Title and Exam selection are required.' });
    }

    if (firestoreService.firestore) {
      const created = await firestoreService.createQuiz({
        title,
        examId: finalExamId,
        subjectId: subject_id || subjectId || null,
        timeLimitMins: Number(time_limit_mins || 15),
        totalMarks: Number(total_marks || 10),
        createdBy: adminId
      });
      return res.status(201).json({ message: 'Quiz created and published to Firestore!', quizId: created.id });
    }

    const result = await db.query(
      'INSERT INTO quizzes (title, exam_id, subject_id, time_limit_mins, total_marks, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [title, Number(finalExamId), subject_id || subjectId ? Number(subject_id || subjectId) : null, time_limit_mins || 15, total_marks || 10, adminId]
    );

    return res.status(201).json({ message: 'Quiz created and published to students!', quizId: result.insertId || result.id });
  } catch (err) {
    console.error('createQuiz Error:', err);
    return res.status(500).json({ error: 'Failed to create quiz.' });
  }
};

exports.deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    if (firestoreService.firestore) {
      await firestoreService.deleteQuiz(id);
      return res.json({ message: 'Quiz deleted from Firestore!' });
    }

    await db.query('DELETE FROM quizzes WHERE id = ?', [id]);
    return res.json({ message: 'Quiz deleted!' });
  } catch (err) {
    console.error('deleteQuiz Error:', err);
    return res.status(500).json({ error: 'Failed to delete quiz.' });
  }
};

// 8. USER MANAGEMENT & STUDENT ACCOUNTS
exports.getStudents = async (req, res) => {
  try {
    if (firestoreService.firestore) {
      const students = await firestoreService.getStudents();
      return res.json({ students });
    }

    const users = await db.query("SELECT id, name, email, role, created_at FROM users WHERE role = 'student'");
    const profiles = await db.query('SELECT * FROM student_profiles');

    const profileMap = {};
    (profiles || []).forEach(p => { profileMap[p.user_id] = p; });

    const students = (users || []).map(u => ({
      ...u,
      profile: profileMap[u.id] || null,
      status: u.status || 'active'
    }));

    return res.json({ students });
  } catch (err) {
    console.error('getStudents Error:', err);
    return res.status(500).json({ error: 'Failed to fetch student directory.' });
  }
};

exports.toggleStudentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (firestoreService.firestore) {
      await firestoreService.toggleStudentStatus(id, status);
      return res.json({ message: `Student status set to ${status || 'active'} in Firestore.` });
    }

    await db.query('UPDATE users SET status = ? WHERE id = ?', [status || 'active', id]);
    return res.json({ message: `Student status set to ${status || 'active'}.` });
  } catch (err) {
    console.error('toggleStudentStatus Error:', err);
    return res.status(500).json({ error: 'Failed to update student status.' });
  }
};

// 9. ANNOUNCEMENTS / NOTIFICATIONS
exports.sendNotification = async (req, res) => {
  try {
    const { title, message, type } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required.' });
    }

    if (firestoreService.firestore) {
      const students = await firestoreService.getStudents();
      for (const s of students) {
        await firestoreService.addNotification(s.id, {
          title,
          message,
          type: type || 'announcement'
        });
      }
      return res.status(201).json({ message: `Announcement broadcasted to ${students.length} students in Firestore!` });
    }

    const students = await db.query("SELECT id FROM users WHERE role = 'student'");
    for (const s of (students || [])) {
      await db.query(
        'INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (?, ?, ?, ?, ?)',
        [s.id, title, message, type || 'announcement', 0]
      );
    }

    return res.status(201).json({ message: `Announcement broadcasted to ${students.length} students!` });
  } catch (err) {
    console.error('sendNotification Error:', err);
    return res.status(500).json({ error: 'Failed to send announcement.' });
  }
};

// 10. SUBTOPIC MANAGEMENT
exports.getSubtopics = async (req, res) => {
  try {
    const examId = req.query.examId || 1;
    const subjectId = req.query.subjectId || 1;
    const topicId = req.query.topic_id || req.query.topicId;

    if (firestoreService.firestore && topicId) {
      const subtopics = await firestoreService.getSubtopics(examId, subjectId, topicId);
      return res.json({ subtopics: subtopics || [] });
    }

    let subtopics = await db.query('SELECT * FROM subtopics ORDER BY order_index ASC');
    if (topicId) {
      subtopics = (subtopics || []).filter(st => String(st.topic_id) === String(topicId) || String(st.topicId) === String(topicId));
    }
    return res.json({ subtopics: subtopics || [] });
  } catch (err) {
    console.error('getSubtopics Error:', err);
    return res.status(500).json({ error: 'Failed to fetch subtopics.' });
  }
};

exports.createSubtopic = async (req, res) => {
  try {
    const examId = req.body.examId || 1;
    const subjectId = req.body.subjectId || 1;
    const topicId = req.body.topic_id || req.body.topicId;
    const subtopicTitle = req.body.title || req.body.name;
    const { description, order_index, orderIndex } = req.body;

    if (!topicId || !subtopicTitle) {
      return res.status(400).json({ error: 'Topic ID and Subtopic Title/Name are required.' });
    }

    if (firestoreService.firestore) {
      const created = await firestoreService.createSubtopic(examId, subjectId, topicId, {
        title: subtopicTitle,
        name: subtopicTitle,
        description: description || '',
        orderIndex: Number(orderIndex || order_index || 1)
      });
      return res.status(201).json({ message: 'Subtopic added in Firestore!', subtopicId: created.id });
    }

    const result = await db.query(
      'INSERT INTO subtopics (topic_id, title, description, order_index) VALUES (?, ?, ?, ?)',
      [Number(topicId), subtopicTitle, description || '', order_index || 1]
    );
    return res.status(201).json({ message: 'Subtopic added!', subtopicId: result.insertId || result.id });
  } catch (err) {
    console.error('createSubtopic Error:', err);
    return res.status(500).json({ error: 'Failed to create subtopic.' });
  }
};

exports.deleteSubtopic = async (req, res) => {
  try {
    const { id } = req.params;
    const examId = req.query.examId || 1;
    const subjectId = req.query.subjectId || 1;
    const topicId = req.query.topicId || 1;

    if (firestoreService.firestore) {
      await firestoreService.deleteSubtopic(examId, subjectId, topicId, id);
      return res.json({ message: 'Subtopic deleted from Firestore!' });
    }

    await db.query('DELETE FROM subtopics WHERE id = ?', [id]);
    return res.json({ message: 'Subtopic deleted!' });
  } catch (err) {
    console.error('deleteSubtopic Error:', err);
    return res.status(500).json({ error: 'Failed to delete subtopic.' });
  }
};

// 11. MOCK TEST MANAGEMENT
exports.getMockTests = async (req, res) => {
  try {
    if (firestoreService.firestore) {
      const mockTests = await firestoreService.getMockTests();
      return res.json({ mockTests: mockTests || [] });
    }

    const mockTests = await db.query('SELECT * FROM mock_tests ORDER BY id DESC');
    return res.json({ mockTests: mockTests || [] });
  } catch (err) {
    console.error('getMockTests Error:', err);
    return res.status(500).json({ error: 'Failed to fetch mock tests.' });
  }
};

exports.createMockTest = async (req, res) => {
  try {
    const { title, exam_id, examId, duration_mins, total_questions, passing_score } = req.body;
    const finalExamId = exam_id || examId;

    if (!title || !finalExamId) {
      return res.status(400).json({ error: 'Title and Exam selection are required.' });
    }

    if (firestoreService.firestore) {
      const created = await firestoreService.createMockTest({
        title,
        examId: finalExamId,
        durationMins: Number(duration_mins || 60),
        totalQuestions: Number(total_questions || 30),
        passingScore: Number(passing_score || 50.0)
      });
      return res.status(201).json({ message: 'Mock Test created in Firestore!', mockTestId: created.id });
    }

    const result = await db.query(
      'INSERT INTO mock_tests (title, exam_id, duration_mins, total_questions, passing_score) VALUES (?, ?, ?, ?, ?)',
      [title, Number(finalExamId), duration_mins || 60, total_questions || 30, passing_score || 50.0]
    );
    return res.status(201).json({ message: 'Full Mock Test created!', mockTestId: result.insertId || result.id });
  } catch (err) {
    console.error('createMockTest Error:', err);
    return res.status(500).json({ error: 'Failed to create mock test.' });
  }
};

exports.deleteMockTest = async (req, res) => {
  try {
    const { id } = req.params;
    if (firestoreService.firestore) {
      await firestoreService.deleteMockTest(id);
      return res.json({ message: 'Mock test deleted from Firestore!' });
    }

    await db.query('DELETE FROM mock_tests WHERE id = ?', [id]);
    return res.json({ message: 'Mock Test deleted!' });
  } catch (err) {
    console.error('deleteMockTest Error:', err);
    return res.status(500).json({ error: 'Failed to delete mock test.' });
  }
};
