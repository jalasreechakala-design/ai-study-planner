const firestoreService = require('../services/firestoreService');

// Utility Badge Evaluator using Cloud Firestore
async function evaluateBadges(userId) {
  try {
    const streak = await firestoreService.getUserStreak(userId).catch(() => ({ currentStreak: 1, badges: [] }));
    let badgeSet = new Set(streak.badges || []);

    const sessionsData = await firestoreService.getUserStudySessions(userId, 'all').catch(() => ({ allSessions: [] }));
    if ((sessionsData.allSessions || []).length > 0) {
      badgeSet.add('First Study Session');
    }

    const currentStreak = Number(streak.currentStreak || streak.current_streak || 1);
    if (currentStreak >= 3) badgeSet.add('3 Day Streak');
    if (currentStreak >= 7) badgeSet.add('7 Day Streak');
    if (currentStreak >= 30) badgeSet.add('30 Day Streak');

    const tasks = await firestoreService.getUserTasks(userId).catch(() => []);
    const completedTasks = tasks.filter(t => t.completed === true || t.status === 'completed').length;
    if (completedTasks >= 10) badgeSet.add('10 Tasks Completed');

    const quizResults = await firestoreService.getUserQuizResults(userId).catch(() => []);
    if (quizResults.length >= 10) badgeSet.add('10 Quiz Attempts');

    const updatedBadges = Array.from(badgeSet);
    const db = firestoreService.firestore;
    if (db) {
      await db.collection('users').doc(String(userId)).collection('study_streaks').doc('main').set({
        badges: updatedBadges,
        badges_json: JSON.stringify(updatedBadges),
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(() => null);
    }
    return updatedBadges;
  } catch (err) {
    console.error('evaluateBadges Error:', err.message);
    return [];
  }
}

// 1. DASHBOARD SUMMARY
exports.getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User is not authenticated.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const userDoc = await firestoreService.getUserById(userId).catch(() => null);
    const userName = userDoc?.name || req.user.name || 'Student';
    const profile = userDoc?.profile || null;

    const tasks = await firestoreService.getUserTasks(userId).catch(() => []);
    const attData = await firestoreService.getUserAttendance(userId).catch(() => ({ attendance: [], overallPercentage: 100 }));
    const cgpaData = await firestoreService.getUserCgpaRecords(userId).catch(() => ({ records: [], cumulativeCGPA: 0, totalCredits: 0 }));
    const goals = await firestoreService.getUserGoals(userId).catch(() => []);
    const sessionsData = await firestoreService.getUserStudySessions(userId, 'all').catch(() => ({ allSessions: [] }));
    const streak = await firestoreService.getUserStreak(userId).catch(() => ({ currentStreak: 0, longestStreak: 0, lastActiveDate: null, isStreakActiveToday: false }));
    const badges = await evaluateBadges(userId);

    const notes = await firestoreService.getUserNotes(userId).catch(() => []);
    const subjects = await firestoreService.getUserSubjects(userId).catch(() => []);
    const assignments = await firestoreService.getUserAssignments(userId).catch(() => []);
    const reminders = await firestoreService.getUserReminders(userId).catch(() => []);

    const pendingTasks = tasks.filter(t => t.completed !== true && t.status !== 'completed');
    const completedTasks = tasks.filter(t => t.completed === true || t.status === 'completed');
    const upcomingDeadlines = pendingTasks.slice(0, 5);

    const pendingAssignments = assignments.filter(a => a.completed !== true && a.status !== 'completed');

    const allSessions = sessionsData.allSessions || [];
    let todayMinutes = 0;
    let totalMinutes = 0;

    allSessions.forEach(s => {
      const dur = Number(s.durationMinutes || s.duration_minutes || s.duration || 0);
      totalMinutes += dur;
      if (s.createdAt && s.createdAt.startsWith(todayStr)) {
        todayMinutes += dur;
      }
    });

    return res.json({
      welcomeMessage: `Welcome back, ${userName}!`,
      todayDate: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      profile,
      taskSummary: {
        total: tasks.length,
        pending: pendingTasks.length,
        completed: completedTasks.length,
        upcomingDeadlines
      },
      notesSummary: {
        total: notes.length,
        recent: notes.slice(0, 3)
      },
      subjectsSummary: {
        total: subjects.length,
        list: subjects.slice(0, 4)
      },
      assignmentsSummary: {
        total: assignments.length,
        pending: pendingAssignments.length,
        list: pendingAssignments.slice(0, 4)
      },
      remindersSummary: {
        total: reminders.length,
        list: reminders.slice(0, 4)
      },
      attendanceSummary: {
        records: attData.attendance || [],
        overallPercentage: attData.overallPercentage || 100
      },
      cgpaSummary: {
        records: cgpaData.records || [],
        cumulativeCGPA: Number(cgpaData.cumulativeCGPA || 0),
        totalCredits: cgpaData.totalCredits || 0
      },
      goals,
      activeGoals: goals.filter(g => g.completed !== true && g.status !== 'completed'),
      studySummary: {
        todayHours: (todayMinutes / 60).toFixed(1),
        totalHours: (totalMinutes / 60).toFixed(1),
        currentStreak: streak?.currentStreak ?? streak?.current_streak ?? 0,
        longestStreak: streak?.longestStreak ?? streak?.longest_streak ?? 0,
        lastActiveDate: streak?.lastActiveDate || streak?.last_active_date || null,
        isStreakActiveToday: Boolean(streak?.isStreakActiveToday),
        badges
      }
    });
  } catch (err) {
    console.error('getDashboardSummary Error:', err.message);
    return res.status(500).json({ error: `Failed to load dashboard summary from Cloud Firestore: ${err.message}` });
  }
};

