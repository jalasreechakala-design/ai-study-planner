const db = require('../config/db');
const firestoreService = require('../services/firestoreService');

// Utility Badge Evaluator
async function evaluateBadges(userId) {
  const streakRows = await db.query('SELECT * FROM study_streaks WHERE user_id = ?', [userId]);
  let streak = streakRows && streakRows.length > 0 ? streakRows[0] : null;

  if (!streak) return [];

  let badges = [];
  try {
    badges = JSON.parse(streak.badges_json || '[]');
  } catch (e) {
    badges = [];
  }

  const badgeSet = new Set(badges);

  // Check 1: First Study Session
  const sessionCountRows = await db.query('SELECT COUNT(*) as cnt FROM study_sessions WHERE user_id = ?', [userId]);
  const sessCnt = sessionCountRows[0]?.cnt || 0;
  if (sessCnt > 0) badgeSet.add('First Study Session');

  // Check 2: Streaks
  if (streak.current_streak >= 3) badgeSet.add('3 Day Streak');
  if (streak.current_streak >= 7) badgeSet.add('7 Day Streak');
  if (streak.current_streak >= 30) badgeSet.add('30 Day Streak');

  // Check 3: 10 Tasks Completed
  const completedTaskRows = await db.query("SELECT COUNT(*) as cnt FROM tasks WHERE user_id = ? AND status = 'completed'", [userId]);
  const completedTasks = completedTaskRows[0]?.cnt || 0;
  if (completedTasks >= 10) badgeSet.add('10 Tasks Completed');

  // Check 4: 10 Quiz Attempts
  const quizAttemptRows = await db.query('SELECT COUNT(*) as cnt FROM quiz_results WHERE user_id = ?', [userId]);
  const quizAttempts = quizAttemptRows[0]?.cnt || 0;
  if (quizAttempts >= 10) badgeSet.add('10 Quiz Attempts');

  const updatedBadges = Array.from(badgeSet);
  await db.query(
    'UPDATE study_streaks SET tasks_completed_count = ?, quizzes_attempted_count = ?, badges_json = ? WHERE user_id = ?',
    [completedTasks, quizAttempts, JSON.stringify(updatedBadges), userId]
  );

  return updatedBadges;
}

// 1. DASHBOARD SUMMARY
exports.getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const todayStr = new Date().toISOString().split('T')[0];

    // Fetch user & profile
    let users = [];
    let profiles = [];
    let tasks = [];
    let attendance = [];
    let cgpaRecords = [];
    let goals = [];
    let overallAttendance = 100;
    let cumulativeCGPA = '0.00';
    let totalCredits = 0;

    if (firestoreService.firestore) {
      tasks = await firestoreService.getUserTasks(userId);
      const attData = await firestoreService.getUserAttendance(userId);
      attendance = attData.attendance || [];
      overallAttendance = attData.overallPercentage || 100;

      const cgpaData = await firestoreService.getUserCgpaRecords(userId);
      cgpaRecords = cgpaData.records || [];
      cumulativeCGPA = cgpaData.cumulativeCGPA || '0.00';
      totalCredits = cgpaData.totalCredits || 0;

      goals = await firestoreService.getUserGoals(userId);
      users = await db.query('SELECT name, email FROM users WHERE id = ?', [userId]).catch(() => [{ name: 'Student' }]);
      profiles = await db.query('SELECT * FROM student_profiles WHERE user_id = ?', [userId]).catch(() => []);
    } else {
      users = await db.query('SELECT name, email FROM users WHERE id = ?', [userId]);
      profiles = await db.query('SELECT * FROM student_profiles WHERE user_id = ?', [userId]);
      tasks = await db.query('SELECT * FROM tasks WHERE user_id = ? ORDER BY due_date ASC', [userId]);
      attendance = await db.query('SELECT * FROM attendance WHERE user_id = ?', [userId]);
      let totalAttended = 0;
      let totalClasses = 0;
      attendance.forEach(a => {
        totalAttended += Number(a.attended_classes || a.attendedClasses || 0);
        totalClasses += Number(a.total_classes || a.totalClasses || 0);
      });
      overallAttendance = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 100;

      cgpaRecords = await db.query('SELECT * FROM cgpa_records WHERE user_id = ?', [userId]);
      let totalPoints = 0;
      cgpaRecords.forEach(c => {
        totalPoints += Number(c.gpa || c.gradePoints || 0) * Number(c.credits || 0);
        totalCredits += Number(c.credits || 0);
      });
      cumulativeCGPA = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
      goals = await db.query('SELECT * FROM goals WHERE user_id = ? ORDER BY target_date ASC', [userId]);
    }

    const pendingTasks = tasks.filter(t => t.completed !== true && t.status !== 'completed');
    const completedTasks = tasks.filter(t => t.completed === true || t.status === 'completed');
    const upcomingDeadlines = pendingTasks.slice(0, 5);

    // Study Sessions & Today's Hours
    const sessions = await db.query('SELECT * FROM study_sessions WHERE user_id = ?', [userId]).catch(() => []);
    let todayMinutes = 0;
    let totalMinutes = 0;
    sessions.forEach(s => {
      totalMinutes += Number(s.duration_minutes || 0);
      if (s.created_at && s.created_at.startsWith(todayStr)) {
        todayMinutes += Number(s.duration_minutes || 0);
      }
    });

    // Streaks & Badges
    const streakRows = await db.query('SELECT * FROM study_streaks WHERE user_id = ?', [userId]).catch(() => []);
    const streak = streakRows && streakRows.length > 0 ? streakRows[0] : { current_streak: 1, longest_streak: 1, badges_json: '[]' };
    const badges = await evaluateBadges(userId).catch(() => []);

    return res.json({
      welcomeMessage: `Welcome back, ${users[0]?.name || 'Student'}!`,
      todayDate: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      profile: profiles[0] || null,
      taskSummary: {
        total: tasks.length,
        pending: pendingTasks.length,
        completed: completedTasks.length,
        upcomingDeadlines
      },
      attendanceSummary: {
        records: attendance,
        overallPercentage: overallAttendance
      },
      cgpaSummary: {
        records: cgpaRecords,
        cumulativeCGPA: Number(cumulativeCGPA),
        totalCredits
      },
      goals,
      activeGoals: goals.filter(g => g.completed !== true && g.status !== 'completed'),
      studySummary: {
        todayHours: (todayMinutes / 60).toFixed(1),
        totalHours: (totalMinutes / 60).toFixed(1),
        currentStreak: streak.current_streak || 1,
        badges
      }
    });
  } catch (err) {
    console.error('getDashboardSummary Error:', err.message);
    return res.status(500).json({ error: `Failed to load dashboard summary: ${err.message}` });
  }
};

