const firestoreService = require('../services/firestoreService');

// 1. ADMIN DASHBOARD STATS & METRICS
exports.getAdminStats = async (req, res) => {
  try {
    const statsData = await firestoreService.getAdminStats();
    return res.json(statsData);
  } catch (err) {
    console.error('getAdminStats Error:', err.message);
    return res.status(500).json({ error: `Failed to load admin statistics from Cloud Firestore: ${err.message}` });
  }
};

// 2. EXAM MANAGEMENT CRUD
exports.getExams = async (req, res) => {
  try {
    const exams = await firestoreService.getExams(req.query.search);
    return res.json({ exams: exams || [] });
  } catch (err) {
    console.error('getExams Error:', err.message);
    return res.status(500).json({ error: `Failed to fetch exams from Cloud Firestore: ${err.message}` });
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
    return res.status(201).json({ message: 'Exam created successfully in Cloud Firestore!', examId: created.id });
  } catch (err) {
    console.error('createExam Error:', err.message);
    return res.status(500).json({ error: `Failed to create exam in Cloud Firestore: ${err.message}` });
  }
};

exports.updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, name, code, shortName, category, description, icon, is_active, isActive } = req.body;

    const examTitle = (title || name || '').trim();
    const examCode = (code || shortName || '').trim();

    await firestoreService.updateExam(id, {
      title: examTitle,
      name: examTitle,
      code: examCode ? examCode.toUpperCase() : undefined,
      shortName: examCode ? examCode.toUpperCase() : undefined,
      category,
      description,
      icon,
      isActive: isActive !== undefined ? isActive : (is_active !== undefined ? Boolean(is_active) : true)
    });
    return res.json({ message: 'Exam updated in Cloud Firestore!' });
  } catch (err) {
    console.error('updateExam Error:', err.message);
    return res.status(500).json({ error: `Failed to update exam in Cloud Firestore: ${err.message}` });
  }
};

exports.deleteExam = async (req, res) => {
  try {
    const { id } = req.params;
    await firestoreService.deleteExam(id);
    return res.json({ message: 'Exam deleted from Cloud Firestore!' });
  } catch (err) {
    console.error('deleteExam Error:', err.message);
    return res.status(500).json({ error: `Failed to delete exam from Cloud Firestore: ${err.message}` });
  }
};

// 3. EXAM SUBJECT MANAGEMENT
exports.getExamSubjects = async (req, res) => {
  try {
    const examId = req.query.examId || req.query.exam_id || '1';
    const subjects = await firestoreService.getExamSubjects(examId);
    return res.json({ subjects: subjects || [] });
  } catch (err) {
    console.error('getExamSubjects Error:', err.message);
    return res.status(500).json({ error: `Failed to fetch subjects from Cloud Firestore: ${err.message}` });
  }
};

exports.createExamSubject = async (req, res) => {
  try {
    const { exam_id, examId, title, name, code, weightage } = req.body;
    const targetExamId = exam_id || examId;
    const subjTitle = (title || name || '').trim();

    if (!targetExamId || !subjTitle) {
      return res.status(400).json({ error: 'Exam selection and Subject Title/Name are required.' });
    }

    const created = await firestoreService.createExamSubject(targetExamId, {
      title: subjTitle,
      name: subjTitle,
      code: code || '',
      weightage: weightage || ''
    });
    return res.status(201).json({ message: 'Subject added to Exam in Cloud Firestore!', subjectId: created.id });
  } catch (err) {
    console.error('createExamSubject Error:', err.message);
    return res.status(500).json({ error: `Failed to create subject in Cloud Firestore: ${err.message}` });
  }
};

exports.deleteExamSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const examId = req.query.examId || '1';
    await firestoreService.deleteExamSubject(examId, id);
    return res.json({ message: 'Subject deleted from Cloud Firestore!' });
  } catch (err) {
    console.error('deleteExamSubject Error:', err.message);
    return res.status(500).json({ error: `Failed to delete subject from Cloud Firestore: ${err.message}` });
  }
};