// 2. TASK MANAGEMENT CRUD (Firestore: users/{userId}/tasks/{taskId})
exports.getTasks = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const { search, priority, status, subject } = req.query;
    const tasks = await firestoreService.getUserTasks(userId, { search, priority, status, subject });
    return res.json({ tasks });
  } catch (err) {
    console.error('getTasks Error:', err.message);
    return res.status(500).json({ error: `Failed to fetch tasks from Cloud Firestore: ${err.message}` });
  }
};

exports.createTask = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const { title, taskName, description, subject_name, subject, due_date, dueDate, priority, category } = req.body;
    const nameVal = taskName || title;

    if (!nameVal) {
      return res.status(400).json({ error: 'Task title / taskName is required.' });
    }

    const createdTask = await firestoreService.createTask(userId, {
      taskName: nameVal,
      title: nameVal,
      description: description || '',
      subject: subject || subject_name || 'General',
      subject_name: subject_name || subject || 'General',
      dueDate: dueDate || due_date || null,
      due_date: due_date || dueDate || null,
      priority: priority || 'medium',
      completed: false,
      status: 'pending',
      category: category || 'college'
    });

    return res.status(201).json({ message: 'Task created successfully in Cloud Firestore!', taskId: createdTask.id, task: createdTask });
  } catch (err) {
    console.error('createTask Error:', err.message);
    return res.status(500).json({ error: `Failed to create task in Cloud Firestore: ${err.message}` });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const { id } = req.params;
    const { title, taskName, description, subject_name, subject, due_date, dueDate, priority, status, completed, category } = req.body;

    const updated = await firestoreService.updateTask(userId, id, {
      taskName: taskName || title,
      title: title || taskName,
      description,
      subject: subject || subject_name,
      subject_name: subject_name || subject,
      dueDate: dueDate || due_date,
      due_date: due_date || dueDate,
      priority,
      status,
      completed,
      category
    });

    let streak = null;
    if (updated.completed === true || updated.status === 'completed') {
      streak = await firestoreService.updateUserStreak(userId);
    }
    await evaluateBadges(userId);
    return res.json({ message: 'Task updated successfully in Cloud Firestore!', task: updated, streak });
  } catch (err) {
    console.error('updateTask Error:', err.message);
    return res.status(500).json({ error: `Failed to update task in Cloud Firestore: ${err.message}` });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const { id } = req.params;
    const { status, completed } = req.body;

    const updated = await firestoreService.updateTaskStatus(userId, id, completed !== undefined ? completed : status);

    let streak = null;
    if (updated.completed === true || updated.status === 'completed') {
      streak = await firestoreService.updateUserStreak(userId);
    }
    await evaluateBadges(userId);
    return res.json({ message: 'Task status updated in Cloud Firestore!', task: updated, streak });
  } catch (err) {
    console.error('updateTaskStatus Error:', err.message);
    return res.status(500).json({ error: `Failed to update task status in Cloud Firestore: ${err.message}` });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const { id } = req.params;
    await firestoreService.deleteTask(userId, id);
    return res.json({ message: 'Task deleted successfully from Cloud Firestore!' });
  } catch (err) {
    console.error('deleteTask Error:', err.message);
    return res.status(500).json({ error: `Failed to delete task from Cloud Firestore: ${err.message}` });
  }
};