// 2. TASK MANAGEMENT CRUD (Firebase Firestore: users/{userId}/tasks/{taskId})
exports.getTasks = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User is not authenticated.' });
    }

    const { search, priority, status, subject } = req.query;

    let tasks;
    if (firestoreService.firestore) {
      tasks = await firestoreService.getUserTasks(userId, { search, priority, status, subject });
    } else {
      // Fallback to MySQL/JSON store if Firestore DB instance is not attached
      tasks = await db.query('SELECT * FROM tasks WHERE user_id = ? ORDER BY due_date ASC', [userId]);

      if (search) {
        const q = search.toLowerCase();
        tasks = tasks.filter(t => (t.title && t.title.toLowerCase().includes(q)) || (t.taskName && t.taskName.toLowerCase().includes(q)) || (t.description && t.description.toLowerCase().includes(q)));
      }
      if (priority && priority !== 'all') {
        tasks = tasks.filter(t => t.priority === priority);
      }
      if (status && status !== 'all') {
        tasks = tasks.filter(t => t.status === status);
      }
      if (subject && subject !== 'all') {
        tasks = tasks.filter(t => t.subject_name === subject || t.subject === subject);
      }
    }

    return res.json({ tasks });
  } catch (err) {
    console.error('getTasks Error:', err.message);
    return res.status(500).json({ error: `Failed to fetch tasks: ${err.message}` });
  }
};