// 4. TOPICS MANAGEMENT
exports.getTopics = async (req, res) => {
  try {
    const examId = req.query.examId || '1';
    const subjectId = req.query.subjectId || req.query.subject_id || '1';
    const topics = await firestoreService.getTopics(examId, subjectId);
    return res.json({ topics: topics || [] });
  } catch (err) {
    console.error('getTopics Error:', err.message);
    return res.status(500).json({ error: `Failed to fetch topics from Cloud Firestore: ${err.message}` });
  }
};

exports.createTopic = async (req, res) => {
  try {
    const examId = req.body.examId || '1';
    const subjectId = req.body.subjectId || req.body.subject_id;
    const topicTitle = req.body.title || req.body.name;
    const { description, estimated_hours, estimatedHours, order_index, orderIndex } = req.body;

    if (!subjectId || !topicTitle) {
      return res.status(400).json({ error: 'Subject ID and Topic Title/Name are required.' });
    }

    const created = await firestoreService.createTopic(examId, subjectId, {
      title: topicTitle,
      name: topicTitle,
      description: description || '',
      estimatedHours: Number(estimatedHours || estimated_hours || 3),
      orderIndex: Number(orderIndex || order_index || 1)
    });
    return res.status(201).json({ message: 'Topic created in Cloud Firestore!', topicId: created.id });
  } catch (err) {
    console.error('createTopic Error:', err.message);
    return res.status(500).json({ error: `Failed to create topic in Cloud Firestore: ${err.message}` });
  }
};

exports.deleteTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const examId = req.query.examId || '1';
    const subjectId = req.query.subjectId || '1';
    await firestoreService.deleteTopic(examId, subjectId, id);
    return res.json({ message: 'Topic deleted from Cloud Firestore!' });
  } catch (err) {
    console.error('deleteTopic Error:', err.message);
    return res.status(500).json({ error: `Failed to delete topic from Cloud Firestore: ${err.message}` });
  }
};

// 5. STUDY MATERIALS MANAGEMENT
exports.getStudyMaterials = async (req, res) => {
  try {
    const materials = await firestoreService.getLearningResources(req.query);
    return res.json({ materials: materials || [] });
  } catch (err) {
    console.error('getStudyMaterials Error:', err.message);
    return res.status(500).json({ error: `Failed to fetch materials from Cloud Firestore: ${err.message}` });
  }
};

exports.createStudyMaterial = async (req, res) => {
  try {
    const adminId = req.user?.id || 'admin_1';
    const { title, exam_id, examId, subject_id, subjectId, topic_id, topicId, material_type, resource_type, file_url, url, source_name, sourceName, difficulty, description } = req.body;

    const targetExamId = exam_id || examId;
    if (!title || !targetExamId) {
      return res.status(400).json({ error: 'Title and Exam selection are required.' });
    }

    const created = await firestoreService.createLearningResource({
      title,
      examId: targetExamId,
      subjectId: subject_id || subjectId || null,
      topicId: topic_id || topicId || null,
      materialType: material_type || 'link',
      resourceType: resource_type || 'video',
      url: url || file_url || '',
      sourceName: sourceName || source_name || 'Educational Source',
      difficulty: difficulty || 'intermediate',
      description: description || '',
      uploadedBy: adminId
    });
    return res.status(201).json({ message: 'Study Resource uploaded successfully to Cloud Firestore!', materialId: created.id });
  } catch (err) {
    console.error('createStudyMaterial Error:', err.message);
    return res.status(500).json({ error: `Failed to create study material in Cloud Firestore: ${err.message}` });
  }
};

exports.deleteStudyMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    await firestoreService.deleteLearningResource(id);
    return res.json({ message: 'Study material deleted from Cloud Firestore!' });
  } catch (err) {
    console.error('deleteStudyMaterial Error:', err.message);
    return res.status(500).json({ error: `Failed to delete study material from Cloud Firestore: ${err.message}` });
  }
};