// 3. STUDY NOTES CRUD (Firestore: users/{userId}/notes/{noteId})
exports.getNotes = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const { search, subject } = req.query;
    const notes = await firestoreService.getUserNotes(userId, { search, subject });
    return res.json({ notes });
  } catch (err) {
    console.error('getNotes Error:', err.message);
    return res.status(500).json({ error: `Failed to fetch notes from Cloud Firestore: ${err.message}` });
  }
};

exports.createNote = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const { title, content, subject_name, subject, category, tags } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Note title and content are required.' });
    }

    const subj = subject || subject_name || category || 'General';

    const createdNote = await firestoreService.createNote(userId, {
      title,
      content,
      subject: subj,
      subject_name: subj,
      category: category || 'General',
      tags: tags || ''
    });

    return res.status(201).json({ message: 'Note saved successfully in Cloud Firestore!', noteId: createdNote.id, note: createdNote });
  } catch (err) {
    console.error('createNote Error:', err.message);
    return res.status(500).json({ error: `Failed to create note in Cloud Firestore: ${err.message}` });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const { id } = req.params;
    const { title, content, subject_name, subject, category, tags } = req.body;

    const subj = subject || subject_name || category;

    const updated = await firestoreService.updateNote(userId, id, {
      title,
      content,
      subject: subj,
      subject_name: subj,
      category,
      tags
    });

    return res.json({ message: 'Note updated successfully in Cloud Firestore!', note: updated });
  } catch (err) {
    console.error('updateNote Error:', err.message);
    return res.status(500).json({ error: `Failed to update note in Cloud Firestore: ${err.message}` });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const { id } = req.params;
    await firestoreService.deleteNote(userId, id);
    return res.json({ message: 'Note deleted successfully from Cloud Firestore!' });
  } catch (err) {
    console.error('deleteNote Error:', err.message);
    return res.status(500).json({ error: `Failed to delete note from Cloud Firestore: ${err.message}` });
  }
};

// 4. ATTENDANCE TRACKER (Firestore: users/{userId}/attendance/{attendanceId})
exports.getAttendance = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const data = await firestoreService.getUserAttendance(userId);
    return res.json(data);
  } catch (err) {
    console.error('getAttendance Error:', err.message);
    return res.status(500).json({ error: `Failed to fetch attendance from Cloud Firestore: ${err.message}` });
  }
};

exports.addAttendance = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const { subject_name, subjectName, attended_classes, attendedClasses, total_classes, totalClasses, target_percentage, targetPercentage } = req.body;
    const subj = subjectName || subject_name;
    const attended = Number(attendedClasses ?? attended_classes ?? 0);
    const total = Number(totalClasses ?? total_classes ?? 0);
    const targetPct = Number(targetPercentage ?? target_percentage ?? 75);

    if (!subj) {
      return res.status(400).json({ error: 'Subject name is required.' });
    }

    const created = await firestoreService.createAttendance(userId, {
      subjectName: subj,
      attendedClasses: attended,
      totalClasses: total,
      targetPercentage: targetPct
    });

    return res.status(201).json({ message: 'Attendance record added to Cloud Firestore!', recordId: created.id, record: created });
  } catch (err) {
    console.error('addAttendance Error:', err.message);
    return res.status(500).json({ error: `Failed to add attendance to Cloud Firestore: ${err.message}` });
  }
};

exports.updateAttendance = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const { id } = req.params;
    const updated = await firestoreService.updateAttendance(userId, id, req.body);
    return res.json({ message: 'Attendance updated successfully in Cloud Firestore!', record: updated });
  } catch (err) {
    console.error('updateAttendance Error:', err.message);
    return res.status(500).json({ error: `Failed to update attendance in Cloud Firestore: ${err.message}` });
  }
};

exports.deleteAttendance = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const { id } = req.params;
    await firestoreService.deleteAttendance(userId, id);
    return res.json({ message: 'Attendance record deleted from Cloud Firestore!' });
  } catch (err) {
    console.error('deleteAttendance Error:', err.message);
    return res.status(500).json({ error: `Failed to delete attendance from Cloud Firestore: ${err.message}` });
  }
};