exports.createTask = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User is not authenticated.' });
    }

    const { title, taskName, description, subject_name, subject, due_date, dueDate, priority, category } = req.body;
    const nameVal = taskName || title;

    if (!nameVal) {
      return res.status(400).json({ error: 'Task title / taskName is required.' });
    }

    let createdTask;
    if (firestoreService.firestore) {
      createdTask = await firestoreService.createTask(userId, {
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
      return res.status(201).json({ message: 'Task created successfully!', taskId: createdTask.id, task: createdTask });
    } else {
      const result = await db.query(
        'INSERT INTO tasks (user_id, title, description, subject_name, due_date, priority, status, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, nameVal, description || '', subject_name || subject || 'General', due_date || dueDate || null, priority || 'medium', 'pending', category || 'college']
      );
      return res.status(201).json({ message: 'Task created successfully!', taskId: result.insertId });
    }
  } catch (err) {
    console.error('createTask Error:', err.message);
    return res.status(500).json({ error: `Failed to create task: ${err.message}` });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User is not authenticated.' });
    }

    const { id } = req.params;
    const { title, taskName, description, subject_name, subject, due_date, dueDate, priority, status, completed } = req.body;

    if (firestoreService.firestore) {
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
        completed
      });
      await evaluateBadges(userId);
      return res.json({ message: 'Task updated successfully!', task: updated });
    } else {
      const existing = await db.query('SELECT id FROM tasks WHERE id = ? AND user_id = ?', [id, userId]);
      if (!existing || existing.length === 0) {
        return res.status(404).json({ error: 'Task not found or access denied.' });
      }
      await db.query(
        'UPDATE tasks SET title = ?, description = ?, subject_name = ?, due_date = ?, priority = ?, status = ? WHERE id = ? AND user_id = ?',
        [title || taskName, description, subject_name || subject, due_date || dueDate, priority, status, id, userId]
      );
      await evaluateBadges(userId);
      return res.json({ message: 'Task updated successfully!' });
    }
  } catch (err) {
    console.error('updateTask Error:', err.message);
    return res.status(500).json({ error: `Failed to update task: ${err.message}` });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User is not authenticated.' });
    }

    const { id } = req.params;
    const { status, completed } = req.body;

    if (firestoreService.firestore) {
      const updated = await firestoreService.updateTaskStatus(userId, id, completed !== undefined ? completed : status);
      await evaluateBadges(userId);
      return res.json({ message: 'Task status updated!', task: updated });
    } else {
      const existing = await db.query('SELECT id FROM tasks WHERE id = ? AND user_id = ?', [id, userId]);
      if (!existing || existing.length === 0) {
        return res.status(404).json({ error: 'Task not found or access denied.' });
      }
      await db.query('UPDATE tasks SET status = ? WHERE id = ? AND user_id = ?', [status, id, userId]);
      await evaluateBadges(userId);
      return res.json({ message: 'Task status updated!' });
    }
  } catch (err) {
    console.error('updateTaskStatus Error:', err.message);
    return res.status(500).json({ error: `Failed to update task status: ${err.message}` });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User is not authenticated.' });
    }

    const { id } = req.params;

    if (firestoreService.firestore) {
      await firestoreService.deleteTask(userId, id);
      return res.json({ message: 'Task deleted successfully!' });
    } else {
      const existing = await db.query('SELECT id FROM tasks WHERE id = ? AND user_id = ?', [id, userId]);
      if (!existing || existing.length === 0) {
        return res.status(404).json({ error: 'Task not found or access denied.' });
      }
      await db.query('DELETE FROM tasks WHERE id = ? AND user_id = ?', [id, userId]);
      return res.json({ message: 'Task deleted successfully!' });
    }
  } catch (err) {
    console.error('deleteTask Error:', err.message);
    return res.status(500).json({ error: `Failed to delete task: ${err.message}` });
  }
};

// 3. STUDY NOTES CRUD (Firebase Firestore: users/{userId}/notes/{noteId})
exports.getNotes = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User is not authenticated.' });
    }

    const { search, subject } = req.query;

    let notes;
    if (firestoreService.firestore) {
      notes = await firestoreService.getUserNotes(userId, { search, subject });
    } else {
      notes = await db.query('SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC', [userId]);

      if (search) {
        const q = search.toLowerCase();
        notes = notes.filter(n => (n.title && n.title.toLowerCase().includes(q)) || (n.content && n.content.toLowerCase().includes(q)));
      }
      if (subject && subject !== 'all') {
        notes = notes.filter(n => n.subject_name === subject || n.subject === subject || n.category === subject);
      }
    }

    return res.json({ notes });
  } catch (err) {
    console.error('getNotes Error:', err.message);
    return res.status(500).json({ error: `Failed to fetch notes: ${err.message}` });
  }
};

exports.createNote = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User is not authenticated.' });
    }

    const { title, content, subject_name, subject, category, tags } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Note title and content are required.' });
    }

    const subj = subject || subject_name || category || 'General';

    if (firestoreService.firestore) {
      const createdNote = await firestoreService.createNote(userId, {
        title,
        content,
        subject: subj,
        subject_name: subj,
        category: category || 'General',
        tags: tags || ''
      });
      return res.status(201).json({ message: 'Note saved successfully!', noteId: createdNote.id, note: createdNote });
    } else {
      const result = await db.query(
        'INSERT INTO notes (user_id, title, content, subject_name, category, tags) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, title, content, subj, category || 'General', tags || '']
      );
      return res.status(201).json({ message: 'Note saved successfully!', noteId: result.insertId });
    }
  } catch (err) {
    console.error('createNote Error:', err.message);
    return res.status(500).json({ error: `Failed to create note: ${err.message}` });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User is not authenticated.' });
    }

    const { id } = req.params;
    const { title, content, subject_name, subject, category, tags } = req.body;

    const subj = subject || subject_name || category;

    if (firestoreService.firestore) {
      const updated = await firestoreService.updateNote(userId, id, {
        title,
        content,
        subject: subj,
        subject_name: subj,
        category,
        tags
      });
      return res.json({ message: 'Note updated successfully!', note: updated });
    } else {
      const existing = await db.query('SELECT id FROM notes WHERE id = ? AND user_id = ?', [id, userId]);
      if (!existing || existing.length === 0) {
        return res.status(404).json({ error: 'Note not found or access denied.' });
      }
      await db.query(
        'UPDATE notes SET title = ?, content = ?, subject_name = ?, category = ?, tags = ? WHERE id = ? AND user_id = ?',
        [title, content, subj || 'General', category || 'General', tags || '', id, userId]
      );
      return res.json({ message: 'Note updated successfully!' });
    }
  } catch (err) {
    console.error('updateNote Error:', err.message);
    return res.status(500).json({ error: `Failed to update note: ${err.message}` });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User is not authenticated.' });
    }

    const { id } = req.params;

    if (firestoreService.firestore) {
      await firestoreService.deleteNote(userId, id);
      return res.json({ message: 'Note deleted successfully!' });
    } else {
      const existing = await db.query('SELECT id FROM notes WHERE id = ? AND user_id = ?', [id, userId]);
      if (!existing || existing.length === 0) {
        return res.status(404).json({ error: 'Note not found or access denied.' });
      }
      await db.query('DELETE FROM notes WHERE id = ? AND user_id = ?', [id, userId]);
      return res.json({ message: 'Note deleted successfully!' });
    }
  } catch (err) {
    console.error('deleteNote Error:', err.message);
    return res.status(500).json({ error: `Failed to delete note: ${err.message}` });
  }
};

