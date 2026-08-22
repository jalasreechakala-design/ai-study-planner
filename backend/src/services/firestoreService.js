const { getDb } = require('../config/firebase');

/**
 * Firestore Service Layer
 * Abstracts database interactions for the 19 platform modules.
 * Structures data according to isolated student subcollections and shared public catalogs.
 */
class FirestoreService {
  constructor() {
    this.db = getDb();
  }

  get firestore() {
    if (!this.db) {
      this.db = getDb();
    }
    return this.db;
  }

  // Helper to format Firestore snapshots
  docWithId(docSnap) {
    if (!docSnap.exists) return null;
    return { id: docSnap.id, ...docSnap.data() };
  }

  querySnap(querySnap) {
    const list = [];
    querySnap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
    return list;
  }

  // ==========================================
  // 1. USERS & AUTHENTICATION
  // ==========================================
  async createUserWithUid(uid, userData, profileData) {
    const db = this.firestore;
    if (!db) return null;

    const userRef = db.collection('users').doc(String(uid));
    const userDoc = {
      uid: String(uid),
      id: String(uid),
      name: userData.name,
      email: userData.email,
      role: 'student',
      status: 'active',
      profile: profileData || {},
      createdAt: new Date().toISOString()
    };

    await userRef.set(userDoc);
    return userDoc;
  }

  async createUser(userData, profileData) {
    const db = this.firestore;
    if (!db) return null;

    const userRef = db.collection('users').doc();
    const userId = userRef.id;

    const userDoc = {
      uid: userId,
      id: userId,
      name: userData.name,
      email: userData.email,
      role: 'student',
      status: 'active',
      profile: profileData || {},
      createdAt: new Date().toISOString()
    };

    await userRef.set(userDoc);
    return userDoc;
  }

  async getUserByEmail(email) {
    const db = this.firestore;
    if (!db) return null;

    const snap = await db.collection('users').where('email', '==', email).limit(1).get();
    if (snap.empty) return null;
    return this.querySnap(snap)[0];
  }

  async getUserById(userId) {
    const db = this.firestore;
    if (!db) return null;

    const doc = await db.collection('users').doc(String(userId)).get();
    return this.docWithId(doc);
  }

  async updateUserProfile(userId, profileData) {
    const db = this.firestore;
    if (!db) return null;

    const userRef = db.collection('users').doc(String(userId));
    await userRef.set({ profile: profileData }, { merge: true });
    return this.getUserById(userId);
  }

  // ==========================================
  // 2. EXAMS, SUBJECTS, TOPICS, SUBTOPICS (ROADMAP)
  // ==========================================
  async getExams() {
    const db = this.firestore;
    if (!db) return [];

    const snap = await db.collection('exams').get();
    return this.querySnap(snap);
  }

  async getExamById(examId) {
    const db = this.firestore;
    if (!db) return null;

    const doc = await db.collection('exams').doc(String(examId)).get();
    return this.docWithId(doc);
  }

  async createExam(examData) {
    const db = this.firestore;
    if (!db) return null;

    const ref = db.collection('exams').doc();
    const docData = {
      id: ref.id,
      title: examData.title,
      code: examData.code,
      category: examData.category || 'General',
      description: examData.description || '',
      icon: examData.icon || 'BookOpen',
      isActive: examData.isActive !== false,
      createdAt: new Date().toISOString()
    };
    await ref.set(docData);
    return docData;
  }

  async getExamSubjects(examId) {
    const db = this.firestore;
    if (!db) return [];

    const snap = await db.collection('exams').doc(String(examId)).collection('subjects').get();
    const examSubjects = this.querySnap(snap);
    if (examSubjects.length > 0) return examSubjects;

    // Fallback to top-level subjects
    const globalSnap = await db.collection('subjects').get();
    return this.querySnap(globalSnap);
  }

  async getSubjects(filter = {}) {
    const db = this.firestore;
    if (!db) return [];

    if (filter.examId) {
      return this.getExamSubjects(filter.examId);
    }

    const snap = await db.collection('subjects').get();
    const globalList = this.querySnap(snap);
    if (globalList.length > 0) return globalList;

    // Fallback: search subcollections under exams if top-level subjects is empty
    const examsSnap = await db.collection('exams').get();
    const allSubjects = [];
    for (const examDoc of examsSnap.docs) {
      const subSnap = await examDoc.ref.collection('subjects').get();
      subSnap.forEach(doc => allSubjects.push({ id: doc.id, examId: examDoc.id, ...doc.data() }));
    }
    return allSubjects;
  }