// 6. QUESTION BANK MANAGEMENT
exports.getQuestions = async (req, res) => {
  try {
    const questions = await firestoreService.getQuestionBank(req.query);
    return res.json({ questions: questions || [] });
  } catch (err) {
    console.error('getQuestions Error:', err.message);
    return res.status(500).json({ error: `Failed to fetch questions from Cloud Firestore: ${err.message}` });
  }
};

exports.createQuestion = async (req, res) => {
  try {
    const { exam_id, examId, subject_id, subjectId, topic_id, topicId, question_text, questionText, option_a, optionA, option_b, optionB, option_c, optionC, option_d, optionD, correct_option, correctOption, explanation, difficulty } = req.body;

    const qText = question_text || questionText;
    const optA = option_a || optionA;
    const optB = option_b || optionB;
    const optC = option_c || optionC;
    const optD = option_d || optionD;
    const correctOpt = correct_option || correctOption;

    if (!qText || !optA || !optB || !optC || !optD || !correctOpt) {
      return res.status(400).json({ error: 'Question text, all 4 options, and correct option (A/B/C/D) are required.' });
    }

    const created = await firestoreService.createQuestion({
      examId: exam_id || examId || '1',
      subjectId: subject_id || subjectId || '1',
      topicId: topic_id || topicId || null,
      questionText: qText,
      optionA: optA,
      optionB: optB,
      optionC: optC,
      optionD: optD,
      correctOption: correctOpt,
      explanation: explanation || '',
      difficulty: difficulty || 'medium'
    });
    return res.status(201).json({ message: 'Question added to Question Bank in Cloud Firestore!', questionId: created.id });
  } catch (err) {
    console.error('createQuestion Error:', err.message);
    return res.status(500).json({ error: `Failed to create question in Cloud Firestore: ${err.message}` });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    await firestoreService.deleteQuestion(id);
    return res.json({ message: 'Question deleted from Cloud Firestore!' });
  } catch (err) {
    console.error('deleteQuestion Error:', err.message);
    return res.status(500).json({ error: `Failed to delete question from Cloud Firestore: ${err.message}` });
  }
};

// 7. QUIZ & MOCK TEST MANAGEMENT
exports.createQuiz = async (req, res) => {
  try {
    const adminId = req.user?.id || 'admin_1';
    const { title, exam_id, examId, subject_id, subjectId, time_limit_mins, total_marks } = req.body;

    const finalExamId = exam_id || examId;
    if (!title || !finalExamId) {
      return res.status(400).json({ error: 'Title and Exam selection are required.' });
    }

    const created = await firestoreService.createQuiz({
      title,
      examId: finalExamId,
      subjectId: subject_id || subjectId || null,
      timeLimitMins: Number(time_limit_mins || 15),
      totalMarks: Number(total_marks || 10),
      createdBy: adminId
    });
    return res.status(201).json({ message: 'Quiz created and published to Cloud Firestore!', quizId: created.id });
  } catch (err) {
    console.error('createQuiz Error:', err.message);
    return res.status(500).json({ error: `Failed to create quiz in Cloud Firestore: ${err.message}` });
  }
};

exports.deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    await firestoreService.deleteQuiz(id);
    return res.json({ message: 'Quiz deleted from Cloud Firestore!' });
  } catch (err) {
    console.error('deleteQuiz Error:', err.message);
    return res.status(500).json({ error: `Failed to delete quiz from Cloud Firestore: ${err.message}` });
  }
};

// 8. USER MANAGEMENT & STUDENT ACCOUNTS
exports.getStudents = async (req, res) => {
  try {
    const students = await firestoreService.getStudents();
    return res.json({ students });
  } catch (err) {
    console.error('getStudents Error:', err.message);
    return res.status(500).json({ error: `Failed to fetch student directory from Cloud Firestore: ${err.message}` });
  }
};