// 4. ATTENDANCE TRACKER & WARNING STATUS (Firebase Firestore: users/{userId}/attendance/{attendanceId})
exports.getAttendance = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User is not authenticated.' });
    }

    if (firestoreService.firestore) {
      const data = await firestoreService.getUserAttendance(userId);
      return res.json(data);
    } else {
      const records = await db.query('SELECT * FROM attendance WHERE user_id = ?', [userId]);

      let totalAttended = 0;
      let totalConducted = 0;

      const enriched = records.map(r => {
        const attended = Number(r.attended_classes || 0);
        const total = Number(r.total_classes || 0);
        const target = Number(r.target_percentage) || 75;

        totalAttended += attended;
        totalConducted += total;

        let pct = total > 0 ? (attended / total) * 100 : 100;
        pct = Math.round(pct * 100) / 100;

        let statusTier = '🟢 Safe';
        let statusColor = 'safe';

        if (pct < 65) {
          statusTier = '🔴 Critical';
          statusColor = 'critical';
        } else if (pct < target) {
          statusTier = '🟡 Warning';
          statusColor = 'warning';
        }

        let safeToBunk = 0;
        let classesNeeded = 0;

        if (total > 0) {
          if (pct >= target) {
            safeToBunk = Math.floor((attended - (target / 100) * total) / (target / 100));
            if (safeToBunk < 0) safeToBunk = 0;
          } else {
            classesNeeded = Math.ceil(((target / 100) * total - attended) / (1 - (target / 100)));
            if (classesNeeded < 0) classesNeeded = 0;
          }
        }

        return {
          ...r,
          subjectName: r.subject_name,
          attendedClasses: attended,
          totalClasses: total,
          targetPercentage: target,
          currentPercentage: pct,
          statusTier,
          statusColor,
          safeToBunk,
          classesNeeded
        };
      });

      const overallPct = totalConducted > 0 ? Math.round((totalAttended / totalConducted) * 100) : 100;

      return res.json({
        attendance: enriched,
        overallPercentage: overallPct
      });
    }
  } catch (err) {
    console.error('getAttendance Error:', err.message);
    return res.status(500).json({ error: `Failed to fetch attendance: ${err.message}` });
  }
};

exports.addAttendance = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User is not authenticated.' });
    }

    const { subject_name, subjectName, attended_classes, attendedClasses, total_classes, totalClasses, target_percentage, targetPercentage } = req.body;
    const subj = subjectName || subject_name;
    const attended = Number(attendedClasses ?? attended_classes ?? 0);
    const total = Number(totalClasses ?? total_classes ?? 0);
    const targetPct = Number(targetPercentage ?? target_percentage ?? 75);

    if (!subj) {
      return res.status(400).json({ error: 'Subject name is required.' });
    }
    if (isNaN(attended) || isNaN(total) || attended < 0 || total < 0) {
      return res.status(400).json({ error: 'Attended and total classes count cannot be negative numbers.' });
    }
    if (attended > total) {
      return res.status(400).json({ error: 'Attended classes cannot be greater than total classes.' });
    }
    if (targetPct < 0 || targetPct > 100) {
      return res.status(400).json({ error: 'Target percentage must be between 0% and 100%.' });
    }

    if (firestoreService.firestore) {
      const created = await firestoreService.createAttendance(userId, {
        subjectName: subj,
        attendedClasses: attended,
        totalClasses: total,
        targetPercentage: targetPct
      });
      return res.status(201).json({ message: 'Attendance record added!', recordId: created.id, record: created });
    } else {
      const result = await db.query(
        'INSERT INTO attendance (user_id, subject_name, attended_classes, total_classes, target_percentage) VALUES (?, ?, ?, ?, ?)',
        [userId, subj, attended, total, targetPct]
      );
      return res.status(201).json({ message: 'Attendance record added!', recordId: result.insertId });
    }
  } catch (err) {
    console.error('addAttendance Error:', err.message);
    return res.status(500).json({ error: `Failed to add attendance: ${err.message}` });
  }
};