// 5. CGPA CALCULATOR & SEMESTER SGPAs (Firestore: users/{userId}/cgpa_records/{recordId})
exports.getCgpaRecords = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const data = await firestoreService.getUserCgpaRecords(userId);
    return res.json(data);
  } catch (err) {
    console.error('getCgpaRecords Error:', err.message);
    return res.status(500).json({ error: `Failed to fetch CGPA records from Cloud Firestore: ${err.message}` });
  }
};

exports.addCgpaRecord = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const created = await firestoreService.createCgpaRecord(userId, req.body);
    return res.status(201).json({ message: 'CGPA record added to Cloud Firestore!', recordId: created.id, record: created });
  } catch (err) {
    console.error('addCgpaRecord Error:', err.message);
    return res.status(500).json({ error: `Failed to add CGPA record to Cloud Firestore: ${err.message}` });
  }
};

exports.updateCgpaRecord = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const { id } = req.params;
    const updated = await firestoreService.updateCgpaRecord(userId, id, req.body);
    return res.json({ message: 'CGPA record updated in Cloud Firestore!', record: updated });
  } catch (err) {
    console.error('updateCgpaRecord Error:', err.message);
    return res.status(500).json({ error: `Failed to update CGPA record in Cloud Firestore: ${err.message}` });
  }
};

exports.deleteCgpaRecord = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const { id } = req.params;
    await firestoreService.deleteCgpaRecord(userId, id);
    return res.json({ message: 'CGPA record deleted from Cloud Firestore!' });
  } catch (err) {
    console.error('deleteCgpaRecord Error:', err.message);
    return res.status(500).json({ error: `Failed to delete CGPA record from Cloud Firestore: ${err.message}` });
  }
};

// 6. ACADEMIC GOALS (Firestore: users/{userId}/goals/{goalId})
exports.getGoals = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const goals = await firestoreService.getUserGoals(userId);
    return res.json({ goals });
  } catch (err) {
    console.error('getGoals Error:', err.message);
    return res.status(500).json({ error: `Failed to fetch goals from Cloud Firestore: ${err.message}` });
  }
};

exports.createGoal = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const created = await firestoreService.createGoal(userId, req.body);
    return res.status(201).json({ message: 'Goal created in Cloud Firestore!', goalId: created.id, goal: created });
  } catch (err) {
    console.error('createGoal Error:', err.message);
    return res.status(500).json({ error: `Failed to create goal in Cloud Firestore: ${err.message}` });
  }
};

exports.updateGoal = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const { id } = req.params;
    const updated = await firestoreService.updateGoal(userId, id, req.body);
    return res.json({ message: 'Goal updated in Cloud Firestore!', goal: updated });
  } catch (err) {
    console.error('updateGoal Error:', err.message);
    return res.status(500).json({ error: `Failed to update goal in Cloud Firestore: ${err.message}` });
  }
};

exports.deleteGoal = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const { id } = req.params;
    await firestoreService.deleteGoal(userId, id);
    return res.json({ message: 'Goal deleted from Cloud Firestore!' });
  } catch (err) {
    console.error('deleteGoal Error:', err.message);
    return res.status(500).json({ error: `Failed to delete goal from Cloud Firestore: ${err.message}` });
  }
};

// 7. STUDY SESSIONS & POMODORO (Firestore: users/{userId}/study_sessions/{sessionId})
exports.logStudySession = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const session = await firestoreService.recordStudySession(userId, req.body);
    const streak = await firestoreService.updateUserStreak(userId);
    await evaluateBadges(userId);
    return res.status(201).json({ message: 'Study session logged to Cloud Firestore!', session, streak });
  } catch (err) {
    console.error('logStudySession Error:', err.message);
    return res.status(500).json({ error: `Failed to log study session to Cloud Firestore: ${err.message}` });
  }
};

exports.triggerStreakUpdate = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const streak = await firestoreService.updateUserStreak(userId);
    await evaluateBadges(userId);
    return res.json({ message: 'Study streak updated successfully!', streak });
  } catch (err) {
    console.error('triggerStreakUpdate Error:', err.message);
    return res.status(500).json({ error: `Failed to update study streak in Cloud Firestore: ${err.message}` });
  }
};

exports.getStreaksAndBadges = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const streak = await firestoreService.getUserStreak(userId);
    const badges = await evaluateBadges(userId);
    return res.json({ streak, badges });
  } catch (err) {
    console.error('getStreaksAndBadges Error:', err.message);
    return res.status(500).json({ error: `Failed to fetch streaks/badges from Cloud Firestore: ${err.message}` });
  }
};