exports.toggleStudentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await firestoreService.toggleStudentStatus(id, status);
    return res.json({ message: `Student status set to ${status || 'active'} in Cloud Firestore.` });
  } catch (err) {
    console.error('toggleStudentStatus Error:', err.message);
    return res.status(500).json({ error: `Failed to update student status in Cloud Firestore: ${err.message}` });
  }
};

// 9. ANNOUNCEMENTS / NOTIFICATIONS
exports.sendNotification = async (req, res) => {
  try {
    const { title, message, type } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required.' });
    }

    const students = await firestoreService.getStudents();
    for (const s of students) {
      await firestoreService.addNotification(s.id, {
        title,
        message,
        type: type || 'announcement'
      });
    }
    return res.status(201).json({ message: `Announcement broadcasted to ${students.length} students in Cloud Firestore!` });
  } catch (err) {
    console.error('sendNotification Error:', err.message);
    return res.status(500).json({ error: `Failed to send announcement: ${err.message}` });
  }
};

// 10. SUBTOPIC MANAGEMENT
exports.getSubtopics = async (req, res) => {
  try {
    const examId = req.query.examId || '1';
    const subjectId = req.query.subjectId || '1';
    const topicId = req.query.topic_id || req.query.topicId;

    if (topicId) {
      const subtopics = await firestoreService.getSubtopics(examId, subjectId, topicId);
      return res.json({ subtopics: subtopics || [] });
    }
    return res.json({ subtopics: [] });
  } catch (err) {
    console.error('getSubtopics Error:', err.message);
    return res.status(500).json({ error: `Failed to fetch subtopics from Cloud Firestore: ${err.message}` });
  }
};

exports.createSubtopic = async (req, res) => {
  try {
    const examId = req.body.examId || '1';
    const subjectId = req.body.subjectId || '1';
    const topicId = req.body.topic_id || req.body.topicId;
    const subtopicTitle = req.body.title || req.body.name;
    const { description, order_index, orderIndex } = req.body;

    if (!topicId || !subtopicTitle) {
      return res.status(400).json({ error: 'Topic ID and Subtopic Title/Name are required.' });
    }

    const created = await firestoreService.createSubtopic(examId, subjectId, topicId, {
      title: subtopicTitle,
      name: subtopicTitle,
      description: description || '',
      orderIndex: Number(orderIndex || order_index || 1)
    });
    return res.status(201).json({ message: 'Subtopic added in Cloud Firestore!', subtopicId: created.id });
  } catch (err) {
    console.error('createSubtopic Error:', err.message);
    return res.status(500).json({ error: `Failed to create subtopic in Cloud Firestore: ${err.message}` });
  }
};

exports.deleteSubtopic = async (req, res) => {
  try {
    const { id } = req.params;
    const examId = req.query.examId || '1';
    const subjectId = req.query.subjectId || '1';
    const topicId = req.query.topicId || '1';

    await firestoreService.deleteSubtopic(examId, subjectId, topicId, id);
    return res.json({ message: 'Subtopic deleted from Cloud Firestore!' });
  } catch (err) {
    console.error('deleteSubtopic Error:', err.message);
    return res.status(500).json({ error: `Failed to delete subtopic from Cloud Firestore: ${err.message}` });
  }
};

// 11. MOCK TEST MANAGEMENT
exports.getMockTests = async (req, res) => {
  try {
    const mockTests = await firestoreService.getMockTests();
    return res.json({ mockTests: mockTests || [] });
  } catch (err) {
    console.error('getMockTests Error:', err.message);
    return res.status(500).json({ error: `Failed to fetch mock tests from Cloud Firestore: ${err.message}` });
  }
};

exports.createMockTest = async (req, res) => {
  try {
    const { title, exam_id, examId, duration_mins, total_questions, passing_score } = req.body;
    const finalExamId = exam_id || examId;

    if (!title || !finalExamId) {
      return res.status(400).json({ error: 'Title and Exam selection are required.' });
    }

    const created = await firestoreService.createMockTest({
      title,
      examId: finalExamId,
      durationMins: Number(duration_mins || 60),
      totalQuestions: Number(total_questions || 30),
      passingScore: Number(passing_score || 50.0)
    });
    return res.status(201).json({ message: 'Mock Test created in Cloud Firestore!', mockTestId: created.id });
  } catch (err) {
    console.error('createMockTest Error:', err.message);
    return res.status(500).json({ error: `Failed to create mock test in Cloud Firestore: ${err.message}` });
  }
};