exports.updateAttendance = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User is not authenticated.' });
    }

    const { id } = req.params;
    const { subject_name, subjectName, attended_classes, attendedClasses, total_classes, totalClasses, target_percentage, targetPercentage } = req.body;
    const subj = subjectName || subject_name;
    const attended = Number(attendedClasses ?? attended_classes ?? 0);
    const total = Number(totalClasses ?? total_classes ?? 0);
    const targetPct = Number(targetPercentage ?? target_percentage ?? 75);

    if (isNaN(attended) || isNaN(total) || attended < 0 || total < 0) {
      return res.status(400).json({ error: 'Attended and total classes count cannot be negative numbers.' });
    }
    if (attended > total) {
      return res.status(400).json({ error: 'Attended classes cannot be greater than total classes.' });
    }

    if (firestoreService.firestore) {
      const updated = await firestoreService.updateAttendance(userId, id, {
        subjectName: subj,
        attendedClasses: attended,
        totalClasses: total,
        targetPercentage: targetPct
      });
      return res.json({ message: 'Attendance record updated!', record: updated });
    } else {
      const existing = await db.query('SELECT id FROM attendance WHERE id = ? AND user_id = ?', [id, userId]);
      if (!existing || existing.length === 0) {
        return res.status(404).json({ error: 'Attendance record not found or access denied.' });
      }
      await db.query(
        'UPDATE attendance SET subject_name = ?, attended_classes = ?, total_classes = ?, target_percentage = ? WHERE id = ? AND user_id = ?',
        [subj, attended, total, targetPct, id, userId]
      );
      return res.json({ message: 'Attendance record updated!' });
    }
  } catch (err) {
    console.error('updateAttendance Error:', err.message);
    return res.status(500).json({ error: `Failed to update attendance: ${err.message}` });
  }
};

exports.deleteAttendance = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User is not authenticated.' });
    }

    const { id } = req.params;

    if (firestoreService.firestore) {
      await firestoreService.deleteAttendance(userId, id);
      return res.json({ message: 'Attendance record deleted!' });
    } else {
      const existing = await db.query('SELECT id FROM attendance WHERE id = ? AND user_id = ?', [id, userId]);
      if (!existing || existing.length === 0) {
        return res.status(404).json({ error: 'Attendance record not found or access denied.' });
      }
      await db.query('DELETE FROM attendance WHERE id = ? AND user_id = ?', [id, userId]);
      return res.json({ message: 'Attendance record deleted!' });
    }
  } catch (err) {
    console.error('deleteAttendance Error:', err.message);
    return res.status(500).json({ error: `Failed to delete attendance: ${err.message}` });
  }
};

// 5. CGPA CALCULATOR (Firebase Firestore: users/{userId}/cgpa_records/{recordId})
exports.getCgpaRecords = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User is not authenticated.' });
    }

    if (firestoreService.firestore) {
      const data = await firestoreService.getUserCgpaRecords(userId);
      return res.json(data);
    } else {
      const records = await db.query('SELECT * FROM cgpa_records WHERE user_id = ? ORDER BY id ASC', [userId]);

      let totalPoints = 0;
      let totalCredits = 0;

      const semesterMap = {};

      records.forEach(r => {
        const sem = r.semester || 'Semester 1';
        const cr = Number(r.credits || 0);
        const gp = Number(r.gpa || 0);

        totalPoints += gp * cr;
        totalCredits += cr;

        if (!semesterMap[sem]) {
          semesterMap[sem] = { totalPoints: 0, totalCredits: 0 };
        }
        semesterMap[sem].totalPoints += gp * cr;
        semesterMap[sem].totalCredits += cr;
      });

      const semesterSgpaMap = {};
      for (const [sem, d] of Object.entries(semesterMap)) {
        semesterSgpaMap[sem] = d.totalCredits > 0 ? Number((d.totalPoints / d.totalCredits).toFixed(2)) : 0.0;
      }

      const cumulativeCGPA = totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0.0;

      return res.json({
        records,
        cumulativeCGPA,
        totalCredits,
        semesterSgpaMap
      });
    }
  } catch (err) {
    console.error('getCgpaRecords Error:', err.message);
    return res.status(500).json({ error: `Failed to fetch CGPA records: ${err.message}` });
  }
};