exports.getStudyAnalytics = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const analytics = await firestoreService.getUserAnalytics(userId);
    return res.json(analytics);
  } catch (err) {
    console.error('getStudyAnalytics Error:', err.message);
    return res.status(500).json({ error: `Failed to fetch analytics from Cloud Firestore: ${err.message}` });
  }
};

// 8. SUBJECTS CRUD (Firestore: users/{userId}/subjects/{subjectId})
exports.getSubjects = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const subjects = await firestoreService.getUserSubjects(userId, req.query);
    return res.json({ subjects });
  } catch (err) {
    console.error('getSubjects Error:', err.message);
    return res.status(500).json({ error: `Failed to fetch subjects from Cloud Firestore: ${err.message}` });
  }
};

exports.createSubject = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const created = await firestoreService.createUserSubject(userId, req.body);
    return res.status(201).json({ message: 'Subject created in Cloud Firestore!', subject: created });
  } catch (err) {
    console.error('createSubject Error:', err.message);
    return res.status(500).json({ error: `Failed to create subject in Cloud Firestore: ${err.message}` });
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const { id } = req.params;
    await firestoreService.deleteUserSubject(userId, id);
    return res.json({ message: 'Subject deleted from Cloud Firestore!' });
  } catch (err) {
    console.error('deleteSubject Error:', err.message);
    return res.status(500).json({ error: `Failed to delete subject from Cloud Firestore: ${err.message}` });
  }
};

// 9. ASSIGNMENTS CRUD (Firestore: users/{userId}/assignments/{assignmentId})
exports.getAssignments = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const assignments = await firestoreService.getUserAssignments(userId, req.query);
    return res.json({ assignments });
  } catch (err) {
    console.error('getAssignments Error:', err.message);
    return res.status(500).json({ error: `Failed to fetch assignments from Cloud Firestore: ${err.message}` });
  }
};

exports.createAssignment = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const created = await firestoreService.createAssignment(userId, req.body);
    return res.status(201).json({ message: 'Assignment created in Cloud Firestore!', assignment: created });
  } catch (err) {
    console.error('createAssignment Error:', err.message);
    return res.status(500).json({ error: `Failed to create assignment in Cloud Firestore: ${err.message}` });
  }
};

exports.updateAssignment = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const { id } = req.params;
    const updated = await firestoreService.updateAssignment(userId, id, req.body);

    let streak = null;
    if (updated.completed === true || updated.status === 'completed') {
      streak = await firestoreService.updateUserStreak(userId);
    }
    return res.json({ message: 'Assignment updated in Cloud Firestore!', assignment: updated, streak });
  } catch (err) {
    console.error('updateAssignment Error:', err.message);
    return res.status(500).json({ error: `Failed to update assignment in Cloud Firestore: ${err.message}` });
  }
};

exports.deleteAssignment = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const { id } = req.params;
    await firestoreService.deleteAssignment(userId, id);
    return res.json({ message: 'Assignment deleted from Cloud Firestore!' });
  } catch (err) {
    console.error('deleteAssignment Error:', err.message);
    return res.status(500).json({ error: `Failed to delete assignment from Cloud Firestore: ${err.message}` });
  }
};

// 10. REMINDERS CRUD (Firestore: users/{userId}/reminders/{reminderId})
exports.getReminders = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const reminders = await firestoreService.getUserReminders(userId, req.query);
    return res.json({ reminders });
  } catch (err) {
    console.error('getReminders Error:', err.message);
    return res.status(500).json({ error: `Failed to fetch reminders from Cloud Firestore: ${err.message}` });
  }
};

exports.createReminder = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const created = await firestoreService.createReminder(userId, req.body);
    return res.status(201).json({ message: 'Reminder created in Cloud Firestore!', reminder: created });
  } catch (err) {
    console.error('createReminder Error:', err.message);
    return res.status(500).json({ error: `Failed to create reminder in Cloud Firestore: ${err.message}` });
  }
};

exports.deleteReminder = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const { id } = req.params;
    await firestoreService.deleteReminder(userId, id);
    return res.json({ message: 'Reminder deleted from Cloud Firestore!' });
  } catch (err) {
    console.error('deleteReminder Error:', err.message);
    return res.status(500).json({ error: `Failed to delete reminder from Cloud Firestore: ${err.message}` });
  }
};
