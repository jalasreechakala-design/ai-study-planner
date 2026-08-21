import axios from 'axios';
import { auth } from '../firebase';

let rawBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
let cleanBaseURL = rawBaseURL.replace(/\/+$/, '');
if (!cleanBaseURL.endsWith('/api')) {
  cleanBaseURL += '/api';
}

const api = axios.create({
  baseURL: cleanBaseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Centralized Request Interceptor: Attach Firebase ID Token automatically
api.interceptors.request.use(
  async (config) => {
    if (auth) {
      if (typeof auth.authStateReady === 'function') {
        try {
          await auth.authStateReady();
        } catch (readyErr) {
          // Ignore auth state ready failure
        }
      }
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          config.headers.Authorization = `Bearer ${token}`;
        } catch (error) {
          console.error('Failed to obtain Firebase ID token:', error.message);
        }
      } else {
        delete config.headers.Authorization;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Centralized Response Interceptor: Informative Error Debugging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response ? error.response.status : 'NETWORK_ERROR';
    const message = error.response?.data?.error || error.response?.data?.message || error.message;
    const url = error.config ? error.config.url : 'UNKNOWN_ENDPOINT';
    console.error(`❌ API Error [${status}] on ${url}:`, message);
    return Promise.reject(error);
  }
);

export const healthAPI = {
  checkHealth: () => api.get('/health')
};

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (studentData) => api.post('/auth/register', studentData),
  getProfile: () => api.get('/auth/profile')
};

export const collegeAPI = {
  getDashboardSummary: () => api.get('/college/dashboard'),
  getTasks: (params) => api.get('/college/tasks', { params }),
  createTask: (taskData) => api.post('/college/tasks', taskData),
  updateTask: (id, taskData) => api.put(`/college/tasks/${id}`, taskData),
  updateTaskStatus: (id, status) => api.put(`/college/tasks/${id}/status`, { status }),
  deleteTask: (id) => api.delete(`/college/tasks/${id}`),

  getNotes: (params) => api.get('/college/notes', { params }),
  createNote: (noteData) => api.post('/college/notes', noteData),
  updateNote: (id, noteData) => api.put(`/college/notes/${id}`, noteData),
  deleteNote: (id) => api.delete(`/college/notes/${id}`),

  getAttendance: () => api.get('/college/attendance'),
  addAttendance: (record) => api.post('/college/attendance', record),
  updateAttendance: (id, record) => api.put(`/college/attendance/${id}`, record),
  deleteAttendance: (id) => api.delete(`/college/attendance/${id}`),

  getCgpa: () => api.get('/college/cgpa'),
  addCgpa: (record) => api.post('/college/cgpa', record),
  updateCgpa: (id, record) => api.put(`/college/cgpa/${id}`, record),
  deleteCgpa: (id) => api.delete(`/college/cgpa/${id}`),

  getGoals: () => api.get('/college/goals'),
  createGoal: (goal) => api.post('/college/goals', goal),
  updateGoal: (id, goal) => api.put(`/college/goals/${id}`, goal),
  deleteGoal: (id) => api.delete(`/college/goals/${id}`),

  logSession: (sessionData) => api.post('/college/study-session', sessionData),
  getStreaksBadges: () => api.get('/college/streaks-badges'),
  updateStreak: () => api.post('/college/streak/update'),
  getAnalytics: () => api.get('/college/analytics'),

  getSubjects: () => api.get('/college/subjects'),
  createSubject: (data) => api.post('/college/subjects', data),
  deleteSubject: (id) => api.delete(`/college/subjects/${id}`),

  getAssignments: () => api.get('/college/assignments'),
  createAssignment: (data) => api.post('/college/assignments', data),
  updateAssignment: (id, data) => api.put(`/college/assignments/${id}`, data),
  deleteAssignment: (id) => api.delete(`/college/assignments/${id}`),

  getReminders: () => api.get('/college/reminders'),
  createReminder: (data) => api.post('/college/reminders', data),
  deleteReminder: (id) => api.delete(`/college/reminders/${id}`)
};

export const competitiveAPI = {
  getDashboardSummary: () => api.get('/competitive/dashboard'),
  getExams: (params) => api.get('/competitive/exams', { params }),
  setTarget: (data) => api.post('/competitive/target', data),
  getRoadmap: (examId) => api.get(`/competitive/roadmap/${examId}`),
  updateTopicProgress: (data) => api.post('/competitive/topic-progress', data),
  getSyllabusTracker: () => api.get('/competitive/syllabus-tracker'),
  getMaterials: (params) => api.get('/competitive/materials', { params }),
  getResources: (params) => api.get('/competitive/resources', { params }),
  trackDownload: (id) => api.post(`/competitive/materials/${id}/download`),
  trackResourceClick: (id) => api.post(`/competitive/resources/${id}/click`),
  toggleBookmark: (data) => api.post('/competitive/bookmark', data),
  toggleResourceBookmark: (id) => api.post(`/competitive/resources/${id}/bookmark`),
  getPyqs: (params) => api.get('/competitive/pyqs', { params }),
  getQuestionBank: (params) => api.get('/competitive/question-bank', { params }),
  getQuizzes: (params) => api.get('/competitive/quizzes', { params }),
  getQuizDetails: (id) => api.get(`/competitive/quizzes/${id}`),
  submitQuiz: (quizData) => api.post('/competitive/quizzes/submit', quizData),
  getMockTests: () => api.get('/competitive/mock-tests'),
  submitMockTest: (data) => api.post('/competitive/mock-tests/submit', data),
  getAnalytics: () => api.get('/competitive/analytics')
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),

  getExams: () => api.get('/admin/exams'),
  createExam: (data) => api.post('/admin/exams', data),
  updateExam: (id, data) => api.put(`/admin/exams/${id}`, data),
  deleteExam: (id) => api.delete(`/admin/exams/${id}`),

  getSubjects: (params) => api.get('/admin/subjects', { params }),
  createSubject: (data) => api.post('/admin/subjects', data),
  deleteSubject: (id) => api.delete(`/admin/subjects/${id}`),

  getTopics: (params) => api.get('/admin/topics', { params }),
  createTopic: (data) => api.post('/admin/topics', data),
  deleteTopic: (id) => api.delete(`/admin/topics/${id}`),

  getSubtopics: (params) => api.get('/admin/subtopics', { params }),
  createSubtopic: (data) => api.post('/admin/subtopics', data),
  deleteSubtopic: (id) => api.delete(`/admin/subtopics/${id}`),

  getMaterials: (params) => api.get('/admin/materials', { params }),
  createMaterial: (data) => api.post('/admin/materials', data),
  updateMaterial: (id, data) => api.put(`/admin/materials/${id}`, data),
  deleteMaterial: (id) => api.delete(`/admin/materials/${id}`),

  getResources: (params) => api.get('/admin/resources', { params }),
  createResource: (data) => api.post('/admin/resources', data),
  updateResource: (id, data) => api.put(`/admin/resources/${id}`, data),
  deleteResource: (id) => api.delete(`/admin/resources/${id}`),

  getQuestions: (params) => api.get('/admin/questions', { params }),
  createQuestion: (data) => api.post('/admin/questions', data),
  deleteQuestion: (id) => api.delete(`/admin/questions/${id}`),

  createQuiz: (data) => api.post('/admin/quizzes', data),
  deleteQuiz: (id) => api.delete(`/admin/quizzes/${id}`),

  getMockTests: (params) => api.get('/admin/mock-tests', { params }),
  createMockTest: (data) => api.post('/admin/mock-tests', data),
  deleteMockTest: (id) => api.delete(`/admin/mock-tests/${id}`),

  getStudents: (params) => api.get('/admin/students', { params }),
  toggleStudentStatus: (id, status) => api.put(`/admin/students/${id}/status`, { status }),

  sendNotification: (data) => api.post('/admin/notifications', data)
};

export const aiAPI = {
  getRecommendations: (params) => api.get('/ai/recommendations', { params }),
  generateTimetable: (data) => api.post('/ai/timetable', data),
  summarizeNote: (data) => api.post('/ai/summarize-note', data),
  generateQuiz: (data) => api.post('/ai/generate-quiz', data)
};

export const notificationAPI = {
  getNotifications: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  sendEmailReminder: (data) => api.post('/notifications/send-email', data)
};

export default api;