exports.addCgpaRecord = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User is not authenticated.' });
    }

    const { semester, subject_name, subjectName, courseName, courseCode, code, credits, grade, gpa, gradePoints } = req.body;
    const nameVal = courseName || subjectName || subject_name;
    const codeVal = courseCode || code || '';
    const cr = Number(credits || 0);
    const gp = Number(gradePoints ?? gpa ?? 9.0);

    if (!semester) {
      return res.status(400).json({ error: 'Semester selection is required.' });
    }
    if (!nameVal) {
      return res.status(400).json({ error: 'Course / Subject name is required.' });
    }
    if (isNaN(cr) || cr <= 0) {
      return res.status(400).json({ error: 'Credits must be a positive number greater than 0.' });
    }
    if (isNaN(gp) || gp < 0 || gp > 10) {
      return res.status(400).json({ error: 'Grade points must be between 0 and 10.' });
    }

    if (firestoreService.firestore) {
      const created = await firestoreService.createCgpaRecord(userId, {
        semester,
        courseCode: codeVal,
        courseName: nameVal,
        subject_name: nameVal,
        credits: cr,
        grade: grade || 'A',
        gradePoints: gp,
        gpa: gp
      });
      return res.status(201).json({ message: 'Semester CGPA record added!', recordId: created.id, record: created });
    } else {
      const result = await db.query(
        'INSERT INTO cgpa_records (user_id, semester, subject_name, credits, grade, gpa) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, semester, nameVal, cr, grade || 'A', gp]
      );
      return res.status(201).json({ message: 'Semester CGPA record added!', recordId: result.insertId });
    }
  } catch (err) {
    console.error('addCgpaRecord Error:', err.message);
    return res.status(500).json({ error: `Failed to add CGPA record: ${err.message}` });
  }
};

exports.updateCgpaRecord = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User is not authenticated.' });
    }

    const { id } = req.params;
    const { semester, subject_name, subjectName, courseName, courseCode, code, credits, grade, gpa, gradePoints } = req.body;
    const nameVal = courseName || subjectName || subject_name;
    const codeVal = courseCode || code;
    const cr = Number(credits || 0);
    const gp = Number(gradePoints ?? gpa ?? 9.0);

    if (isNaN(cr) || cr <= 0) {
      return res.status(400).json({ error: 'Credits must be a positive number greater than 0.' });
    }
    if (isNaN(gp) || gp < 0 || gp > 10) {
      return res.status(400).json({ error: 'Grade points must be between 0 and 10.' });
    }

    if (firestoreService.firestore) {
      const updated = await firestoreService.updateCgpaRecord(userId, id, {
        semester,
        courseCode: codeVal,
        courseName: nameVal,
        subject_name: nameVal,
        credits: cr,
        grade,
        gradePoints: gp,
        gpa: gp
      });
      return res.json({ message: 'CGPA record updated!', record: updated });
    } else {
      const existing = await db.query('SELECT id FROM cgpa_records WHERE id = ? AND user_id = ?', [id, userId]);
      if (!existing || existing.length === 0) {
        return res.status(404).json({ error: 'CGPA record not found or access denied.' });
      }
      await db.query(
        'UPDATE cgpa_records SET semester = ?, subject_name = ?, credits = ?, grade = ?, gpa = ? WHERE id = ? AND user_id = ?',
        [semester, nameVal || 'Subject', cr, grade || 'A', gp, id, userId]
      );
      return res.json({ message: 'CGPA record updated!' });
    }
  } catch (err) {
    console.error('updateCgpaRecord Error:', err.message);
    return res.status(500).json({ error: `Failed to update CGPA record: ${err.message}` });
  }
};

exports.deleteCgpaRecord = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User is not authenticated.' });
    }

    const { id } = req.params;

    if (firestoreService.firestore) {
      await firestoreService.deleteCgpaRecord(userId, id);
      return res.json({ message: 'CGPA record deleted!' });
    } else {
      const existing = await db.query('SELECT id FROM cgpa_records WHERE id = ? AND user_id = ?', [id, userId]);
      if (!existing || existing.length === 0) {
        return res.status(404).json({ error: 'CGPA record not found or access denied.' });
      }
      await db.query('DELETE FROM cgpa_records WHERE id = ? AND user_id = ?', [id, userId]);
      return res.json({ message: 'CGPA record deleted!' });
    }
  } catch (err) {
    console.error('deleteCgpaRecord Error:', err.message);
    return res.status(500).json({ error: `Failed to delete CGPA record: ${err.message}` });
  }
};

// 6. GOALS & TARGETS (Firebase Firestore: users/{userId}/goals/{goalId})
exports.getGoals = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User is not authenticated.' });
    }

    if (firestoreService.firestore) {
      const goals = await firestoreService.getUserGoals(userId);
      return res.json({ goals });
    } else {
      const goals = await db.query('SELECT * FROM goals WHERE user_id = ? ORDER BY target_date ASC', [userId]);

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const enrichedGoals = goals.map(g => {
        const prog = Math.min(100, Math.max(0, Number(g.progress_percentage || g.progressPercentage || g.progress || 0)));
        const isCompleted = prog >= 100 || g.status === 'completed';

        const targetDateStr = g.target_date || g.targetDate || null;
        let daysRemaining = null;
        let isOverdue = false;

        if (targetDateStr) {
          const targetDateObj = new Date(targetDateStr);
          if (!isNaN(targetDateObj.getTime())) {
            const diffMs = targetDateObj.getTime() - todayStart.getTime();
            daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            if (daysRemaining < 0 && !isCompleted) {
              isOverdue = true;
            }
          }
        }

        return {
          ...g,
          progress: prog,
          progressPercentage: prog,
          progress_percentage: prog,
          completed: isCompleted,
          daysRemaining,
          isOverdue
        };
      });

      return res.json({ goals: enrichedGoals });
    }
  } catch (err) {
    console.error('getGoals Error:', err.message);
    return res.status(500).json({ error: `Failed to fetch goals: ${err.message}` });
  }
};

