const db = require('../src/config/db');
const firestoreService = require('../src/services/firestoreService');
const { getDb } = require('../src/config/firebase');

async function migrateAllData() {
  console.log('🚀 Starting Data Migration from MySQL/Fallback to Firestore...');

  try {
    // Ensure DB initialized
    await db.initDB();
    const isFallback = db.isFallbackMode;
    console.log(`📌 Source mode: ${isFallback ? 'JSON Fallback Store' : 'Live Aiven MySQL'}`);

    const firestoreDb = getDb();
    if (!firestoreDb) {
      console.log('⚠️ Firestore DB instance is not connected. Skipping remote write, data model ready.');
      return;
    }

    // 1. Migrate Users & Student Profiles
    console.log('1. Migrating Users & Student Profiles...');
    const users = await db.query('SELECT * FROM users');
    for (const u of users) {
      const profiles = await db.query('SELECT * FROM student_profiles WHERE user_id = ?', [u.id]);
      const prof = profiles && profiles[0] ? profiles[0] : {};
      
      const userRef = firestoreDb.collection('users').doc(String(u.id));
      await userRef.set({
        id: String(u.id),
        name: u.name,
        email: u.email,
        password: u.password || u.password_hash,
        role: u.role || 'student',
        status: u.status || 'active',
        profile: {
          phone: prof.phone || '',
          college: prof.college || '',
          course: prof.course || '',
          branch: prof.branch || '',
          yearOfStudy: prof.year_of_study || ''
        },
        createdAt: u.created_at || new Date().toISOString()
      }, { merge: true });
    }
    console.log(`   ✅ Migrated ${users.length} users and profiles.`);

    // 2. Migrate Exams
    console.log('2. Migrating Exams...');
    const exams = await db.query('SELECT * FROM exams');
    for (const e of exams) {
      await firestoreDb.collection('exams').doc(String(e.id)).set({
        id: String(e.id),
        title: e.title,
        code: e.code,
        category: e.category || 'Engineering',
        description: e.description || '',
        icon: e.icon || 'BookOpen',
        isActive: Boolean(e.is_active),
        createdAt: e.created_at || new Date().toISOString()
      }, { merge: true });

      // 3. Migrate Subjects for this Exam
      const subjects = await db.query('SELECT * FROM exam_subjects WHERE exam_id = ?', [e.id]);
      for (const s of subjects) {
        await firestoreDb.collection('exams').doc(String(e.id)).collection('subjects').doc(String(s.id)).set({
          id: String(s.id),
          examId: String(e.id),
          title: s.title,
          code: s.code || '',
          weightage: s.weightage || '',
          createdAt: s.created_at || new Date().toISOString()
        }, { merge: true });

        // Topics
        const topics = await db.query('SELECT * FROM topics WHERE subject_id = ?', [s.id]);
        for (const t of topics) {
          await firestoreDb.collection('exams').doc(String(e.id))
            .collection('subjects').doc(String(s.id))
            .collection('topics').doc(String(t.id)).set({
              id: String(t.id),
              subjectId: String(s.id),
              examId: String(e.id),
              title: t.title,
              description: t.description || '',
              estimatedHours: t.estimated_hours || 3,
              orderIndex: t.order_index || 1,
              createdAt: t.created_at || new Date().toISOString()
            }, { merge: true });

          // Subtopics
          const subtopics = await db.query('SELECT * FROM subtopics WHERE topic_id = ?', [t.id]);
          for (const st of subtopics) {
            await firestoreDb.collection('exams').doc(String(e.id))
              .collection('subjects').doc(String(s.id))
              .collection('topics').doc(String(t.id))
              .collection('subtopics').doc(String(st.id)).set({
                id: String(st.id),
                topicId: String(t.id),
                title: st.title,
                description: st.description || '',
                orderIndex: st.order_index || 1,
                createdAt: st.created_at || new Date().toISOString()
              }, { merge: true });
          }
        }
      }
    }
    console.log(`   ✅ Migrated ${exams.length} exams with subjects, topics & subtopics.`);

    // 4. Migrate Learning Resources / Study Materials
    console.log('4. Migrating Learning Resources...');
    const materials = await db.query('SELECT * FROM study_materials');
    for (const m of materials) {
      await firestoreDb.collection('learning_resources').doc(String(m.id)).set({
        id: String(m.id),
        title: m.title,
        examId: String(m.exam_id),
        subjectId: m.subject_id ? String(m.subject_id) : null,
        topicId: m.topic_id ? String(m.topic_id) : null,
        materialType: m.material_type || 'link',
        resourceType: m.resource_type || 'video',
        url: m.url || m.file_url || '',
        sourceName: m.source_name || 'Educational Source',
        difficulty: m.difficulty || 'intermediate',
        description: m.description || '',
        uploadedBy: String(m.uploaded_by || 1),
        clicksCount: m.clicks_count || 0,
        isActive: Boolean(m.is_active),
        createdAt: m.created_at || new Date().toISOString()
      }, { merge: true });
    }
    console.log(`   ✅ Migrated ${materials.length} learning resources.`);

    // 5. Migrate Private User Data Subcollections
    console.log('5. Migrating Private User Subcollections (Tasks, Notes, Attendance, Goals, Streaks)...');
    for (const u of users) {
      const userIdStr = String(u.id);

      // Tasks
      const tasks = await db.query('SELECT * FROM tasks WHERE user_id = ?', [u.id]);
      for (const tk of tasks) {
        await firestoreDb.collection('users').doc(userIdStr).collection('tasks').doc(String(tk.id)).set({
          id: String(tk.id),
          userId: userIdStr,
          title: tk.title,
          description: tk.description || '',
          subjectName: tk.subject_name || 'General',
          dueDate: tk.due_date || null,
          priority: tk.priority || 'medium',
          status: tk.status || 'pending',
          category: tk.category || 'college',
          createdAt: tk.created_at || new Date().toISOString(),
          updatedAt: tk.updated_at || new Date().toISOString()
        }, { merge: true });
      }

      // Notes
      const notes = await db.query('SELECT * FROM notes WHERE user_id = ?', [u.id]);
      for (const nt of notes) {
        await firestoreDb.collection('users').doc(userIdStr).collection('notes').doc(String(nt.id)).set({
          id: String(nt.id),
          userId: userIdStr,
          title: nt.title,
          content: nt.content,
          subjectName: nt.subject_name || 'General',
          category: nt.category || 'General',
          tags: nt.tags || '',
          createdAt: nt.created_at || new Date().toISOString(),
          updatedAt: nt.updated_at || new Date().toISOString()
        }, { merge: true });
      }

      // Attendance
      const attendance = await db.query('SELECT * FROM attendance WHERE user_id = ?', [u.id]);
      for (const att of attendance) {
        await firestoreDb.collection('users').doc(userIdStr).collection('attendance').doc(String(att.id)).set({
          id: String(att.id),
          userId: userIdStr,
          subjectName: att.subject_name,
          attendedClasses: att.attended_classes || 0,
          totalClasses: att.total_classes || 0,
          targetPercentage: att.target_percentage || 75.0,
          updatedAt: att.updated_at || new Date().toISOString()
        }, { merge: true });
      }

      // CGPA Records
      const cgpaRecords = await db.query('SELECT * FROM cgpa_records WHERE user_id = ?', [u.id]);
      for (const c of cgpaRecords) {
        await firestoreDb.collection('users').doc(userIdStr).collection('cgpa_records').doc(String(c.id)).set({
          id: String(c.id),
          userId: userIdStr,
          semester: c.semester,
          subjectName: c.subject_name || 'Subject',
          credits: c.credits,
          grade: c.grade || 'A',
          gpa: c.gpa,
          createdAt: c.created_at || new Date().toISOString()
        }, { merge: true });
      }

      // Goals
      const goals = await db.query('SELECT * FROM goals WHERE user_id = ?', [u.id]);
      for (const g of goals) {
        await firestoreDb.collection('users').doc(userIdStr).collection('goals').doc(String(g.id)).set({
          id: String(g.id),
          userId: userIdStr,
          title: g.title,
          description: g.description || '',
          targetDate: g.target_date || null,
          category: g.category || 'Academic',
          progressPercentage: g.progress_percentage || 0,
          status: g.status || 'in_progress',
          createdAt: g.created_at || new Date().toISOString()
        }, { merge: true });
      }

      // Study Streaks
      const streaks = await db.query('SELECT * FROM study_streaks WHERE user_id = ?', [u.id]);
      if (streaks && streaks[0]) {
        const stk = streaks[0];
        await firestoreDb.collection('users').doc(userIdStr).collection('study_streaks').doc('current').set({
          id: 'current',
          userId: userIdStr,
          currentStreak: stk.current_streak || 1,
          longestStreak: stk.longest_streak || 1,
          lastActiveDate: stk.last_active_date || new Date().toISOString().split('T')[0],
          tasksCompletedCount: stk.tasks_completed_count || 0,
          quizzesAttemptedCount: stk.quizzes_attempted_count || 0,
          updatedAt: stk.updated_at || new Date().toISOString()
        }, { merge: true });
      }
    }
    console.log('   ✅ Migrated user private subcollections.');

    // 6. Questions, Quizzes, Mock Tests
    console.log('6. Migrating Questions, Quizzes & Mock Tests...');
    const questions = await db.query('SELECT * FROM questions');
    for (const q of questions) {
      await firestoreDb.collection('questions').doc(String(q.id)).set({
        id: String(q.id),
        subjectId: String(q.subject_id),
        topicId: q.topic_id ? String(q.topic_id) : null,
        examId: q.exam_id ? String(q.exam_id) : null,
        year: q.year || '2024',
        questionText: q.question_text,
        optionA: q.option_a,
        optionB: q.option_b,
        optionC: q.option_c,
        optionD: q.option_d,
        correctOption: q.correct_option,
        explanation: q.explanation || '',
        difficulty: q.difficulty || 'medium'
      }, { merge: true });
    }

    const quizzes = await db.query('SELECT * FROM quizzes');
    for (const qz of quizzes) {
      const qQuestions = await db.query('SELECT question_id FROM quiz_questions WHERE quiz_id = ?', [qz.id]);
      const questionIds = (qQuestions || []).map(row => String(row.question_id));

      await firestoreDb.collection('quizzes').doc(String(qz.id)).set({
        id: String(qz.id),
        title: qz.title,
        examId: String(qz.exam_id),
        subjectId: qz.subject_id ? String(qz.subject_id) : null,
        timeLimitMins: qz.time_limit_mins || 15,
        totalMarks: qz.total_marks || 10,
        createdBy: String(qz.created_by || 1),
        questionIds,
        createdAt: qz.created_at || new Date().toISOString()
      }, { merge: true });
    }

    const mockTests = await db.query('SELECT * FROM mock_tests');
    for (const mt of mockTests) {
      await firestoreDb.collection('mock_tests').doc(String(mt.id)).set({
        id: String(mt.id),
        title: mt.title,
        examId: String(mt.exam_id),
        durationMins: mt.duration_mins || 60,
        totalQuestions: mt.total_questions || 30,
        passingScore: mt.passing_score || 50.0,
        createdAt: mt.created_at || new Date().toISOString()
      }, { merge: true });
    }
    console.log('   ✅ Migrated questions, quizzes, and mock tests.');

    console.log('🎉 Firestore Migration completed successfully!');
  } catch (err) {
    console.error('❌ Data migration failed:', err.message);
  }
}

if (require.main === module) {
  migrateAllData().then(() => process.exit(0));
}

module.exports = { migrateAllData };