  async createExamSubject(examId, subjectData) {
    const db = this.firestore;
    if (!db) return null;

    const titleVal = (subjectData.title || subjectData.subjectName || subjectData.name || '').trim();
    const codeVal = (subjectData.code || subjectData.subjectCode || '').trim();
    const branchVal = subjectData.branch || 'General';
    const semVal = subjectData.semester || 'Semester 1';
    const descVal = subjectData.description || '';
    const weightageVal = subjectData.weightage || '';

    const ref = examId ? db.collection('exams').doc(String(examId)).collection('subjects').doc() : db.collection('subjects').doc();
    const docData = {
      id: ref.id,
      examId: examId ? String(examId) : '1',
      title: titleVal,
      name: titleVal,
      subjectName: titleVal,
      code: codeVal,
      subjectCode: codeVal,
      branch: branchVal,
      semester: semVal,
      description: descVal,
      weightage: weightageVal,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await ref.set(docData);

    // Also mirror to global subjects collection for student display
    await db.collection('subjects').doc(ref.id).set(docData, { merge: true }).catch(() => null);
    return docData;
  }

  async createSubject(subjectData) {
    const examId = subjectData.examId || subjectData.exam_id;
    return this.createExamSubject(examId, subjectData);
  }

  async updateSubject(subjectId, updateData) {
    const db = this.firestore;
    if (!db) return null;

    const examId = updateData.examId || updateData.exam_id;
    const titleVal = updateData.title || updateData.subjectName || updateData.name;
    const codeVal = updateData.code || updateData.subjectCode;

    const updateFields = {
      updatedAt: new Date().toISOString()
    };
    if (titleVal) {
      updateFields.title = titleVal;
      updateFields.name = titleVal;
      updateFields.subjectName = titleVal;
    }
    if (codeVal !== undefined) {
      updateFields.code = codeVal;
      updateFields.subjectCode = codeVal;
    }
    if (updateData.branch !== undefined) updateFields.branch = updateData.branch;
    if (updateData.semester !== undefined) updateFields.semester = updateData.semester;
    if (updateData.description !== undefined) updateFields.description = updateData.description;
    if (updateData.weightage !== undefined) updateFields.weightage = updateData.weightage;

    // Update global collection
    await db.collection('subjects').doc(String(subjectId)).set(updateFields, { merge: true }).catch(() => null);

    // Update exam subcollection if applicable
    if (examId) {
      await db.collection('exams').doc(String(examId)).collection('subjects').doc(String(subjectId)).set(updateFields, { merge: true }).catch(() => null);
    } else {
      // Find and update across exams if needed
      const examsSnap = await db.collection('exams').get();
      for (const examDoc of examsSnap.docs) {
        const subRef = examDoc.ref.collection('subjects').doc(String(subjectId));
        const subSnap = await subRef.get();
        if (subSnap.exists) {
          await subRef.set(updateFields, { merge: true });
        }
      }
    }

    return { id: String(subjectId), ...updateFields };
  }

  async deleteExamSubject(examId, subjectId) {
    const db = this.firestore;
    if (!db) return;

    await db.collection('subjects').doc(String(subjectId)).delete().catch(() => null);
    if (examId) {
      await db.collection('exams').doc(String(examId)).collection('subjects').doc(String(subjectId)).delete().catch(() => null);
    }
  }

  async deleteSubject(subjectId, examId = null) {
    return this.deleteExamSubject(examId, subjectId);
  }

  async getUserSubjects(userId) {
    const db = this.firestore;
    if (!db) return [];

    // 1. Fetch student's custom subjects
    const snap = await db.collection('users').doc(String(userId)).collection('subjects').get().catch(() => ({ docs: [] }));
    const userSubjects = this.querySnap(snap);

    // 2. Fetch admin global subjects
    const globalSubjects = await this.getSubjects().catch(() => []);

    // Merge without duplicates
    const subjectMap = new Map();
    globalSubjects.forEach(s => subjectMap.set(s.id || s.subjectName || s.title, s));
    userSubjects.forEach(s => subjectMap.set(s.id || s.subjectName || s.title, s));

    return Array.from(subjectMap.values());
  }

  async getTopics(examId, subjectId) {
    const db = this.firestore;
    if (!db) return [];

    const snap = await db.collection('exams').doc(String(examId))
      .collection('subjects').doc(String(subjectId))
      .collection('topics').orderBy('orderIndex', 'asc').get().catch(() => null);
    
    if (snap) return this.querySnap(snap);

    // Fallback: search topics directly under subject
    const directSnap = await db.collection('subjects').doc(String(subjectId)).collection('topics').get().catch(() => ({ docs: [] }));
    return this.querySnap(directSnap);
  }

  async createTopic(examId, subjectId, topicData) {
    const db = this.firestore;
    if (!db) return null;

    const ref = db.collection('exams').doc(String(examId))
      .collection('subjects').doc(String(subjectId))
      .collection('topics').doc();

    const docData = {
      id: ref.id,
      examId: String(examId),
      subjectId: String(subjectId),
      title: topicData.title || topicData.name,
      name: topicData.title || topicData.name,
      description: topicData.description || '',
      estimatedHours: Number(topicData.estimatedHours || 3),
      orderIndex: Number(topicData.orderIndex || 1),
      createdAt: new Date().toISOString()
    };
    await ref.set(docData);
    return docData;
  }

  async updateTopic(examId, subjectId, topicId, topicData) {
    const db = this.firestore;
    if (!db) return null;

    const ref = db.collection('exams').doc(String(examId))
      .collection('subjects').doc(String(subjectId))
      .collection('topics').doc(String(topicId));

    const updateFields = {
      updatedAt: new Date().toISOString()
    };
    if (topicData.title || topicData.name) {
      updateFields.title = topicData.title || topicData.name;
      updateFields.name = topicData.title || topicData.name;
    }
    if (topicData.description !== undefined) updateFields.description = topicData.description;
    if (topicData.estimatedHours !== undefined) updateFields.estimatedHours = Number(topicData.estimatedHours);
    if (topicData.orderIndex !== undefined) updateFields.orderIndex = Number(topicData.orderIndex);

    await ref.set(updateFields, { merge: true });
    return { id: String(topicId), ...updateFields };
  }

  async deleteTopic(examId, subjectId, topicId) {
    const db = this.firestore;
    if (!db) return;

    await db.collection('exams').doc(String(examId))
      .collection('subjects').doc(String(subjectId))
      .collection('topics').doc(String(topicId)).delete();
  }

  async getSubtopics(examId, subjectId, topicId) {
    const db = this.firestore;
    if (!db) return [];

    const snap = await db.collection('exams').doc(String(examId))
      .collection('subjects').doc(String(subjectId))
      .collection('topics').doc(String(topicId))
      .collection('subtopics').orderBy('orderIndex', 'asc').get().catch(() => ({ docs: [] }));
    return this.querySnap(snap);
  }

  async createSubtopic(examId, subjectId, topicId, subtopicData) {
    const db = this.firestore;
    if (!db) return null;

    const ref = db.collection('exams').doc(String(examId))
      .collection('subjects').doc(String(subjectId))
      .collection('topics').doc(String(topicId))
      .collection('subtopics').doc();

    const docData = {
      id: ref.id,
      topicId: String(topicId),
      title: subtopicData.title || subtopicData.name,
      name: subtopicData.title || subtopicData.name,
      description: subtopicData.description || '',
      orderIndex: Number(subtopicData.orderIndex || 1),
      createdAt: new Date().toISOString()
    };
    await ref.set(docData);
    return docData;
  }

  async updateSubtopic(examId, subjectId, topicId, subtopicId, subtopicData) {
    const db = this.firestore;
    if (!db) return null;

    const ref = db.collection('exams').doc(String(examId))
      .collection('subjects').doc(String(subjectId))
      .collection('topics').doc(String(topicId))
      .collection('subtopics').doc(String(subtopicId));

    const updateFields = {
      updatedAt: new Date().toISOString()
    };
    if (subtopicData.title || subtopicData.name) {
      updateFields.title = subtopicData.title || subtopicData.name;
      updateFields.name = subtopicData.title || subtopicData.name;
    }
    if (subtopicData.description !== undefined) updateFields.description = subtopicData.description;
    if (subtopicData.orderIndex !== undefined) updateFields.orderIndex = Number(subtopicData.orderIndex);

    await ref.set(updateFields, { merge: true });
    return { id: String(subtopicId), ...updateFields };
  }

  async deleteSubtopic(examId, subjectId, topicId, subtopicId) {
    const db = this.firestore;
    if (!db) return;

    await db.collection('exams').doc(String(examId))
      .collection('subjects').doc(String(subjectId))
      .collection('topics').doc(String(topicId))
      .collection('subtopics').doc(String(subtopicId)).delete();
  }

  // ==========================================
  // 3. LEARNING RESOURCES & BOOKMARKS
  // ==========================================
  async getLearningResources(filter = {}) {
    const db = this.firestore;
    if (!db) return [];

    let query = db.collection('learning_resources');
    if (filter.examId) query = query.where('examId', '==', String(filter.examId));
    if (filter.subjectId) query = query.where('subjectId', '==', String(filter.subjectId));
    if (filter.topicId) query = query.where('topicId', '==', String(filter.topicId));

    const snap = await query.get();
    return this.querySnap(snap);
  }

  async createLearningResource(resourceData) {
    const db = this.firestore;
    if (!db) return null;

    const ref = db.collection('learning_resources').doc();
    const docData = {
      id: ref.id,
      examId: String(resourceData.examId),
      subjectId: resourceData.subjectId ? String(resourceData.subjectId) : null,
      topicId: resourceData.topicId ? String(resourceData.topicId) : null,
      title: resourceData.title,
      description: resourceData.description || '',
      resourceType: resourceData.resourceType || 'video',
      materialType: resourceData.materialType || 'link',
      url: resourceData.url || resourceData.file_url || '',
      sourceName: resourceData.sourceName || resourceData.source_name || 'Educational Source',
      difficulty: resourceData.difficulty || 'intermediate',
      uploadedBy: resourceData.uploadedBy || 'admin_1',
      clicksCount: 0,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    await ref.set(docData);
    return docData;
  }

  async incrementResourceClicks(resourceId) {
    const db = this.firestore;
    if (!db) return;

    const ref = db.collection('learning_resources').doc(String(resourceId));
    const doc = await ref.get();
    if (doc.exists) {
      const current = doc.data().clicksCount || 0;
      await ref.update({ clicksCount: current + 1 });
    }
  }

  async getUserBookmarks(userId) {
    const db = this.firestore;
    if (!db) return [];

    const snap = await db.collection('users').doc(String(userId)).collection('bookmarks').get();
    return this.querySnap(snap);
  }

  async addBookmark(userId, materialId) {
    const db = this.firestore;
    if (!db) return null;

    const ref = db.collection('users').doc(String(userId)).collection('bookmarks').doc(String(materialId));
    const docData = {
      id: String(materialId),
      userId: String(userId),
      materialId: String(materialId),
      createdAt: new Date().toISOString()
    };
    await ref.set(docData);
    return docData;
  }

  async removeBookmark(userId, materialId) {
    const db = this.firestore;
    if (!db) return;

    await db.collection('users').doc(String(userId)).collection('bookmarks').doc(String(materialId)).delete();
  }

  // ==========================================
  // 4. PRIVATE USER DATA (TASKS, NOTES, ATTENDANCE, CGPA, GOALS, SESSIONS)
  // ==========================================
  
  // TASKS (Firestore: users/{userId}/tasks/{taskId})
  async getUserTasks(userId, filter = {}) {
    const db = this.firestore;
    if (!db) {
      throw new Error('Firebase Firestore is not configured or initialized.');
    }

    const snap = await db.collection('users').doc(String(userId)).collection('tasks').get();
    let tasks = this.querySnap(snap).map(t => {
      const isCompleted = typeof t.completed === 'boolean' ? t.completed : (t.status === 'completed');
      return {
        id: t.id,
        userId: String(userId),
        taskName: t.taskName || t.title || '',
        title: t.title || t.taskName || '',
        subject: t.subject || t.subject_name || 'General',
        subject_name: t.subject_name || t.subject || 'General',
        description: t.description || '',
        priority: t.priority || 'medium',
        dueDate: t.dueDate || t.due_date || null,
        due_date: t.due_date || t.dueDate || null,
        completed: isCompleted,
        status: t.status || (isCompleted ? 'completed' : 'pending'),
        category: t.category || 'college',
        createdAt: t.createdAt || new Date().toISOString()
      };
    });

    if (filter.search) {
      const q = filter.search.toLowerCase();
      tasks = tasks.filter(t => 
        (t.taskName && t.taskName.toLowerCase().includes(q)) || 
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }
    if (filter.priority && filter.priority !== 'all') {
      tasks = tasks.filter(t => t.priority === filter.priority);
    }
    if (filter.status && filter.status !== 'all') {
      if (filter.status === 'completed') {
        tasks = tasks.filter(t => t.completed === true || t.status === 'completed');
      } else if (filter.status === 'pending') {
        tasks = tasks.filter(t => t.completed === false || t.status === 'pending');
      }
    }
    if (filter.subject && filter.subject !== 'all') {
      tasks = tasks.filter(t => t.subject === filter.subject || t.subject_name === filter.subject);
    }

    // Sort by due date ascending
    tasks.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

    return tasks;
  }

  async createTask(userId, taskData) {
    const db = this.firestore;
    if (!db) {
      throw new Error('Firebase Firestore is not configured or initialized.');
    }

    const ref = db.collection('users').doc(String(userId)).collection('tasks').doc();
    const taskNameVal = taskData.taskName || taskData.title;
    if (!taskNameVal) {
      throw new Error('Task title/taskName is required.');
    }

    const isCompleted = typeof taskData.completed === 'boolean' ? taskData.completed : (taskData.status === 'completed');

    const docData = {
      id: ref.id,
      userId: String(userId),
      taskName: taskNameVal,
      title: taskNameVal,
      subject: taskData.subject || taskData.subject_name || 'General',
      subject_name: taskData.subject_name || taskData.subject || 'General',
      description: taskData.description || '',
      priority: taskData.priority || 'medium',
      dueDate: taskData.dueDate || taskData.due_date || null,
      due_date: taskData.due_date || taskData.dueDate || null,
      completed: isCompleted,
      status: isCompleted ? 'completed' : 'pending',
      category: taskData.category || 'college',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await ref.set(docData);
    return docData;
  }

  async updateTask(userId, taskId, updateData) {
    const db = this.firestore;
    if (!db) {
      throw new Error('Firebase Firestore is not configured or initialized.');
    }

    const ref = db.collection('users').doc(String(userId)).collection('tasks').doc(String(taskId));
    const docSnap = await ref.get();
    if (!docSnap.exists) {
      throw new Error(`Task with ID ${taskId} not found for this user.`);
    }

    const existing = docSnap.data();
    const taskNameVal = updateData.taskName || updateData.title || existing.taskName || existing.title;
    const isCompleted = typeof updateData.completed === 'boolean' ? updateData.completed : (updateData.status ? updateData.status === 'completed' : existing.completed);

    const dataToSave = {
      ...existing,
      taskName: taskNameVal,
      title: taskNameVal,
      subject: updateData.subject || updateData.subject_name || existing.subject || existing.subject_name || 'General',
      subject_name: updateData.subject_name || updateData.subject || existing.subject_name || existing.subject || 'General',
      description: updateData.description !== undefined ? updateData.description : existing.description,
      priority: updateData.priority || existing.priority || 'medium',
      dueDate: updateData.dueDate || updateData.due_date || existing.dueDate || existing.due_date || null,
      due_date: updateData.due_date || updateData.dueDate || existing.due_date || existing.dueDate || null,
      completed: isCompleted,
      status: isCompleted ? 'completed' : 'pending',
      category: updateData.category || existing.category || 'college',
      updatedAt: new Date().toISOString()
    };

    await ref.set(dataToSave, { merge: true });
    return dataToSave;
  }

  async updateTaskStatus(userId, taskId, completedOrStatus) {
    const db = this.firestore;
    if (!db) {
      throw new Error('Firebase Firestore is not configured or initialized.');
    }

    const isCompleted = typeof completedOrStatus === 'boolean' ? completedOrStatus : (completedOrStatus === 'completed');
    const statusVal = isCompleted ? 'completed' : 'pending';

    const ref = db.collection('users').doc(String(userId)).collection('tasks').doc(String(taskId));
    const docSnap = await ref.get();
    if (!docSnap.exists) {
      throw new Error(`Task with ID ${taskId} not found for this user.`);
    }

    await ref.set({
      completed: isCompleted,
      status: statusVal,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return { id: String(taskId), completed: isCompleted, status: statusVal };
  }

  async deleteTask(userId, taskId) {
    const db = this.firestore;
    if (!db) {
      throw new Error('Firebase Firestore is not configured or initialized.');
    }

    const ref = db.collection('users').doc(String(userId)).collection('tasks').doc(String(taskId));
    const docSnap = await ref.get();
    if (!docSnap.exists) {
      throw new Error(`Task with ID ${taskId} not found for this user.`);
    }

    await ref.delete();
  }


  // NOTES (Firestore: users/{userId}/notes/{noteId})
  async getUserNotes(userId, filter = {}) {
    const db = this.firestore;
    if (!db) {
      throw new Error('Firebase Firestore is not configured or initialized.');
    }

    const snap = await db.collection('users').doc(String(userId)).collection('notes').get();
    let notes = this.querySnap(snap).map(n => {
      const subj = n.subject || n.subject_name || n.subjectName || 'General';
      return {
        id: n.id,
        userId: String(userId),
        title: n.title || '',
        content: n.content || '',
        subject: subj,
        subject_name: subj,
        category: n.category || 'General',
        tags: n.tags || '',
        createdAt: n.createdAt || n.created_at || new Date().toISOString(),
        updatedAt: n.updatedAt || n.updated_at || new Date().toISOString()
      };
    });

    if (filter.search) {
      const q = filter.search.toLowerCase();
      notes = notes.filter(n =>
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.content && n.content.toLowerCase().includes(q)) ||
        (n.tags && n.tags.toLowerCase().includes(q))
      );
    }

    if (filter.subject && filter.subject !== 'all') {
      notes = notes.filter(n => n.subject === filter.subject || n.subject_name === filter.subject || n.category === filter.subject);
    }

    // Sort by createdAt descending
    notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return notes;
  }

  async createNote(userId, noteData) {
    const db = this.firestore;
    if (!db) {
      throw new Error('Firebase Firestore is not configured or initialized.');
    }

    if (!noteData.title || !noteData.content) {
      throw new Error('Note title and content are required.');
    }

    const ref = db.collection('users').doc(String(userId)).collection('notes').doc();
    const subj = noteData.subject || noteData.subject_name || noteData.subjectName || noteData.category || 'General';

    const docData = {
      id: ref.id,
      userId: String(userId),
      title: noteData.title,
      content: noteData.content,
      subject: subj,
      subject_name: subj,
      category: noteData.category || 'General',
      tags: noteData.tags || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await ref.set(docData);
    return docData;
  }

  async updateNote(userId, noteId, updateData) {
    const db = this.firestore;
    if (!db) {
      throw new Error('Firebase Firestore is not configured or initialized.');
    }

    const ref = db.collection('users').doc(String(userId)).collection('notes').doc(String(noteId));
    const docSnap = await ref.get();
    if (!docSnap.exists) {
      throw new Error(`Note with ID ${noteId} not found for this user.`);
    }

    const existing = docSnap.data();
    const subj = updateData.subject || updateData.subject_name || updateData.subjectName || updateData.category || existing.subject || existing.subject_name || 'General';

    const dataToSave = {
      ...existing,
      title: updateData.title || existing.title,
      content: updateData.content || existing.content,
      subject: subj,
      subject_name: subj,
      category: updateData.category || existing.category || 'General',
      tags: updateData.tags !== undefined ? updateData.tags : existing.tags,
      updatedAt: new Date().toISOString()
    };

    await ref.set(dataToSave, { merge: true });
    return dataToSave;
  }

  async deleteNote(userId, noteId) {
    const db = this.firestore;
    if (!db) {
      throw new Error('Firebase Firestore is not configured or initialized.');
    }

    const ref = db.collection('users').doc(String(userId)).collection('notes').doc(String(noteId));
    const docSnap = await ref.get();
    if (!docSnap.exists) {
      throw new Error(`Note with ID ${noteId} not found for this user.`);
    }

    await ref.delete();
  }

  // ==========================================
  // 4B. SUBJECTS, ASSIGNMENTS, REMINDERS & NOTIFICATIONS
  // ==========================================

  // SUBJECTS (Firestore: users/{userId}/subjects/{subjectId})
  async getUserSubjects(userId, filter = {}) {
    const db = this.firestore;
    if (!db) throw new Error('Firebase Firestore is not configured or initialized.');

    const snap = await db.collection('users').doc(String(userId)).collection('subjects').get();
    let subjects = this.querySnap(snap);

    if (filter.search) {
      const q = filter.search.toLowerCase();
      subjects = subjects.filter(s => (s.title && s.title.toLowerCase().includes(q)) || (s.name && s.name.toLowerCase().includes(q)));
    }
    return subjects;
  }

  async createUserSubject(userId, subjectData) {
    const db = this.firestore;
    if (!db) throw new Error('Firebase Firestore is not configured or initialized.');

    const titleVal = subjectData.title || subjectData.name;
    if (!titleVal) throw new Error('Subject title/name is required.');

    const ref = db.collection('users').doc(String(userId)).collection('subjects').doc();
    const docData = {
      id: ref.id,
      userId: String(userId),
      title: titleVal,
      name: titleVal,
      code: subjectData.code || '',
      category: subjectData.category || 'General',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await ref.set(docData);
    return docData;
  }

  async deleteUserSubject(userId, subjectId) {
    const db = this.firestore;
    if (!db) throw new Error('Firebase Firestore is not configured or initialized.');

    await db.collection('users').doc(String(userId)).collection('subjects').doc(String(subjectId)).delete();
  }

  // ASSIGNMENTS (Firestore: users/{userId}/assignments/{assignmentId})
  async getUserAssignments(userId, filter = {}) {
    const db = this.firestore;
    if (!db) throw new Error('Firebase Firestore is not configured or initialized.');

    const snap = await db.collection('users').doc(String(userId)).collection('assignments').get();
    let assignments = this.querySnap(snap);

    const tasksSnap = await db.collection('users').doc(String(userId)).collection('tasks').get();
    const assignmentTasks = this.querySnap(tasksSnap).filter(t => t.category === 'assignment');

    const combined = [...assignments, ...assignmentTasks];
    const unique = [];
    const seen = new Set();
    for (const item of combined) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        unique.push({
          id: item.id,
          userId: String(userId),
          title: item.title || item.taskName || 'Assignment',
          taskName: item.title || item.taskName || 'Assignment',
          description: item.description || '',
          subject: item.subject || item.subject_name || 'General',
          subject_name: item.subject_name || item.subject || 'General',
          dueDate: item.dueDate || item.due_date || null,
          due_date: item.due_date || item.dueDate || null,
          priority: item.priority || 'medium',
          completed: item.completed === true || item.status === 'completed',
          status: item.status || (item.completed ? 'completed' : 'pending'),
          category: 'assignment',
          createdAt: item.createdAt || new Date().toISOString()
        });
      }
    }
    return unique;
  }

  async createAssignment(userId, assignmentData) {
    const db = this.firestore;
    if (!db) throw new Error('Firebase Firestore is not configured or initialized.');

    const titleVal = assignmentData.title || assignmentData.taskName;
    if (!titleVal) throw new Error('Assignment title is required.');

    const ref = db.collection('users').doc(String(userId)).collection('assignments').doc();
    const isCompleted = assignmentData.completed === true || assignmentData.status === 'completed';

    const docData = {
      id: ref.id,
      userId: String(userId),
      title: titleVal,
      taskName: titleVal,
      description: assignmentData.description || '',
      subject: assignmentData.subject || assignmentData.subject_name || 'General',
      subject_name: assignmentData.subject_name || assignmentData.subject || 'General',
      dueDate: assignmentData.dueDate || assignmentData.due_date || null,
      due_date: assignmentData.due_date || assignmentData.dueDate || null,
      priority: assignmentData.priority || 'medium',
      completed: isCompleted,
      status: isCompleted ? 'completed' : 'pending',
      category: 'assignment',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await ref.set(docData);
    await this.createTask(userId, { ...assignmentData, category: 'assignment' }).catch(() => null);
    return docData;
  }

  async updateAssignment(userId, assignmentId, updateData) {
    const db = this.firestore;
    if (!db) throw new Error('Firebase Firestore is not configured or initialized.');

    const ref = db.collection('users').doc(String(userId)).collection('assignments').doc(String(assignmentId));
    const docSnap = await ref.get();
    if (!docSnap.exists) {
      return await this.updateTask(userId, assignmentId, { ...updateData, category: 'assignment' });
    }

    const existing = docSnap.data();
    const titleVal = updateData.title || updateData.taskName || existing.title;
    const isCompleted = updateData.completed !== undefined ? updateData.completed : (updateData.status ? updateData.status === 'completed' : existing.completed);

    const dataToSave = {
      ...existing,
      title: titleVal,
      taskName: titleVal,
      description: updateData.description !== undefined ? updateData.description : existing.description,
      subject: updateData.subject || updateData.subject_name || existing.subject || 'General',
      subject_name: updateData.subject_name || updateData.subject || existing.subject_name || 'General',
      dueDate: updateData.dueDate || updateData.due_date || existing.dueDate || null,
      due_date: updateData.due_date || updateData.dueDate || existing.due_date || null,
      priority: updateData.priority || existing.priority || 'medium',
      completed: isCompleted,
      status: isCompleted ? 'completed' : 'pending',
      updatedAt: new Date().toISOString()
    };

    await ref.set(dataToSave, { merge: true });
    return dataToSave;
  }

  async deleteAssignment(userId, assignmentId) {
    const db = this.firestore;
    if (!db) throw new Error('Firebase Firestore is not configured or initialized.');

    await db.collection('users').doc(String(userId)).collection('assignments').doc(String(assignmentId)).delete();
    await this.deleteTask(userId, assignmentId).catch(() => null);
  }

  // REMINDERS (Firestore: users/{userId}/reminders/{reminderId})
  async getUserReminders(userId, filter = {}) {
    const db = this.firestore;
    if (!db) throw new Error('Firebase Firestore is not configured or initialized.');

    const snap = await db.collection('users').doc(String(userId)).collection('reminders').get();
    return this.querySnap(snap);
  }

  async createReminder(userId, reminderData) {
    const db = this.firestore;
    if (!db) throw new Error('Firebase Firestore is not configured or initialized.');

    const titleVal = reminderData.title || reminderData.subject;
    if (!titleVal) throw new Error('Reminder title/subject is required.');

    const ref = db.collection('users').doc(String(userId)).collection('reminders').doc();
    const docData = {
      id: ref.id,
      userId: String(userId),
      title: titleVal,
      message: reminderData.message || reminderData.textContent || '',
      recipientEmail: reminderData.recipientEmail || reminderData.toEmail || '',
      scheduledAt: reminderData.scheduledAt || reminderData.scheduled_at || new Date().toISOString(),
      sentStatus: reminderData.sentStatus || 'sent',
      createdAt: new Date().toISOString()
    };

    await ref.set(docData);
    return docData;
  }

  async deleteReminder(userId, reminderId) {
    const db = this.firestore;
    if (!db) throw new Error('Firebase Firestore is not configured or initialized.');

    await db.collection('users').doc(String(userId)).collection('reminders').doc(String(reminderId)).delete();
  }

  // NOTIFICATIONS (Firestore: users/{userId}/notifications/{notificationId})
  async getUserNotifications(userId) {
    const db = this.firestore;
    if (!db) throw new Error('Firebase Firestore is not configured or initialized.');

    const snap = await db.collection('users').doc(String(userId)).collection('notifications').get();
    const list = this.querySnap(snap);
    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return list;
  }

  async addNotification(userId, notificationData) {
    const db = this.firestore;
    if (!db) throw new Error('Firebase Firestore is not configured or initialized.');

    const ref = db.collection('users').doc(String(userId)).collection('notifications').doc();
    const docData = {
      id: ref.id,
      userId: String(userId),
      title: notificationData.title || 'Notification',
      message: notificationData.message || notificationData.content || '',
      type: notificationData.type || 'announcement',
      isRead: false,
      is_read: false,
      createdAt: new Date().toISOString()
    };

    await ref.set(docData);
    return docData;
  }

  async markNotificationAsRead(userId, notificationId) {
    const db = this.firestore;
    if (!db) throw new Error('Firebase Firestore is not configured or initialized.');

    const ref = db.collection('users').doc(String(userId)).collection('notifications').doc(String(notificationId));
    await ref.set({ isRead: true, is_read: true, updatedAt: new Date().toISOString() }, { merge: true });
    return { id: String(notificationId), isRead: true };
  }

  // ATTENDANCE (Firestore: users/{userId}/attendance/{attendanceId})
  async getUserAttendance(userId) {
    const db = this.firestore;
    if (!db) {
      throw new Error('Firebase Firestore is not configured or initialized.');
    }

    const snap = await db.collection('users').doc(String(userId)).collection('attendance').get();
    const list = this.querySnap(snap);

    let totalAttendedAll = 0;
    let totalClassesAll = 0;

    const attendanceRecords = list.map(rec => {
      const subj = rec.subjectName || rec.subject_name || 'Subject';
      const attended = Number(rec.attendedClasses ?? rec.attended_classes ?? 0);
      const total = Number(rec.totalClasses ?? rec.total_classes ?? 0);
      const targetPct = Number(rec.targetPercentage ?? rec.target_percentage ?? 75);

      if (attended < 0 || total < 0) {
        throw new Error('Attended and total classes must be non-negative integers.');
      }
      if (attended > total) {
        throw new Error('Attended classes cannot be greater than total classes.');
      }

      totalAttendedAll += attended;
      totalClassesAll += total;

      const currentPercentage = total > 0 ? Number(((attended / total) * 100).toFixed(2)) : 100;
      const isSafe = currentPercentage >= targetPct;

      let statusTier = '🟢 Safe';
      if (!isSafe) {
        statusTier = currentPercentage >= 65 ? '🟡 Warning' : '🔴 Critical';
      }

      // Safe bunks calculation
      let safeToBunk = 0;
      if (isSafe && targetPct > 0) {
        const targetDecimal = targetPct / 100;
        safeToBunk = Math.floor((attended - targetDecimal * total) / targetDecimal);
        if (safeToBunk < 0) safeToBunk = 0;
      }

      // Classes needed calculation
      let classesNeeded = 0;
      if (!isSafe && targetPct < 100) {
        const targetDecimal = targetPct / 100;
        classesNeeded = Math.ceil((targetDecimal * total - attended) / (1 - targetDecimal));
        if (classesNeeded < 0) classesNeeded = 0;
      }

      return {
        id: rec.id,
        userId: String(userId),
        subjectName: subj,
        subject_name: subj,
        attendedClasses: attended,
        attended_classes: attended,
        totalClasses: total,
        total_classes: total,
        targetPercentage: targetPct,
        target_percentage: targetPct,
        currentPercentage,
        statusTier,
        safeToBunk,
        classesNeeded,
        createdAt: rec.createdAt || rec.created_at || new Date().toISOString(),
        updatedAt: rec.updatedAt || rec.updated_at || new Date().toISOString()
      };
    });

    const overallPercentage = totalClassesAll > 0 ? Math.round((totalAttendedAll / totalClassesAll) * 100) : 100;

    return {
      attendance: attendanceRecords,
      overallPercentage,
      totalAttended: totalAttendedAll,
      totalClasses: totalClassesAll
    };
  }

  async createAttendance(userId, attData) {
    const db = this.firestore;
    if (!db) {
      throw new Error('Firebase Firestore is not configured or initialized.');
    }

    const subj = attData.subjectName || attData.subject_name;
    if (!subj) {
      throw new Error('Subject name is required.');
    }

    const attended = Number(attData.attendedClasses ?? attData.attended_classes ?? 0);
    const total = Number(attData.totalClasses ?? attData.total_classes ?? 0);
    const targetPct = Number(attData.targetPercentage ?? attData.target_percentage ?? 75);

    if (isNaN(attended) || isNaN(total) || attended < 0 || total < 0) {
      throw new Error('Attended and total classes count cannot be negative numbers.');
    }
    if (attended > total) {
      throw new Error('Attended classes cannot be greater than total classes.');
    }
    if (targetPct < 0 || targetPct > 100) {
      throw new Error('Target percentage must be between 0% and 100%.');
    }

    const ref = db.collection('users').doc(String(userId)).collection('attendance').doc();
    const docData = {
      id: ref.id,
      userId: String(userId),
      subjectName: subj,
      subject_name: subj,
      attendedClasses: attended,
      attended_classes: attended,
      totalClasses: total,
      total_classes: total,
      targetPercentage: targetPct,
      target_percentage: targetPct,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await ref.set(docData);
    return docData;
  }

  async updateAttendance(userId, attId, attData) {
    const db = this.firestore;
    if (!db) {
      throw new Error('Firebase Firestore is not configured or initialized.');
    }

    const ref = db.collection('users').doc(String(userId)).collection('attendance').doc(String(attId));
    const docSnap = await ref.get();
    if (!docSnap.exists) {
      throw new Error(`Attendance record with ID ${attId} not found for this user.`);
    }

    const existing = docSnap.data();
    const subj = attData.subjectName || attData.subject_name || existing.subjectName || existing.subject_name;
    const attended = Number(attData.attendedClasses ?? attData.attended_classes ?? existing.attendedClasses ?? existing.attended_classes ?? 0);
    const total = Number(attData.totalClasses ?? attData.total_classes ?? existing.totalClasses ?? existing.total_classes ?? 0);
    const targetPct = Number(attData.targetPercentage ?? attData.target_percentage ?? existing.targetPercentage ?? existing.target_percentage ?? 75);

    if (isNaN(attended) || isNaN(total) || attended < 0 || total < 0) {
      throw new Error('Attended and total classes count cannot be negative numbers.');
    }
    if (attended > total) {
      throw new Error('Attended classes cannot be greater than total classes.');
    }

    const dataToSave = {
      ...existing,
      subjectName: subj,
      subject_name: subj,
      attendedClasses: attended,
      attended_classes: attended,
      totalClasses: total,
      total_classes: total,
      targetPercentage: targetPct,
      target_percentage: targetPct,
      updatedAt: new Date().toISOString()
    };

    await ref.set(dataToSave, { merge: true });
    return dataToSave;
  }

  async deleteAttendance(userId, attId) {
    const db = this.firestore;
    if (!db) {
      throw new Error('Firebase Firestore is not configured or initialized.');
    }

    const ref = db.collection('users').doc(String(userId)).collection('attendance').doc(String(attId));
    const docSnap = await ref.get();
    if (!docSnap.exists) {
      throw new Error(`Attendance record with ID ${attId} not found for this user.`);
    }

    await ref.delete();
  }

  // CGPA RECORDS (Firestore: users/{userId}/cgpa_records/{recordId})
  async getUserCgpaRecords(userId) {
    const db = this.firestore;
    if (!db) {
      throw new Error('Firebase Firestore is not configured or initialized.');
    }

    const snap = await db.collection('users').doc(String(userId)).collection('cgpa_records').get();
    const list = this.querySnap(snap);

    let totalPointsAll = 0;
    let totalCreditsAll = 0;

    const semesterMap = {};

    const records = list.map(rec => {
      const sem = rec.semester || 'Semester 1';
      const code = rec.courseCode || rec.code || '';
      const name = rec.courseName || rec.subjectName || rec.subject_name || 'Subject';
      const cr = Number(rec.credits || 0);
      const gr = rec.grade || 'A';
      const gp = Number(rec.gradePoints ?? rec.gpa ?? 9.0);

      if (cr <= 0 || isNaN(cr)) {
        throw new Error('Credits must be a positive integer greater than zero.');
      }
      if (gp < 0 || gp > 10 || isNaN(gp)) {
        throw new Error('Grade points must be between 0 and 10.');
      }

      totalPointsAll += cr * gp;
      totalCreditsAll += cr;

      if (!semesterMap[sem]) {
        semesterMap[sem] = { totalPoints: 0, totalCredits: 0, coursesCount: 0 };
      }
      semesterMap[sem].totalPoints += cr * gp;
      semesterMap[sem].totalCredits += cr;
      semesterMap[sem].coursesCount += 1;

      return {
        id: rec.id,
        userId: String(userId),
        semester: sem,
        courseCode: code,
        courseName: name,
        subjectName: name,
        subject_name: name,
        credits: cr,
        grade: gr,
        gradePoints: gp,
        gpa: gp,
        createdAt: rec.createdAt || rec.created_at || new Date().toISOString(),
        updatedAt: rec.updatedAt || rec.updated_at || new Date().toISOString()
      };
    });

    // Compute Semester SGPAs
    const semesterSgpaMap = {};
    for (const [sem, data] of Object.entries(semesterMap)) {
      semesterSgpaMap[sem] = data.totalCredits > 0 ? Number((data.totalPoints / data.totalCredits).toFixed(2)) : 0.0;
    }

    const cumulativeCGPA = totalCreditsAll > 0 ? Number((totalPointsAll / totalCreditsAll).toFixed(2)) : 0.0;

    return {
      records,
      cumulativeCGPA,
      totalCredits: totalCreditsAll,
      semesterSgpaMap
    };
  }

  async createCgpaRecord(userId, recordData) {
    const db = this.firestore;
    if (!db) {
      throw new Error('Firebase Firestore is not configured or initialized.');
    }

    const sem = recordData.semester || 'Semester 1';
    const name = recordData.courseName || recordData.subject_name || recordData.subjectName || 'Subject';
    const code = recordData.courseCode || recordData.code || '';
    const cr = Number(recordData.credits || 0);
    const gr = recordData.grade || 'A';
    const gp = Number(recordData.gradePoints ?? recordData.gpa ?? 9.0);

    if (!name) {
      throw new Error('Course / Subject name is required.');
    }
    if (isNaN(cr) || cr <= 0) {
      throw new Error('Credits must be a positive number greater than 0.');
    }
    if (isNaN(gp) || gp < 0 || gp > 10) {
      throw new Error('Grade points must be between 0 and 10.');
    }

    const ref = db.collection('users').doc(String(userId)).collection('cgpa_records').doc();
    const docData = {
      id: ref.id,
      userId: String(userId),
      semester: sem,
      courseCode: code,
      courseName: name,
      subjectName: name,
      subject_name: name,
      credits: cr,
      grade: gr,
      gradePoints: gp,
      gpa: gp,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await ref.set(docData);
    return docData;
  }

  async updateCgpaRecord(userId, recordId, recordData) {
    const db = this.firestore;
    if (!db) {
      throw new Error('Firebase Firestore is not configured or initialized.');
    }

    const ref = db.collection('users').doc(String(userId)).collection('cgpa_records').doc(String(recordId));
    const docSnap = await ref.get();
    if (!docSnap.exists) {
      throw new Error(`CGPA record with ID ${recordId} not found for this user.`);
    }

    const existing = docSnap.data();
    const sem = recordData.semester || existing.semester || 'Semester 1';
    const name = recordData.courseName || recordData.subject_name || recordData.subjectName || existing.courseName || existing.subjectName || 'Subject';
    const code = recordData.courseCode || recordData.code || existing.courseCode || '';
    const cr = Number(recordData.credits ?? existing.credits ?? 0);
    const gr = recordData.grade || existing.grade || 'A';
    const gp = Number(recordData.gradePoints ?? recordData.gpa ?? existing.gradePoints ?? existing.gpa ?? 9.0);

    if (isNaN(cr) || cr <= 0) {
      throw new Error('Credits must be a positive number greater than 0.');
    }
    if (isNaN(gp) || gp < 0 || gp > 10) {
      throw new Error('Grade points must be between 0 and 10.');
    }

    const dataToSave = {
      ...existing,
      semester: sem,
      courseCode: code,
      courseName: name,
      subjectName: name,
      subject_name: name,
      credits: cr,
      grade: gr,
      gradePoints: gp,
      gpa: gp,
      updatedAt: new Date().toISOString()
    };

    await ref.set(dataToSave, { merge: true });
    return dataToSave;
  }

  async deleteCgpaRecord(userId, recordId) {
    const db = this.firestore;
    if (!db) {
      throw new Error('Firebase Firestore is not configured or initialized.');
    }

    const ref = db.collection('users').doc(String(userId)).collection('cgpa_records').doc(String(recordId));
    const docSnap = await ref.get();
    if (!docSnap.exists) {
      throw new Error(`CGPA record with ID ${recordId} not found for this user.`);
    }

    await ref.delete();
  }

  // GOALS (Firestore: users/{userId}/goals/{goalId})
  async getUserGoals(userId) {
    const db = this.firestore;
    if (!db) {
      throw new Error('Firebase Firestore is not configured or initialized.');
    }

    const snap = await db.collection('users').doc(String(userId)).collection('goals').get();
    const list = this.querySnap(snap);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const goals = list.map(g => {
      const prog = Math.min(100, Math.max(0, Number(g.progressPercentage ?? g.progress_percentage ?? g.progress ?? 0)));
      const isCompleted = prog >= 100 || g.completed === true || g.status === 'completed';

      const targetDateStr = g.targetDate || g.target_date || null;
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
        id: g.id,
        userId: String(userId),
        title: g.title || 'Untitled Goal',
        description: g.description || '',
        category: g.category || 'Academic',
        targetDate: targetDateStr,
        target_date: targetDateStr,
        progress: prog,
        progressPercentage: prog,
        progress_percentage: prog,
        completed: isCompleted,
        status: isCompleted ? 'completed' : 'in_progress',
        daysRemaining,
        isOverdue,
        createdAt: g.createdAt || g.created_at || new Date().toISOString(),
        updatedAt: g.updatedAt || g.updated_at || new Date().toISOString()
      };
    });

    return goals;
  }

  async createGoal(userId, goalData) {
    const db = this.firestore;
    if (!db) {
      throw new Error('Firebase Firestore is not configured or initialized.');
    }

    const title = goalData.title?.trim();
    if (!title) {
      throw new Error('Goal title is required.');
    }

    const prog = Number(goalData.progressPercentage ?? goalData.progress_percentage ?? goalData.progress ?? 0);
    if (isNaN(prog) || prog < 0 || prog > 100) {
      throw new Error('Goal progress percentage must be between 0% and 100%.');
    }

    const isCompleted = prog >= 100 || goalData.completed === true;

    const ref = db.collection('users').doc(String(userId)).collection('goals').doc();
    const docData = {
      id: ref.id,
      userId: String(userId),
      title,
      description: goalData.description || '',
      category: goalData.category || 'Academic',
      targetDate: goalData.targetDate || goalData.target_date || null,
      target_date: goalData.targetDate || goalData.target_date || null,
      progress: prog,
      progressPercentage: prog,
      progress_percentage: prog,
      completed: isCompleted,
      status: isCompleted ? 'completed' : 'in_progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await ref.set(docData);
    return docData;
  }

  async updateGoal(userId, goalId, goalData) {
    const db = this.firestore;
    if (!db) {
      throw new Error('Firebase Firestore is not configured or initialized.');
    }

    const ref = db.collection('users').doc(String(userId)).collection('goals').doc(String(goalId));
    const docSnap = await ref.get();
    if (!docSnap.exists) {
      throw new Error(`Goal with ID ${goalId} not found for this user.`);
    }

    const existing = docSnap.data();

    const title = (goalData.title !== undefined ? goalData.title : existing.title)?.trim();
    if (!title) {
      throw new Error('Goal title cannot be empty.');
    }

    const rawProg = goalData.progress_percentage !== undefined ? goalData.progress_percentage : (goalData.progressPercentage !== undefined ? goalData.progressPercentage : (goalData.progress !== undefined ? goalData.progress : (existing.progress_percentage ?? existing.progressPercentage ?? existing.progress)));
    const prog = Number(rawProg ?? 0);
    if (isNaN(prog) || prog < 0 || prog > 100) {
      throw new Error('Goal progress percentage must be between 0% and 100%.');
    }

    const isCompleted = prog >= 100 || goalData.completed === true;

    const dataToSave = {
      ...existing,
      title,
      description: goalData.description !== undefined ? goalData.description : (existing.description || ''),
      category: goalData.category || existing.category || 'Academic',
      targetDate: goalData.targetDate || goalData.target_date || existing.targetDate || existing.target_date || null,
      target_date: goalData.targetDate || goalData.target_date || existing.targetDate || existing.target_date || null,
      progress: prog,
      progressPercentage: prog,
      progress_percentage: prog,
      completed: isCompleted,
      status: isCompleted ? 'completed' : 'in_progress',
      updatedAt: new Date().toISOString()
    };

    await ref.set(dataToSave, { merge: true });
    return dataToSave;
  }

  async deleteGoal(userId, goalId) {
    const db = this.firestore;
    if (!db) {
      throw new Error('Firebase Firestore is not configured or initialized.');
    }

    const ref = db.collection('users').doc(String(userId)).collection('goals').doc(String(goalId));
    const docSnap = await ref.get();
    if (!docSnap.exists) {
      throw new Error(`Goal with ID ${goalId} not found for this user.`);
    }

    await ref.delete();
  }

  // STUDY SESSIONS (Firestore: users/{userId}/study_sessions/{sessionId})
  async getUserStudySessions(userId, filter = 'all') {
    const db = this.firestore;
    if (!db) {
      throw new Error('Firebase Firestore is not configured or initialized.');
    }

    const snap = await db.collection('users').doc(String(userId)).collection('study_sessions').get();
    const list = this.querySnap(snap);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const allSessions = list.map(s => {
      const subj = s.subject || s.subjectName || s.subject_name || 'General Focus';
      const top = s.topic || s.topicName || s.topic_name || '';
      const ex = s.exam || s.examId || '';
      const dur = Number(s.durationMinutes ?? s.duration_minutes ?? s.duration ?? 25);
      const stType = s.sessionType || s.session_type || 'pomodoro';
      const created = s.createdAt || s.created_at || new Date().toISOString();
      const start = s.startTime || s.start_time || created;
      const end = s.endTime || s.end_time || created;
      const isCompleted = s.completed !== undefined ? s.completed : true;

      return {
        id: s.id,
        userId: String(userId),
        subject: subj,
        subjectName: subj,
        subject_name: subj,
        topic: top,
        topicName: top,
        topic_name: top,
        exam: ex,
        examId: ex,
        durationMinutes: dur,
        duration_minutes: dur,
        sessionType: stType,
        session_type: stType,
        startTime: start,
        endTime: end,
        completed: isCompleted,
        createdAt: created,
        created_at: created
      };
    });

    // Filter sessions
    const filteredSessions = allSessions.filter(s => {
      const createdDate = new Date(s.createdAt);
      if (filter === 'today') {
        return s.createdAt.startsWith(todayStr);
      }
      if (filter === 'week') {
        return createdDate >= sevenDaysAgo;
      }
      if (filter === 'month') {
        return createdDate >= thirtyDaysAgo;
      }
      return true;
    });

    // Compute Weekly Breakdown (Monday to Sunday)
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeklySummary = {
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
      Sunday: 0
    };

    allSessions.forEach(s => {
      const d = new Date(s.createdAt);
      if (d >= sevenDaysAgo) {
        const dayName = daysOfWeek[d.getDay()];
        if (weeklySummary[dayName] !== undefined) {
          weeklySummary[dayName] += s.durationMinutes;
        }
      }
    });

    return {
      sessions: filteredSessions,
      allSessions,
      weeklySummary
    };
  }

  async recordStudySession(userId, sessionData) {
    const db = this.firestore;
    if (!db) {
      throw new Error('Firebase Firestore is not configured or initialized.');
    }

    const dur = Number(sessionData.durationMinutes ?? sessionData.duration_minutes ?? sessionData.duration ?? 25);
    if (isNaN(dur) || dur <= 0) {
      throw new Error('Study session duration must be a positive number greater than 0 minutes.');
    }

    const subj = sessionData.subject || sessionData.subjectName || sessionData.subject_name || 'General Focus';
    const top = sessionData.topic || sessionData.topicName || sessionData.topic_name || '';
    const ex = sessionData.exam || sessionData.examId || '';
    const stType = sessionData.sessionType || sessionData.session_type || 'pomodoro';
    const nowIso = new Date().toISOString();

    const ref = db.collection('users').doc(String(userId)).collection('study_sessions').doc();
    const docData = {
      id: ref.id,
      userId: String(userId),
      subject: subj,
      subjectName: subj,
      subject_name: subj,
      topic: top,
      topicName: top,
      topic_name: top,
      exam: ex,
      examId: ex,
      durationMinutes: dur,
      duration_minutes: dur,
      sessionType: stType,
      session_type: stType,
      startTime: sessionData.startTime || sessionData.start_time || nowIso,
      endTime: sessionData.endTime || sessionData.end_time || nowIso,
      completed: true,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    await ref.set(docData);

    // Update Streak Logic
    await this.updateStudyStreak(userId);

    return docData;
  }

  // Helper to resolve user document reference reliably across doc IDs, UIDs, and emails
  async getUserRef(userId) {
    const db = this.firestore;
    if (!db || !userId) return null;

    const idStr = String(userId);

    // 1. Direct doc ID
    const directRef = db.collection('users').doc(idStr);
    const directSnap = await directRef.get().catch(() => null);
    if (directSnap && directSnap.exists) {
      return directRef;
    }

    // 2. Query by 'uid'
    const uidSnap = await db.collection('users').where('uid', '==', idStr).limit(1).get().catch(() => null);
    if (uidSnap && !uidSnap.empty) {
      return uidSnap.docs[0].ref;
    }

    // 3. Query by 'id'
    const idSnap = await db.collection('users').where('id', '==', idStr).limit(1).get().catch(() => null);
    if (idSnap && !idSnap.empty) {
      return idSnap.docs[0].ref;
    }

    // 4. Query by 'email'
    const emailSnap = await db.collection('users').where('email', '==', idStr).limit(1).get().catch(() => null);
    if (emailSnap && !emailSnap.empty) {
      return emailSnap.docs[0].ref;
    }

    return directRef;
  }

  // REUSABLE STREAK UPDATE FUNCTION (Firestore Transaction)
  async updateUserStreak(userId, overrideTodayStr = null) {
    const db = this.firestore;
    if (!db || !userId) return null;

    const userRef = await this.getUserRef(userId);
    if (!userRef) return null;

    const now = new Date();
    const todayStr = overrideTodayStr || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Calculate yesterday's date string relative to todayStr
    const todayParts = todayStr.split('-').map(Number);
    const todayDateObj = new Date(todayParts[0], todayParts[1] - 1, todayParts[2]);
    const yesterdayDateObj = new Date(todayDateObj);
    yesterdayDateObj.setDate(yesterdayDateObj.getDate() - 1);
    const yesterdayStr = `${yesterdayDateObj.getFullYear()}-${String(yesterdayDateObj.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDateObj.getDate()).padStart(2, '0')}`;

    let streakResult = null;

    await db.runTransaction(async (transaction) => {
      const userDocSnap = await transaction.get(userRef);
      const userData = userDocSnap.exists ? userDocSnap.data() : {};

      const mainStreakRef = userRef.collection('study_streaks').doc('main');
      const mainStreakSnap = await transaction.get(mainStreakRef);
      const mainStreakData = mainStreakSnap.exists ? mainStreakSnap.data() : {};

      const prevStreak = Number(userData.currentStreak ?? userData.current_streak ?? mainStreakData.currentStreak ?? mainStreakData.current_streak ?? 0);
      const prevLongest = Number(userData.longestStreak ?? userData.longest_streak ?? mainStreakData.longestStreak ?? mainStreakData.longest_streak ?? 0);
      const prevDate = userData.lastActiveDate || userData.last_active_date || mainStreakData.lastActiveDate || mainStreakData.last_active_date || null;

      let currentStreak = 1;
      let longestStreak = Math.max(prevLongest, 1);

      if (!prevDate) {
        // First activity ever
        currentStreak = 1;
        longestStreak = Math.max(prevLongest, 1);
      } else if (prevDate === todayStr) {
        // Activity already recorded today -> DO NOT INCREMENT AGAIN
        currentStreak = prevStreak > 0 ? prevStreak : 1;
        longestStreak = Math.max(prevLongest, currentStreak);
      } else if (prevDate === yesterdayStr) {
        // Activity recorded yesterday -> Consecutive day increment!
        currentStreak = prevStreak + 1;
        longestStreak = Math.max(prevLongest, currentStreak);
      } else {
        // Missed one or more full days -> Reset currentStreak to 1
        currentStreak = 1;
        longestStreak = Math.max(prevLongest, 1);
      }

      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }

      streakResult = {
        currentStreak,
        longestStreak,
        lastActiveDate: todayStr,
        isStreakActiveToday: true,
        updatedAt: now.toISOString()
      };

      // 1. Permanently update the authenticated user's document in Firestore
      transaction.set(userRef, {
        currentStreak,
        longestStreak,
        lastActiveDate: todayStr,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_active_date: todayStr,
        updatedAt: now.toISOString()
      }, { merge: true });

      // 2. Also keep study_streaks/main subcollection synced
      transaction.set(mainStreakRef, {
        id: 'main',
        userId: String(userId),
        currentStreak,
        longestStreak,
        lastActiveDate: todayStr,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_active_date: todayStr,
        updatedAt: now.toISOString()
      }, { merge: true });
    });

    return streakResult;
  }

  async updateStudyStreak(userId, overrideTodayStr = null) {
    return this.updateUserStreak(userId, overrideTodayStr);
  }

  async getUserStreak(userId) {
    const db = this.firestore;
    if (!db || !userId) {
      return { currentStreak: 0, longestStreak: 0, lastActiveDate: null, isStreakActiveToday: false };
    }

    const userRef = await this.getUserRef(userId);
    const userDocSnap = await userRef.get().catch(() => null);

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const yesterdayObj = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const yesterdayStr = `${yesterdayObj.getFullYear()}-${String(yesterdayObj.getMonth() + 1).padStart(2, '0')}-${String(yesterdayObj.getDate()).padStart(2, '0')}`;

    if (userDocSnap && userDocSnap.exists) {
      const data = userDocSnap.data();

      // Check subcollection fallback if top level fields missing
      const mainStreakRef = userRef.collection('study_streaks').doc('main');
      const mainStreakSnap = await mainStreakRef.get().catch(() => null);
      const mainStreakData = mainStreakSnap && mainStreakSnap.exists ? mainStreakSnap.data() : {};

      const prevStreak = Number(data.currentStreak ?? data.current_streak ?? mainStreakData.currentStreak ?? mainStreakData.current_streak ?? 0);
      const prevLongest = Number(data.longestStreak ?? data.longest_streak ?? mainStreakData.longestStreak ?? mainStreakData.longest_streak ?? 0);
      const lastActiveDate = data.lastActiveDate || data.last_active_date || mainStreakData.lastActiveDate || mainStreakData.last_active_date || null;

      let currentStreak = prevStreak;
      if (lastActiveDate && lastActiveDate !== todayStr && lastActiveDate !== yesterdayStr) {
        currentStreak = 0;
      }

      return {
        currentStreak,
        longestStreak: prevLongest,
        lastActiveDate,
        isStreakActiveToday: lastActiveDate === todayStr
      };
    }

    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      isStreakActiveToday: false
    };
  }

  // TOPIC PROGRESS
  async getUserTopicProgress(userId) {
    const db = this.firestore;
    if (!db) return [];
    const snap = await db.collection('users').doc(String(userId)).collection('topic_progress').get();
    return this.querySnap(snap);
  }

  async updateTopicProgress(userId, topicId, status) {
    const db = this.firestore;
    if (!db) return null;

    const ref = db.collection('users').doc(String(userId)).collection('topic_progress').doc(String(topicId));
    const docData = {
      id: String(topicId),
      userId: String(userId),
      topicId: String(topicId),
      status: status || 'completed',
      updatedAt: new Date().toISOString()
    };
    await ref.set(docData, { merge: true });
    return docData;
  }

  // TARGET EXAM
  async getUserTargetExam(userId) {
    const db = this.firestore;
    if (!db) return null;
    const doc = await db.collection('users').doc(String(userId)).collection('target_exam').doc('current').get();
    return this.docWithId(doc);
  }

  async setUserTargetExam(userId, examId, targetExamDate) {
    const db = this.firestore;
    if (!db) return null;

    const ref = db.collection('users').doc(String(userId)).collection('target_exam').doc('current');
    const docData = {
      id: 'current',
      userId: String(userId),
      examId: String(examId),
      targetExamDate: targetExamDate || null,
      updatedAt: new Date().toISOString()
    };
    await ref.set(docData);
    return docData;
  }

  // ==========================================
  // 5. QUESTIONS, QUIZZES, MOCK TESTS & RESULTS
  // ==========================================
  async getQuestions(filter = {}) {
    const db = this.firestore;
    if (!db) return [];

    let query = db.collection('questions');
    if (filter.subjectId) query = query.where('subjectId', '==', String(filter.subjectId));
    if (filter.examId) query = query.where('examId', '==', String(filter.examId));

    const snap = await query.get();
    return this.querySnap(snap);
  }

  async createQuestion(questionData) {
    const db = this.firestore;
    if (!db) return null;

    const ref = db.collection('questions').doc();
    const docData = {
      id: ref.id,
      subjectId: String(questionData.subject_id || questionData.subjectId),
      topicId: questionData.topic_id || questionData.topicId ? String(questionData.topic_id || questionData.topicId) : null,
      examId: questionData.exam_id || questionData.examId ? String(questionData.exam_id || questionData.examId) : null,
      year: questionData.year || '2024',
      questionText: questionData.question_text || questionData.questionText,
      optionA: questionData.option_a || questionData.optionA,
      optionB: questionData.option_b || questionData.optionB,
      optionC: questionData.option_c || questionData.optionC,
      optionD: questionData.option_d || questionData.optionD,
      correctOption: questionData.correct_option || questionData.correctOption,
      explanation: questionData.explanation || '',
      difficulty: questionData.difficulty || 'medium',
      createdAt: new Date().toISOString()
    };
    await ref.set(docData);
    return docData;
  }

  async getQuizzes(filter = {}) {
    const db = this.firestore;
    if (!db) return [];

    let query = db.collection('quizzes');
    if (filter.examId) query = query.where('examId', '==', String(filter.examId));

    const snap = await query.get();
    return this.querySnap(snap);
  }

  async saveQuizResult(userId, quizId, scoreData) {
    const db = this.firestore;
    if (!db) return null;

    const ref = db.collection('users').doc(String(userId)).collection('quiz_results').doc();
    const docData = {
      id: ref.id,
      userId: String(userId),
      quizId: String(quizId),
      score: Number(scoreData.score || 0),
      totalQuestions: Number(scoreData.total_questions || scoreData.totalQuestions || 0),
      correctCount: Number(scoreData.correct_count || scoreData.correctCount || 0),
      timeTakenSeconds: Number(scoreData.time_taken_seconds || scoreData.timeTakenSeconds || 0),
      completedAt: new Date().toISOString()
    };
    await ref.set(docData);
    return docData;
  }

  async getMockTests(filter = {}) {
    const db = this.firestore;
    if (!db) return [];

    let query = db.collection('mock_tests');
    if (filter.examId) query = query.where('examId', '==', String(filter.examId));

    const snap = await query.get();
    return this.querySnap(snap);
  }

  async getUserQuizResults(userId) {
    const db = this.firestore;
    if (!db) return [];

    const snap = await db.collection('users').doc(String(userId)).collection('quiz_results').get();
    const list = this.querySnap(snap);
    list.sort((a, b) => new Date(a.completedAt || a.completed_at || 0) - new Date(b.completedAt || b.completed_at || 0));
    return list;
  }

  async getUserMockTestResults(userId) {
    const db = this.firestore;
    if (!db) return [];

    const snap = await db.collection('users').doc(String(userId)).collection('mock_test_results').get();
    const list = this.querySnap(snap);
    list.sort((a, b) => new Date(a.completedAt || a.completed_at || 0) - new Date(b.completedAt || b.completed_at || 0));
    return list;
  }

  async saveMockTestResult(userId, testId, scoreData) {
    const db = this.firestore;
    if (!db) return null;

    const ref = db.collection('users').doc(String(userId)).collection('mock_test_results').doc();
    const docData = {
      id: ref.id,
      userId: String(userId),
      mockTestId: String(testId),
      testTitle: scoreData.testTitle || scoreData.test_title || 'Mock Test',
      score: Number(scoreData.score || 0),
      percentage: Number(scoreData.percentage || 0),
      passed: Boolean(scoreData.passed),
      weakSubjectsJson: scoreData.weak_subjects_json || JSON.stringify(scoreData.weakSubjects || []),
      completedAt: new Date().toISOString()
    };
    await ref.set(docData);
    return docData;
  }

  async getUserAnalytics(userId) {
    const db = this.firestore;
    if (!db) {
      throw new Error('Firebase Firestore is not configured or initialized.');
    }

    const [
      tasksList,
      attendanceData,
      cgpaData,
      goalsList,
      sessionsData,
      streakData,
      quizResults,
      mockResults,
      topicProgressList,
      quizzesCatalog,
      mockTestsCatalog,
      questionsCatalog,
      targetExamData
    ] = await Promise.all([
      this.getUserTasks(userId).catch(() => []),
      this.getUserAttendance(userId).catch(() => ({ attendance: [], overallPercentage: 100, totalAttended: 0, totalClasses: 0 })),
      this.getUserCgpaRecords(userId).catch(() => ({ records: [], cumulativeCGPA: '0.00', totalCredits: 0 })),
      this.getUserGoals(userId).catch(() => []),
      this.getUserStudySessions(userId, 'all').catch(() => ({ sessions: [], allSessions: [], weeklySummary: {} })),
      this.getUserStreak(userId).catch(() => ({ currentStreak: 1, longestStreak: 1 })),
      this.getUserQuizResults(userId).catch(() => []),
      this.getUserMockTestResults(userId).catch(() => []),
      this.getUserTopicProgress(userId).catch(() => []),
      this.getQuizzes().catch(() => []),
      this.getMockTests().catch(() => []),
      this.getQuestions().catch(() => []),
      this.getUserTargetExam(userId).catch(() => null)
    ]);

    // 1. Task Performance
    const totalTasks = tasksList.length;
    const completedTasks = tasksList.filter(t => t.completed === true || t.status === 'completed').length;
    const pendingTasks = totalTasks - completedTasks;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : null;

    // 2. Attendance Analytics
    const overallAttendance = attendanceData.overallPercentage !== undefined ? attendanceData.overallPercentage : 100;
    const overallPercentage = overallAttendance;
    const attendanceRecords = attendanceData.attendance || [];
    const subjectsBelowTarget = attendanceRecords.filter(a => a.currentPercentage < a.targetPercentage);

    // 3. CGPA
    const cumulativeCGPA = cgpaData.cumulativeCGPA !== undefined ? cgpaData.cumulativeCGPA : '0.00';
    const totalCredits = cgpaData.totalCredits || 0;

    // 4. Goal Performance
    const totalGoals = goalsList.length;
    const completedGoals = goalsList.filter(g => g.completed === true || g.progress >= 100).length;
    const avgGoalProgress = totalGoals > 0 ? Math.round(goalsList.reduce((acc, g) => acc + Number(g.progress || 0), 0) / totalGoals) : null;

    // 5. Study Time Analytics
    const allSessions = sessionsData.allSessions || [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let todayMinutes = 0;
    let thisWeekMinutes = 0;
    let thisMonthMinutes = 0;
    let totalMinutes = 0;
    const subjectStudyMinutes = {};

    allSessions.forEach(s => {
      const dur = Number(s.durationMinutes || s.duration_minutes || s.duration || 0);
      totalMinutes += dur;
      const createdDate = new Date(s.createdAt || s.created_at || Date.now());

      if ((s.createdAt || s.created_at || '').startsWith(todayStr)) {
        todayMinutes += dur;
      }
      if (createdDate >= sevenDaysAgo) {
        thisWeekMinutes += dur;
      }
      if (createdDate >= thirtyDaysAgo) {
        thisMonthMinutes += dur;
      }

      const subj = s.subject || s.subjectName || s.subject_name || 'General Focus';
      subjectStudyMinutes[subj] = (subjectStudyMinutes[subj] || 0) + dur;
    });

    const formatTime = (mins) => {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      if (h === 0) return `${m}m`;
      if (m === 0) return `${h}h`;
      return `${h}h ${m}m`;
    };

    // Weekly Breakdown (Mon-Sun)
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeklyBreakdown = { Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 };
    allSessions.forEach(s => {
      const d = new Date(s.createdAt || s.created_at || Date.now());
      if (d >= sevenDaysAgo) {
        const dayName = daysOfWeek[d.getDay()];
        if (weeklyBreakdown[dayName] !== undefined) {
          weeklyBreakdown[dayName] += Number(s.durationMinutes || s.duration_minutes || 0);
        }
      }
    });

    // 6. Quiz Performance
    const quizMap = {};
    quizzesCatalog.forEach(q => { quizMap[q.id] = q; });

    const quizAttempts = quizResults.map((r, index) => {
      const totalQ = Number(r.totalQuestions || r.total_questions || 0);
      const corrC = Number(r.correctCount || r.correct_count || 0);
      const pct = r.percentage !== undefined ? Number(r.percentage) : (totalQ > 0 ? Math.round((corrC / totalQ) * 100) : Math.round(Number(r.score || 0)));
      return {
        id: r.id,
        attemptNumber: index + 1,
        quizId: r.quizId || r.quiz_id,
        quizTitle: quizMap[r.quizId || r.quiz_id]?.title || r.quizTitle || `Quiz Attempt ${index + 1}`,
        score: Number(r.score || 0),
        totalQuestions: totalQ,
        correctCount: corrC,
        percentage: pct,
        timeTakenSeconds: Number(r.timeTakenSeconds || r.time_taken_seconds || 0),
        completedAt: r.completedAt || r.completed_at || new Date().toISOString()
      };
    });

    const hasQuizData = quizAttempts.length > 0;
    const avgQuizScore = hasQuizData ? Math.round(quizAttempts.reduce((acc, q) => acc + q.percentage, 0) / quizAttempts.length) : null;
    const latestQuizScore = hasQuizData ? quizAttempts[quizAttempts.length - 1].percentage : null;
    const firstQuizScore = hasQuizData ? quizAttempts[0].percentage : null;
    const prevQuizScore = quizAttempts.length > 1 ? quizAttempts[quizAttempts.length - 2].percentage : null;
    const quizTrend = (latestQuizScore !== null && prevQuizScore !== null)
      ? (latestQuizScore > prevQuizScore ? 'improving' : latestQuizScore < prevQuizScore ? 'declining' : 'stable')
      : 'no_data';

    // 7. Mock Test Performance
    const mockMap = {};
    mockTestsCatalog.forEach(m => { mockMap[m.id] = m; });

    const mockAttempts = mockResults.map((r, index) => {
      const pct = r.percentage !== undefined ? Number(r.percentage) : Math.round(Number(r.score || 0));
      return {
        id: r.id,
        attemptNumber: index + 1,
        mockTestId: r.mockTestId || r.mock_test_id,
        testTitle: mockMap[r.mockTestId || r.mock_test_id]?.title || r.testTitle || `Mock Test ${index + 1}`,
        score: Number(r.score || 0),
        percentage: pct,
        passed: Boolean(r.passed),
        weakSubjectsJson: r.weakSubjectsJson || r.weak_subjects_json || '[]',
        completedAt: r.completedAt || r.completed_at || new Date().toISOString()
      };
    });

    const hasMockData = mockAttempts.length > 0;
    const avgMockScore = hasMockData ? Math.round(mockAttempts.reduce((acc, m) => acc + m.percentage, 0) / mockAttempts.length) : null;
    const bestMockScore = hasMockData ? Math.max(...mockAttempts.map(m => m.percentage)) : null;
    const latestMockScore = hasMockData ? mockAttempts[mockAttempts.length - 1].percentage : null;
    const firstMockScore = hasMockData ? mockAttempts[0].percentage : null;
    const mockImprovementPct = (latestMockScore !== null && firstMockScore !== null) ? (latestMockScore - firstMockScore) : 0;
    const mockTrend = mockImprovementPct > 0 ? 'improving' : mockImprovementPct < 0 ? 'declining' : 'stable';

    // 8. Topic Accuracy & Weak / Strong Topics Detection
    const topicStatsMap = {};

    // Analyze Quiz Attempts for Topic Accuracy
    quizResults.forEach(r => {
      if (r.topicScores && Array.isArray(r.topicScores)) {
        r.topicScores.forEach(ts => {
          const name = ts.topicName || ts.topic || 'General Topic';
          if (!topicStatsMap[name]) topicStatsMap[name] = { total: 0, correct: 0, subject: ts.subject || 'General' };
          topicStatsMap[name].total += Number(ts.totalQuestions || 0);
          topicStatsMap[name].correct += Number(ts.correctCount || 0);
        });
      } else if (r.topicName || r.topic) {
        const name = r.topicName || r.topic;
        if (!topicStatsMap[name]) topicStatsMap[name] = { total: 0, correct: 0, subject: r.subject || 'General' };
        topicStatsMap[name].total += Number(r.totalQuestions || 10);
        topicStatsMap[name].correct += Number(r.correctCount || 0);
      }
    });

    // Analyze Mock Test Attempts for Topic/Subject Accuracy
    mockResults.forEach(r => {
      let weakList = [];
      try {
        weakList = JSON.parse(r.weakSubjectsJson || r.weak_subjects_json || '[]');
      } catch (e) { weakList = []; }

      if (Array.isArray(weakList)) {
        weakList.forEach(wItem => {
          const name = typeof wItem === 'string' ? wItem : (wItem.topic || wItem.subject || 'Topic');
          if (!topicStatsMap[name]) topicStatsMap[name] = { total: 10, correct: 4, subject: 'Competitive' };
          else {
            topicStatsMap[name].total += 10;
            topicStatsMap[name].correct += 4;
          }
        });
      }
    });

    const weakTopics = [];
    const strongTopics = [];
    const subjectScoresMap = {};

    Object.keys(topicStatsMap).forEach(topicName => {
      const stat = topicStatsMap[topicName];
      if (stat.total > 0) {
        const accuracy = Math.round((stat.correct / stat.total) * 100);
        const subj = stat.subject || 'General';

        if (!subjectScoresMap[subj]) subjectScoresMap[subj] = { total: 0, correct: 0 };
        subjectScoresMap[subj].total += stat.total;
        subjectScoresMap[subj].correct += stat.correct;

        if (accuracy < 65) {
          let statusTier = '🔴 Critical';
          if (accuracy >= 50 && accuracy < 60) statusTier = '🟠 Warning';
          else if (accuracy >= 60) statusTier = '🟡 Needs Attention';

          weakTopics.push({
            topic: topicName,
            accuracy,
            statusTier,
            subject: subj
          });
        } else if (accuracy >= 75) {
          strongTopics.push({
            topic: topicName,
            accuracy,
            statusTier: '🟢 Mastered',
            subject: subj
          });
        }
      }
    });

    weakTopics.sort((a, b) => a.accuracy - b.accuracy);
    strongTopics.sort((a, b) => b.accuracy - a.accuracy);

    // 9. Subject Performance
    const subjectPerformance = [];
    Object.keys(subjectScoresMap).forEach(subj => {
      const data = subjectScoresMap[subj];
      const accuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
      subjectPerformance.push({
        subject: subj,
        accuracy,
        totalQuestions: data.total,
        correctCount: data.correct
      });
    });

    // 10. Overall Performance Metrics Summary
    const overallPerformance = {
      tasksCompletedPct: taskCompletionRate !== null ? taskCompletionRate : 0,
      attendancePct: overallAttendance,
      quizAccuracyPct: avgQuizScore !== null ? avgQuizScore : 0,
      mockTestScorePct: avgMockScore !== null ? avgMockScore : 0,
      goalsProgressPct: avgGoalProgress !== null ? avgGoalProgress : 0
    };

    // 11. Personalized Recommendations System (Rule-based)
    const recommendations = [];

    // Rule A: Weak Topic Alert
    if (weakTopics.length > 0) {
      const topWeak = weakTopics[0];
      recommendations.push({
        id: 'rec_weak_topic',
        type: 'critical',
        title: `Focus on ${topWeak.topic}`,
        text: `Your recent accuracy is ${topWeak.accuracy}%. Spend more time practicing this topic to build mastery.`,
        badgeColor: '#ef4444',
        actionLabel: 'Practice Questions',
        actionUrl: '/competitive/questions'
      });
    }

    // Rule B: Attendance Warning
    if (subjectsBelowTarget.length > 0) {
      const sub = subjectsBelowTarget[0];
      recommendations.push({
        id: 'rec_attendance',
        type: 'warning',
        title: `Improve ${sub.subjectName} Attendance`,
        text: `Current attendance is ${sub.currentPercentage}% (Target: ${sub.targetPercentage}%). You need to attend ${sub.classesNeeded || 1} upcoming classes.`,
        badgeColor: '#f59e0b',
        actionLabel: 'View Attendance',
        actionUrl: '/college/attendance'
      });
    }

    // Rule C: Goal Progress & Target Date
    const urgentGoal = goalsList.find(g => !g.completed && g.daysRemaining !== null && g.daysRemaining <= 14 && g.progress < 70);
    if (urgentGoal) {
      recommendations.push({
        id: 'rec_urgent_goal',
        type: 'warning',
        title: `Increase Effort for ${urgentGoal.title}`,
        text: `Target date is approaching (${urgentGoal.daysRemaining} days left) and progress is currently at ${urgentGoal.progress}%.`,
        badgeColor: '#3b82f6',
        actionLabel: 'View Goals',
        actionUrl: '/college/goals'
      });
    }

    // Rule D: Mock Test Trend
    if (hasMockData && mockTrend === 'declining') {
      recommendations.push({
        id: 'rec_declining_mock',
        type: 'critical',
        title: 'Review Weak Topics Before Next Mock',
        text: `Your recent mock test score dropped by ${Math.abs(mockImprovementPct)}%. Re-visit weak topics before attempting another mock test.`,
        badgeColor: '#ef4444',
        actionLabel: 'Review Weak Topics',
        actionUrl: '/competitive/roadmap'
      });
    }

    // Rule E: Study Streak Encouragement
    if (streakData.currentStreak > 1) {
      recommendations.push({
        id: 'rec_streak',
        type: 'good',
        title: `Keep your ${streakData.currentStreak}-day study streak!`,
        text: 'Consistency is key to long-term success. Log a session today to keep your momentum going.',
        badgeColor: '#10b981',
        actionLabel: 'Start Study Session',
        actionUrl: '/college/pomodoro'
      });
    } else if (todayMinutes === 0) {
      recommendations.push({
        id: 'rec_no_session_today',
        type: 'info',
        title: 'Start a Study Session Today',
        text: 'You have not logged any study time today. Try a 25-minute Pomodoro session to kickstart your day.',
        badgeColor: '#6366f1',
        actionLabel: 'Start Pomodoro',
        actionUrl: '/college/pomodoro'
      });
    }

    // Return Complete Structured Analytics Payload
    return {
      userId,
      examTitle: targetExamData?.examTitle || 'Competitive & College Prep',

      // Data Availability Flags
      hasTaskData: totalTasks > 0,
      hasAttendanceData: attendanceRecords.length > 0,
      hasCgpaData: (cgpaData.records || []).length > 0,
      hasGoalData: totalGoals > 0,
      hasStudyData: allSessions.length > 0,
      hasQuizData,
      hasMockData,

      // 1. Overall Performance Dashboard
      overallPerformance,

      // 2. Task Performance
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        completionRate: taskCompletionRate
      },

      // 3. Attendance Analytics
      attendance: {
        overallPercentage,
        records: attendanceRecords,
        subjectsBelowTarget
      },

      // 4. CGPA
      cgpa: {
        cumulativeCGPA,
        totalCredits,
        records: cgpaData.records || []
      },

      // 5. Goals
      goals: {
        total: totalGoals,
        completed: completedGoals,
        averageProgress: avgGoalProgress,
        list: goalsList
      },

      // 6. Study Time Analytics
      studyTime: {
        todayMinutes,
        thisWeekMinutes,
        thisMonthMinutes,
        totalMinutes,
        todayFormatted: formatTime(todayMinutes),
        thisWeekFormatted: formatTime(thisWeekMinutes),
        thisMonthFormatted: formatTime(thisMonthMinutes),
        totalHours: (totalMinutes / 60).toFixed(1),
        weeklyBreakdown,
        subjectStudyMinutes
      },

      // 7. Quiz Performance
      quizPerformance: {
        attempts: quizAttempts,
        totalAttempts: quizAttempts.length,
        averageScore: avgQuizScore,
        latestScore: latestQuizScore,
        firstScore: firstQuizScore,
        trend: quizTrend
      },

      // 8. Mock Test Performance
      mockPerformance: {
        attempts: mockAttempts,
        totalAttempts: mockAttempts.length,
        bestScore: bestMockScore,
        averageScore: avgMockScore,
        latestScore: latestMockScore,
        firstScore: firstMockScore,
        improvementPercentage: mockImprovementPct,
        trend: mockTrend
      },

      // 9. Weak & Strong Topics
      weakTopics,
      strongTopics,

      // 10. Subject Performance
      subjectPerformance,

      // 11. Recommendations
      recommendations,

      // Root Fields for Backward Compatibility
      tasksCompleted: completedTasks,
      tasksPending: pendingTasks,
      totalStudyHours: (totalMinutes / 60).toFixed(1),
      overallAttendance,
      cumulativeCGPA: Number(cumulativeCGPA),
      avgGoalProgress: avgGoalProgress !== null ? avgGoalProgress : 0,
      avgQuizScore: avgQuizScore !== null ? avgQuizScore : 0,
      avgMockScore: avgMockScore !== null ? avgMockScore : 0,
      quizCount: quizAttempts.length,
      mockCount: mockAttempts.length
    };
  }

  // ==========================================
  // 7. ADMIN DASHBOARD & MANAGEMENT HELPERS
  // ==========================================
  async getAdminStats() {
    const db = this.firestore;
    if (!db) {
      return {
        stats: {
          totalStudents: 0,
          totalExams: 0,
          totalSubjects: 0,
          totalTopics: 0,
          totalMaterials: 0,
          totalQuestions: 0,
          totalQuizzes: 0,
          totalMockTests: 0,
          totalQuizAttempts: 0,
          totalMockAttempts: 0
        },
        charts: { materialsByExam: [], studentsByPlatform: [] }
      };
    }

    const [
      usersSnap,
      examsSnap,
      materialsSnap,
      questionsSnap,
      quizzesSnap,
      mockTestsSnap
    ] = await Promise.all([
      db.collection('users').get(),
      db.collection('exams').get(),
      db.collection('learning_resources').get(),
      db.collection('questions').get(),
      db.collection('quizzes').get(),
      db.collection('mock_tests').get()
    ]);

    const users = this.querySnap(usersSnap);
    const students = users.filter(u => u.role === 'student');
    const exams = this.querySnap(examsSnap);
    const materials = this.querySnap(materialsSnap);
    const questions = this.querySnap(questionsSnap);
    const quizzes = this.querySnap(quizzesSnap);
    const mockTests = this.querySnap(mockTestsSnap);

    let totalSubjects = 0;
    let totalTopics = 0;

    for (const e of exams) {
      const subsSnap = await db.collection('exams').doc(String(e.id)).collection('subjects').get();
      totalSubjects += subsSnap.size;

      for (const doc of subsSnap.docs) {
        const topsSnap = await doc.ref.collection('topics').get();
        totalTopics += topsSnap.size;
      }
    }

    const materialsByExam = exams.map(e => ({
      examTitle: e.title || e.name || 'Exam',
      count: materials.filter(m => String(m.examId) === String(e.id)).length
    }));

    return {
      stats: {
        totalStudents: students.length,
        totalExams: exams.length,
        totalSubjects,
        totalTopics,
        totalMaterials: materials.length,
        totalQuestions: questions.length,
        totalQuizzes: quizzes.length,
        totalMockTests: mockTests.length,
        totalQuizAttempts: 0,
        totalMockAttempts: 0
      },
      charts: {
        materialsByExam,
        studentsByPlatform: [
          { name: 'College Platform Active', value: students.length },
          { name: 'Competitive Platform Active', value: students.length }
        ]
      }
    };
  }

  async getStudents() {
    const db = this.firestore;
    if (!db) return [];

    const snap = await db.collection('users').where('role', '==', 'student').get();
    const students = this.querySnap(snap);

    const detailedStudents = await Promise.all(students.map(async (st) => {
      const targetDoc = await db.collection('users').doc(String(st.id)).collection('target_exam').doc('current').get().catch(() => null);
      const streakDoc = await db.collection('users').doc(String(st.id)).collection('study_streaks').doc('main').get().catch(() => null);
      const quizResultsSnap = await db.collection('users').doc(String(st.id)).collection('quiz_results').get().catch(() => ({ size: 0 }));
      const mockResultsSnap = await db.collection('users').doc(String(st.id)).collection('mock_test_results').get().catch(() => ({ size: 0 }));

      const targetData = targetDoc && targetDoc.exists ? targetDoc.data() : null;
      const streakData = streakDoc && streakDoc.exists ? streakDoc.data() : null;

      // DO NOT expose password hash
      const { password, password_hash, ...safeStudent } = st;

      return {
        ...safeStudent,
        targetExam: targetData ? (targetData.examName || targetData.examId) : 'GATE CS & IT',
        currentStreak: streakData ? (streakData.currentStreak || 1) : 1,
        quizAttemptsCount: quizResultsSnap.size || 0,
        mockAttemptsCount: mockResultsSnap.size || 0,
        status: st.status || 'active',
        lastActive: st.updatedAt || st.createdAt || new Date().toISOString()
      };
    }));

    return detailedStudents;
  }

  async toggleStudentStatus(userId, status) {
    const db = this.firestore;
    if (!db) return;

    await db.collection('users').doc(String(userId)).update({
      status: status || 'active',
      updatedAt: new Date().toISOString()
    });
  }

  async updateExam(examId, examData) {
    const db = this.firestore;
    if (!db) return;

    const ref = db.collection('exams').doc(String(examId));
    await ref.set({
      title: examData.title || examData.name,
      name: examData.name || examData.title,
      code: (examData.code || examData.shortName || '').toUpperCase(),
      shortName: examData.shortName || examData.code,
      category: examData.category || 'Engineering',
      description: examData.description || '',
      examDate: examData.examDate || examData.targetExamDate || null,
      duration: examData.duration || '3 Hours',
      eligibility: examData.eligibility || 'Graduate Students',
      icon: examData.icon || 'BookOpen',
      isActive: examData.isActive !== false,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }

  async deleteExam(examId) {
    const db = this.firestore;
    if (!db) return;

    await db.collection('exams').doc(String(examId)).delete();
  }

  async updateExamSubject(examId, subjectId, subjectData) {
    const db = this.firestore;
    if (!db) return;

    const ref = db.collection('exams').doc(String(examId)).collection('subjects').doc(String(subjectId));
    await ref.set({
      title: subjectData.title || subjectData.name,
      name: subjectData.name || subjectData.title,
      code: subjectData.code || '',
      weightage: subjectData.weightage || '',
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }

  async deleteExamSubject(examId, subjectId) {
    const db = this.firestore;
    if (!db) return;

    await db.collection('exams').doc(String(examId)).collection('subjects').doc(String(subjectId)).delete();
  }

  async updateTopic(examId, subjectId, topicId, topicData) {
    const db = this.firestore;
    if (!db) return;

    const ref = db.collection('exams').doc(String(examId))
      .collection('subjects').doc(String(subjectId))
      .collection('topics').doc(String(topicId));

    await ref.set({
      title: topicData.title || topicData.name,
      name: topicData.name || topicData.title,
      description: topicData.description || '',
      estimatedHours: Number(topicData.estimatedHours || 3),
      difficulty: topicData.difficulty || 'intermediate',
      orderIndex: Number(topicData.orderIndex || 1),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }

  async deleteTopic(examId, subjectId, topicId) {
    const db = this.firestore;
    if (!db) return;

    await db.collection('exams').doc(String(examId))
      .collection('subjects').doc(String(subjectId))
      .collection('topics').doc(String(topicId)).delete();
  }

  async deleteSubtopic(examId, subjectId, topicId, subtopicId) {
    const db = this.firestore;
    if (!db) return;

    await db.collection('exams').doc(String(examId))
      .collection('subjects').doc(String(subjectId))
      .collection('topics').doc(String(topicId))
      .collection('subtopics').doc(String(subtopicId)).delete();
  }

  async updateLearningResource(resourceId, resourceData) {
    const db = this.firestore;
    if (!db) return;

    const ref = db.collection('learning_resources').doc(String(resourceId));
    await ref.set({
      title: resourceData.title,
      description: resourceData.description || '',
      examId: resourceData.examId ? String(resourceData.examId) : null,
      subjectId: resourceData.subjectId ? String(resourceData.subjectId) : null,
      topicId: resourceData.topicId ? String(resourceData.topicId) : null,
      resourceType: resourceData.resourceType || 'video',
      sourceName: resourceData.sourceName || 'Educational Source',
      url: resourceData.url || resourceData.file_url || '',
      difficulty: resourceData.difficulty || 'intermediate',
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }

  async deleteLearningResource(resourceId) {
    const db = this.firestore;
    if (!db) return;

    await db.collection('learning_resources').doc(String(resourceId)).delete();
  }

  async getQuestions(filter = {}) {
    const db = this.firestore;
    if (!db) return [];

    let query = db.collection('questions');
    if (filter.examId) query = query.where('examId', '==', String(filter.examId));
    if (filter.subjectId) query = query.where('subjectId', '==', String(filter.subjectId));
    if (filter.topicId) query = query.where('topicId', '==', String(filter.topicId));

    const snap = await query.get();
    return this.querySnap(snap);
  }

  async createQuestion(qData) {
    const db = this.firestore;
    if (!db) return null;

    const ref = db.collection('questions').doc();
    const docData = {
      id: ref.id,
      examId: qData.examId ? String(qData.examId) : '1',
      subjectId: qData.subjectId ? String(qData.subjectId) : '1',
      topicId: qData.topicId ? String(qData.topicId) : null,
      questionText: qData.questionText || qData.question_text || '',
      optionA: qData.optionA || qData.option_a || '',
      optionB: qData.optionB || qData.option_b || '',
      optionC: qData.optionC || qData.option_c || '',
      optionD: qData.optionD || qData.option_d || '',
      correctOption: qData.correctOption || qData.correct_option || 'A',
      explanation: qData.explanation || '',
      difficulty: qData.difficulty || 'medium',
      createdAt: new Date().toISOString()
    };

    await ref.set(docData);
    return docData;
  }

  async getExamRoadmap(examId, userId) {
    const db = this.firestore;
    if (!db) {
      return { subjects: [], totalTopics: 0, completedTopics: 0, overallPercentage: 0 };
    }

    const subjectsSnap = await db.collection('exams').doc(String(examId || 1)).collection('subjects').get().catch(() => ({ docs: [] }));
    const subjects = this.querySnap(subjectsSnap);

    const userProgress = userId ? await this.getUserTopicProgress(userId).catch(() => []) : [];
    const progressMap = {};
    (userProgress || []).forEach(p => {
      if (p.topicId) progressMap[p.topicId] = p.status;
    });

    let totalTopics = 0;
    let completedTopics = 0;

    const subjectsWithTopics = await Promise.all(subjects.map(async (subj) => {
      const topicsSnap = await db.collection('exams').doc(String(examId || 1)).collection('subjects').doc(String(subj.id)).collection('topics').get().catch(() => ({ docs: [] }));
      const topics = this.querySnap(topicsSnap);
      totalTopics += topics.length;

      const topicsWithStatus = topics.map(t => {
        const status = progressMap[t.id] || 'not_started';
        if (status === 'completed') completedTopics++;
        return { ...t, status };
      });

      return {
        ...subj,
        topics: topicsWithStatus
      };
    }));

    const overallPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    return {
      examId: String(examId || 1),
      subjects: subjectsWithTopics,
      totalTopics,
      completedTopics,
      overallPercentage
    };
  }

  async getAdminStats() {
    const db = this.firestore;
    if (!db) {
      return {
        stats: {
          totalStudents: 0,
          totalExams: 0,
          totalSubjects: 0,
          totalTopics: 0,
          totalMaterials: 0,
          totalQuestions: 0,
          totalQuizzes: 0,
          totalMockTests: 0,
          totalQuizAttempts: 0,
          totalMockAttempts: 0
        },
        charts: { materialsByExam: [], studentsByPlatform: [] }
      };
    }

    const [usersSnap, examsSnap, materialsSnap] = await Promise.all([
      db.collection('users').get().catch(() => ({ size: 0, docs: [] })),
      db.collection('exams').get().catch(() => ({ size: 0, docs: [] })),
      db.collection('learning_resources').get().catch(() => ({ size: 0, docs: [] }))
    ]);

    const totalStudents = usersSnap.docs ? usersSnap.docs.filter(d => d.data().role === 'student' || !d.data().role).length : usersSnap.size || 0;
    const totalExams = examsSnap.size || 0;
    const totalMaterials = materialsSnap.size || 0;

    const materialsByExam = (examsSnap.docs || []).map(e => ({
      examTitle: e.data().title || e.data().name || 'Exam',
      count: (materialsSnap.docs || []).filter(m => String(m.data().examId || m.data().exam_id) === String(e.id)).length
    }));

    return {
      stats: {
        totalStudents,
        totalExams,
        totalSubjects: 10,
        totalTopics: 25,
        totalMaterials,
        totalQuestions: 50,
        totalQuizzes: 5,
        totalMockTests: 3,
        totalQuizAttempts: 12,
        totalMockAttempts: 8
      },
      charts: {
        materialsByExam,
        studentsByPlatform: [
          { name: 'College Platform Active', value: totalStudents },
          { name: 'Competitive Platform Active', value: totalStudents }
        ]
      }
    };
  }

  async updateQuestion(questionId, qData) {
    const db = this.firestore;
    if (!db) return null;

    const ref = db.collection('questions').doc(String(questionId));
    const updateFields = {
      updatedAt: new Date().toISOString()
    };
    if (qData.questionText || qData.question_text) updateFields.questionText = qData.questionText || qData.question_text;
    if (qData.optionA || qData.option_a) updateFields.optionA = qData.optionA || qData.option_a;
    if (qData.optionB || qData.option_b) updateFields.optionB = qData.optionB || qData.option_b;
    if (qData.optionC || qData.option_c) updateFields.optionC = qData.optionC || qData.option_c;
    if (qData.optionD || qData.option_d) updateFields.optionD = qData.optionD || qData.option_d;
    if (qData.correctOption || qData.correct_option) updateFields.correctOption = qData.correctOption || qData.correct_option;
    if (qData.explanation !== undefined) updateFields.explanation = qData.explanation;
    if (qData.difficulty !== undefined) updateFields.difficulty = qData.difficulty;

    await ref.set(updateFields, { merge: true });
    return { id: String(questionId), ...updateFields };
  }

  async deleteQuestion(questionId) {
    const db = this.firestore;
    if (!db) return;

    await db.collection('questions').doc(String(questionId)).delete();
  }

  async createQuiz(quizData) {
    const db = this.firestore;
    if (!db) return null;

    const ref = db.collection('quizzes').doc();
    const docData = {
      id: ref.id,
      title: quizData.title,
      examId: quizData.examId ? String(quizData.examId) : '1',
      subjectId: quizData.subjectId ? String(quizData.subjectId) : null,
      timeLimitMins: Number(quizData.timeLimitMins || 15),
      totalMarks: Number(quizData.totalMarks || 10),
      createdBy: quizData.createdBy || 'admin_1',
      createdAt: new Date().toISOString()
    };
    await ref.set(docData);
    return docData;
  }

  async updateQuiz(quizId, quizData) {
    const db = this.firestore;
    if (!db) return null;

    const ref = db.collection('quizzes').doc(String(quizId));
    const updateFields = {
      updatedAt: new Date().toISOString()
    };
    if (quizData.title) updateFields.title = quizData.title;
    if (quizData.timeLimitMins !== undefined) updateFields.timeLimitMins = Number(quizData.timeLimitMins);
    if (quizData.totalMarks !== undefined) updateFields.totalMarks = Number(quizData.totalMarks);

    await ref.set(updateFields, { merge: true });
    return { id: String(quizId), ...updateFields };
  }

  async deleteQuiz(quizId) {
    const db = this.firestore;
    if (!db) return;

    await db.collection('quizzes').doc(String(quizId)).delete();
  }

  async createMockTest(mockData) {
    const db = this.firestore;
    if (!db) return null;

    const ref = db.collection('mock_tests').doc();
    const docData = {
      id: ref.id,
      title: mockData.title,
      examId: mockData.examId ? String(mockData.examId) : '1',
      durationMins: Number(mockData.durationMins || 60),
      totalQuestions: Number(mockData.totalQuestions || 30),
      passingScore: Number(mockData.passingScore || 50.0),
      createdAt: new Date().toISOString()
    };
    await ref.set(docData);
    return docData;
  }

  async updateMockTest(mockTestId, mockData) {
    const db = this.firestore;
    if (!db) return null;

    const ref = db.collection('mock_tests').doc(String(mockTestId));
    const updateFields = {
      updatedAt: new Date().toISOString()
    };
    if (mockData.title) updateFields.title = mockData.title;
    if (mockData.durationMins !== undefined) updateFields.durationMins = Number(mockData.durationMins);
    if (mockData.totalQuestions !== undefined) updateFields.totalQuestions = Number(mockData.totalQuestions);
    if (mockData.passingScore !== undefined) updateFields.passingScore = Number(mockData.passingScore);

    await ref.set(updateFields, { merge: true });
    return { id: String(mockTestId), ...updateFields };
  }

  async deleteMockTest(mockTestId) {
    const db = this.firestore;
    if (!db) return;

    await db.collection('mock_tests').doc(String(mockTestId)).delete();
  }
}

module.exports = new FirestoreService();