exports.createGoal = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User is not authenticated.' });
    }

    const { title, description, target_date, targetDate, category, progress_percentage, progressPercentage, progress } = req.body;
    const titleVal = title?.trim();
    if (!titleVal) {
      return res.status(400).json({ error: 'Goal title is required.' });
    }

    const prog = Number(progressPercentage ?? progress_percentage ?? progress ?? 0);
    if (isNaN(prog) || prog < 0 || prog > 100) {
      return res.status(400).json({ error: 'Progress percentage must be between 0% and 100%.' });
    }

    const targetDateVal = targetDate || target_date || null;
    const isCompleted = prog >= 100;

    if (firestoreService.firestore) {
      const created = await firestoreService.createGoal(userId, {
        title: titleVal,
        description: description || '',
        category: category || 'Academic',
        targetDate: targetDateVal,
        target_date: targetDateVal,
        progress: prog,
        progressPercentage: prog,
        progress_percentage: prog,
        completed: isCompleted
      });
      return res.status(201).json({ message: 'Goal created!', goalId: created.id, goal: created });
    } else {
      const result = await db.query(
        'INSERT INTO goals (user_id, title, description, target_date, category, progress_percentage, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, titleVal, description || '', targetDateVal, category || 'Academic', prog, isCompleted ? 'completed' : 'in_progress']
      );
      return res.status(201).json({ message: 'Goal created!', goalId: result.insertId });
    }
  } catch (err) {
    console.error('createGoal Error:', err.message);
    return res.status(500).json({ error: `Failed to create goal: ${err.message}` });
  }
};

exports.updateGoal = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User is not authenticated.' });
    }

    const { id } = req.params;
    const { title, description, target_date, targetDate, category } = req.body;

    const rawProg = req.body.progress_percentage !== undefined ? req.body.progress_percentage : (req.body.progressPercentage !== undefined ? req.body.progressPercentage : req.body.progress);
    const prog = Number(rawProg ?? 0);

    if (isNaN(prog) || prog < 0 || prog > 100) {
      return res.status(400).json({ error: 'Progress percentage must be between 0% and 100%.' });
    }

    const targetDateVal = targetDate || target_date || null;
    const isCompleted = prog >= 100;

    if (firestoreService.firestore) {
      const updated = await firestoreService.updateGoal(userId, id, {
        title,
        description,
        category,
        targetDate: targetDateVal,
        target_date: targetDateVal,
        progress: prog,
        progressPercentage: prog,
        progress_percentage: prog,
        completed: isCompleted
      });
      return res.json({ message: 'Goal updated!', goal: updated });
    } else {
      const existing = await db.query('SELECT id FROM goals WHERE id = ? AND user_id = ?', [id, userId]);
      if (!existing || existing.length === 0) {
        return res.status(404).json({ error: 'Goal not found or access denied.' });
      }
      await db.query(
        'UPDATE goals SET title = ?, description = ?, target_date = ?, category = ?, progress_percentage = ?, status = ? WHERE id = ? AND user_id = ?',
        [title, description || '', targetDateVal, category || 'Academic', prog, isCompleted ? 'completed' : 'in_progress', id, userId]
      );
      return res.json({ message: 'Goal updated!' });
    }
  } catch (err) {
    console.error('updateGoal Error:', err.message);
    return res.status(500).json({ error: `Failed to update goal: ${err.message}` });
  }
};

exports.deleteGoal = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User is not authenticated.' });
    }

    const { id } = req.params;

    if (firestoreService.firestore) {
      await firestoreService.deleteGoal(userId, id);
      return res.json({ message: 'Goal deleted!' });
    } else {
      const existing = await db.query('SELECT id FROM goals WHERE id = ? AND user_id = ?', [id, userId]);
      if (!existing || existing.length === 0) {
        return res.status(404).json({ error: 'Goal not found or access denied.' });
      }
      await db.query('DELETE FROM goals WHERE id = ? AND user_id = ?', [id, userId]);
      return res.json({ message: 'Goal deleted!' });
    }
  } catch (err) {
    console.error('deleteGoal Error:', err.message);
    return res.status(500).json({ error: `Failed to delete goal: ${err.message}` });
  }
};

