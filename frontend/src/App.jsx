import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';

// Auth Pages
import LandingPage from './pages/auth/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AdminLoginPage from './pages/auth/AdminLoginPage';

// College Pages
import CollegeDashboard from './pages/college/CollegeDashboard';
import TasksPage from './pages/college/TasksPage';
import NotesPage from './pages/college/NotesPage';
import CalendarPage from './pages/college/CalendarPage';
import AttendancePage from './pages/college/AttendancePage';
import CgpaCalculatorPage from './pages/college/CgpaCalculatorPage';
import GoalsPage from './pages/college/GoalsPage';
import PomodoroPage from './pages/college/PomodoroPage';
import AnalyticsPage from './pages/college/AnalyticsPage';
import AiTimetablePage from './pages/college/AiTimetablePage';

// Competitive Pages
import CompetitiveDashboard from './pages/competitive/CompetitiveDashboard';
import ExamSelectionPage from './pages/competitive/ExamSelectionPage';
import ExamRoadmapPage from './pages/competitive/ExamRoadmapPage';
import SyllabusTrackerPage from './pages/competitive/SyllabusTrackerPage';
import StudyMaterialsPage from './pages/competitive/StudyMaterialsPage';
import PyqQuestionBankPage from './pages/competitive/PyqQuestionBankPage';
import QuizzesPage from './pages/competitive/QuizzesPage';
import MockTestsPage from './pages/competitive/MockTestsPage';
import CompetitiveAnalyticsPage from './pages/competitive/CompetitiveAnalyticsPage';
import AiPreparationPlanPage from './pages/competitive/AiPreparationPlanPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageExamsPage from './pages/admin/ManageExamsPage';
import ManageMaterialsPage from './pages/admin/ManageMaterialsPage';
import ManageQuizzesPage from './pages/admin/ManageQuizzesPage';
import ManageStudentsPage from './pages/admin/ManageStudentsPage';
import AdminNotificationsPage from './pages/admin/AdminNotificationsPage';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading application session...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return children;
}

function MainLayout({ children }) {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMobile = () => setMobileOpen(!mobileOpen);
  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="app-container">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Navbar onToggleMobileMenu={toggleMobile} />
        <div style={{ display: 'flex', flex: 1, position: 'relative', minWidth: 0 }}>
          {user && (
            <>
              {mobileOpen && (
                <div
                  className="sidebar-backdrop"
                  onClick={closeMobile}
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(15, 23, 42, 0.6)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 85
                  }}
                />
              )}
              <Sidebar mobileOpen={mobileOpen} onCloseMobile={closeMobile} />
            </>
          )}
          <main className="main-content">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <MainLayout>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin-login" element={<Navigate to="/admin/login" replace />} />

              {/* Student Dashboard & College Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><CollegeDashboard /></ProtectedRoute>} />
              <Route path="/college/dashboard" element={<ProtectedRoute><CollegeDashboard /></ProtectedRoute>} />
              <Route path="/college/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
              <Route path="/college/notes" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
              <Route path="/college/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
              <Route path="/college/attendance" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
              <Route path="/college/cgpa" element={<ProtectedRoute><CgpaCalculatorPage /></ProtectedRoute>} />
              <Route path="/college/goals" element={<ProtectedRoute><GoalsPage /></ProtectedRoute>} />
              <Route path="/college/pomodoro" element={<ProtectedRoute><PomodoroPage /></ProtectedRoute>} />
              <Route path="/college/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
              <Route path="/college/ai-timetable" element={<ProtectedRoute><AiTimetablePage /></ProtectedRoute>} />

              {/* Competitive Exam Routes */}
              <Route path="/competitive/dashboard" element={<ProtectedRoute><CompetitiveDashboard /></ProtectedRoute>} />
              <Route path="/competitive/exams" element={<ProtectedRoute><ExamSelectionPage /></ProtectedRoute>} />
              <Route path="/competitive/roadmap" element={<ProtectedRoute><ExamRoadmapPage /></ProtectedRoute>} />
              <Route path="/competitive/syllabus-tracker" element={<ProtectedRoute><SyllabusTrackerPage /></ProtectedRoute>} />
              <Route path="/competitive/materials" element={<ProtectedRoute><StudyMaterialsPage /></ProtectedRoute>} />
              <Route path="/competitive/questions" element={<ProtectedRoute><PyqQuestionBankPage /></ProtectedRoute>} />
              <Route path="/competitive/quizzes" element={<ProtectedRoute><QuizzesPage /></ProtectedRoute>} />
              <Route path="/competitive/mock-tests" element={<ProtectedRoute><MockTestsPage /></ProtectedRoute>} />
              <Route path="/competitive/analytics" element={<ProtectedRoute><CompetitiveAnalyticsPage /></ProtectedRoute>} />
              <Route path="/competitive/ai-plan" element={<ProtectedRoute><AiPreparationPlanPage /></ProtectedRoute>} />

              {/* Admin Dashboard Routes */}
              <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/dashboard" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/exams" element={<ProtectedRoute adminOnly><ManageExamsPage /></ProtectedRoute>} />
              <Route path="/admin/subjects" element={<ProtectedRoute adminOnly><ManageExamsPage /></ProtectedRoute>} />
              <Route path="/admin/topics" element={<ProtectedRoute adminOnly><ManageExamsPage /></ProtectedRoute>} />
              <Route path="/admin/roadmaps" element={<ProtectedRoute adminOnly><ManageExamsPage /></ProtectedRoute>} />
              <Route path="/admin/materials" element={<ProtectedRoute adminOnly><ManageMaterialsPage /></ProtectedRoute>} />
              <Route path="/admin/resources" element={<ProtectedRoute adminOnly><ManageMaterialsPage /></ProtectedRoute>} />
              <Route path="/admin/quizzes" element={<ProtectedRoute adminOnly><ManageQuizzesPage /></ProtectedRoute>} />
              <Route path="/admin/questions" element={<ProtectedRoute adminOnly><ManageQuizzesPage /></ProtectedRoute>} />
              <Route path="/admin/mock-tests" element={<ProtectedRoute adminOnly><ManageQuizzesPage /></ProtectedRoute>} />
              <Route path="/admin/students" element={<ProtectedRoute adminOnly><ManageStudentsPage /></ProtectedRoute>} />
              <Route path="/admin/notifications" element={<ProtectedRoute adminOnly><AdminNotificationsPage /></ProtectedRoute>} />

              {/* Fallback Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </MainLayout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