exports.deleteMockTest = async (req, res) => {
  try {
    const { id } = req.params;
    await firestoreService.deleteMockTest(id);
    return res.json({ message: 'Mock test deleted from Cloud Firestore!' });
  } catch (err) {
    console.error('deleteMockTest Error:', err.message);
    return res.status(500).json({ error: `Failed to delete mock test from Cloud Firestore: ${err.message}` });
  }
};

exports.updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    await firestoreService.updateSubject(id, req.body);
    return res.json({ message: 'Subject updated successfully in Cloud Firestore!' });
  } catch (err) {
    console.error('updateSubject Error:', err.message);
    return res.status(500).json({ error: `Failed to update subject in Cloud Firestore: ${err.message}` });
  }
};

exports.updateTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const examId = req.body.examId || '1';
    const subjectId = req.body.subjectId || '1';
    await firestoreService.updateTopic(examId, subjectId, id, req.body);
    return res.json({ message: 'Topic updated successfully in Cloud Firestore!' });
  } catch (err) {
    console.error('updateTopic Error:', err.message);
    return res.status(500).json({ error: `Failed to update topic in Cloud Firestore: ${err.message}` });
  }
};

exports.updateSubtopic = async (req, res) => {
  try {
    const { id } = req.params;
    const examId = req.body.examId || '1';
    const subjectId = req.body.subjectId || '1';
    const topicId = req.body.topicId || '1';
    await firestoreService.updateSubtopic(examId, subjectId, topicId, id, req.body);
    return res.json({ message: 'Subtopic updated successfully in Cloud Firestore!' });
  } catch (err) {
    console.error('updateSubtopic Error:', err.message);
    return res.status(500).json({ error: `Failed to update subtopic in Cloud Firestore: ${err.message}` });
  }
};

exports.updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    await firestoreService.updateQuestion(id, req.body);
    return res.json({ message: 'Question updated successfully in Cloud Firestore!' });
  } catch (err) {
    console.error('updateQuestion Error:', err.message);
    return res.status(500).json({ error: `Failed to update question in Cloud Firestore: ${err.message}` });
  }
};

exports.updateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    await firestoreService.updateQuiz(id, req.body);
    return res.json({ message: 'Quiz updated successfully in Cloud Firestore!' });
  } catch (err) {
    console.error('updateQuiz Error:', err.message);
    return res.status(500).json({ error: `Failed to update quiz in Cloud Firestore: ${err.message}` });
  }
};

exports.updateMockTest = async (req, res) => {
  try {
    const { id } = req.params;
    await firestoreService.updateMockTest(id, req.body);
    return res.json({ message: 'Mock test updated successfully in Cloud Firestore!' });
  } catch (err) {
    console.error('updateMockTest Error:', err.message);
    return res.status(500).json({ error: `Failed to update mock test in Cloud Firestore: ${err.message}` });
  }
};

// Function Aliases for adminRoutes
exports.getSubjects = exports.getExamSubjects;
exports.createSubject = exports.createExamSubject;
exports.deleteSubject = exports.deleteExamSubject;

exports.getMaterials = exports.getStudyMaterials;
exports.createMaterial = exports.createStudyMaterial;
exports.updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    await firestoreService.updateLearningResource(id, req.body);
    return res.json({ message: 'Study material updated in Cloud Firestore!' });
  } catch (err) {
    console.error('updateMaterial Error:', err.message);
    return res.status(500).json({ error: `Failed to update material in Cloud Firestore: ${err.message}` });
  }
};
exports.deleteMaterial = exports.deleteStudyMaterial;