// 7. POMODORO STUDY TIMER & SESSION LOGGER
exports.logStudySession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { duration_minutes, session_type, subject_name } = req.body;

    await db.query(
      'INSERT INTO study_sessions (user_id, duration_minutes, session_type, subject_name) VALUES (?, ?, ?, ?)',
      [userId, duration_minutes || 25, session_type || 'pomodoro', subject_name || 'General Focus']
    );

    // Update study streak
    const streakRows = await db.query('SELECT * FROM study_streaks WHERE user_id = ?', [userId]);
    const todayStr = new Date().toISOString().split('T')[0];

    if (streakRows && streakRows.length > 0) {
      const s = streakRows[0];
      let newStreak = s.current_streak;
      if (s.last_active_date !== todayStr) {
        newStreak += 1;
      }
      const longest = Math.max(newStreak, s.longest_streak);
      await db.query('UPDATE study_streaks SET current_streak = ?, longest_streak = ?, last_active_date = ? WHERE user_id = ?', [
        newStreak, longest, todayStr, userId
      ]);
    } else {
      await db.query('INSERT INTO study_streaks (user_id, current_streak, longest_streak, last_active_date, badges_json) VALUES (?, 1, 1, ?, ?)', [
        userId, todayStr, JSON.stringify(['First Study Session'])
      ]);
    }

    const badges = await evaluateBadges(userId);
    return res.status(201).json({ message: 'Study session logged & streak updated!', badges });
  } catch (err) {
    console.error('logStudySession Error:', err);
    return res.status(500).json({ error: 'Failed to log study session.' });
  }
};

// 8. STREAKS & BADGES API
exports.getStreaksAndBadges = async (req, res) => {
  try {
    const userId = req.user.id;
    const badges = await evaluateBadges(userId);
    const streakRows = await db.query('SELECT * FROM study_streaks WHERE user_id = ?', [userId]);
    const streak = streakRows && streakRows.length > 0 ? streakRows[0] : { current_streak: 1, longest_streak: 1 };

    return res.json({
      currentStreak: streak.current_streak || 1,
      longestStreak: streak.longest_streak || 1,
      tasksCompletedCount: streak.tasks_completed_count || 0,
      quizzesAttemptedCount: streak.quizzes_attempted_count || 0,
      badges
    });
  } catch (err) {
    console.error('getStreaksAndBadges Error:', err);
    return res.status(500).json({ error: 'Failed to fetch streaks and badges.' });
  }
};

// 9. ANALYTICS PAGE SUMMARY
exports.getStudyAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    if (firestoreService.firestore) {
      const analytics = await firestoreService.getUserAnalytics(userId);
      return res.json(analytics);
    }

    const tasks = await db.query('SELECT * FROM tasks WHERE user_id = ?', [userId]);
    const sessions = await db.query('SELECT * FROM study_sessions WHERE user_id = ?', [userId]);
    const attendance = await db.query('SELECT * FROM attendance WHERE user_id = ?', [userId]);
    const cgpaRecords = await db.query('SELECT * FROM cgpa_records WHERE user_id = ?', [userId]);
    const goals = await db.query('SELECT * FROM goals WHERE user_id = ?', [userId]);

    const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
    const pendingTasksCount = tasks.length - completedTasksCount;

    let totalMinutes = 0;
    const subjectPerformance = {};
    sessions.forEach(s => {
      totalMinutes += Number(s.duration_minutes || 0);
      const sub = s.subject_name || 'General';
      subjectPerformance[sub] = (subjectPerformance[sub] || 0) + Number(s.duration_minutes || 0);
    });

    let totalAttended = 0;
    let totalConducted = 0;
    attendance.forEach(a => {
      totalAttended += Number(a.attended_classes || 0);
      totalConducted += Number(a.total_classes || 0);
    });
    const overallAttendance = totalConducted > 0 ? Math.round((totalAttended / totalConducted) * 100) : 100;

    let totalPoints = 0;
    let totalCredits = 0;
    cgpaRecords.forEach(c => {
      totalPoints += Number(c.gpa || 0) * Number(c.credits || 0);
      totalCredits += Number(c.credits || 0);
    });
    const cumulativeCGPA = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';

    let totalGoalProgress = 0;
    goals.forEach(g => totalGoalProgress += Number(g.progress_percentage || 0));
    const avgGoalProgress = goals.length > 0 ? Math.round(totalGoalProgress / goals.length) : 0;

    return res.json({
      tasksCompleted: completedTasksCount,
      tasksPending: pendingTasksCount,
      totalStudyHours: (totalMinutes / 60).toFixed(1),
      overallAttendance,
      cumulativeCGPA: Number(cumulativeCGPA),
      avgGoalProgress,
      subjectPerformance
    });
  } catch (err) {
    console.error('getStudyAnalytics Error:', err);
    return res.status(500).json({ error: 'Failed to fetch analytics.' });
  }
};
