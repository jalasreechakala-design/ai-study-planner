import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  CheckSquare,
  FileText,
  Calendar,
  Award,
  Calculator,
  Target,
  Clock,
  BarChart2,
  Cpu,
  Compass,
  Map,
  BookOpen,
  HelpCircle,
  FileCheck,
  Sparkles,
  Users,
  Bell,
  ShieldAlert,
  LogOut,
  User,
  GraduationCap
} from 'lucide-react';

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const { user, platformMode, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  const navSections = isAdmin ? [
    {
      section: 'ADMINISTRATION',
      links: [
        { to: '/admin/dashboard', label: 'Admin Overview', icon: LayoutDashboard },
        { to: '/admin/exams', label: 'Exams & Syllabus', icon: Compass },
        { to: '/admin/materials', label: 'Learning Resources', icon: BookOpen },
        { to: '/admin/quizzes', label: 'Quizzes & Questions', icon: HelpCircle },
        { to: '/admin/students', label: 'Manage Students', icon: Users },
        { to: '/admin/notifications', label: 'Announcements', icon: Bell }
      ]
    }
  ] : [
    {
      section: 'MAIN',
      links: [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      section: 'COLLEGE',
      links: [
        { to: '/college/tasks', label: 'Tasks', icon: CheckSquare },
        { to: '/college/notes', label: 'Notes', icon: FileText },
        { to: '/college/calendar', label: 'Calendar', icon: Calendar },
        { to: '/college/attendance', label: 'Attendance', icon: Award },
        { to: '/college/cgpa', label: 'CGPA', icon: Calculator },
        { to: '/college/goals', label: 'Goals', icon: Target },
        { to: '/college/pomodoro', label: 'Pomodoro', icon: Clock },
        { to: '/college/analytics', label: 'Analytics', icon: BarChart2 }
      ]
    },
    {
      section: 'COMPETITIVE',
      links: [
        { to: '/competitive/exams', label: 'Exams', icon: Compass },
        { to: '/competitive/roadmap', label: 'Roadmap', icon: Map },
        { to: '/competitive/materials', label: 'Learning Resources', icon: BookOpen },
        { to: '/competitive/questions', label: 'Questions', icon: HelpCircle },
        { to: '/competitive/quizzes', label: 'Quizzes', icon: Clock },
        { to: '/competitive/mock-tests', label: 'Mock Tests', icon: FileCheck },
        { to: '/competitive/analytics', label: 'Progress', icon: BarChart2 }
      ]
    },
    {
      section: 'AI',
      links: [
        { to: '/college/ai-timetable', label: 'Study Assistant', icon: Cpu },
        { to: '/competitive/ai-plan', label: 'AI Study Plan', icon: Sparkles }
      ]
    }
  ];

  return (
    <aside
      className={`sidebar-container ${mobileOpen ? 'mobile-open' : ''}`}
      style={{
        width: '240px',
        background: 'var(--sidebar-bg)',
        color: '#fff',
        borderRight: '1px solid var(--border-color)',
        padding: '1.25rem 0.85rem',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'calc(100vh - 65px)',
        zIndex: 90
      }}
    >
      {/* Brand Header */}
      <div style={{ padding: '0 0.5rem 1rem 0.5rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'var(--accent-primary)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <GraduationCap size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#fff' }}>
              STUDENT STUDY
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-primary)', letterSpacing: '0.08em' }}>
              PLANNER
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1, overflowY: 'auto' }}>
        {navSections.map((sec, idx) => (
          <div key={idx}>
            <div style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'rgba(255,255,255,0.4)',
              padding: '0 0.6rem 0.4rem 0.6rem'
            }}>
              {sec.section}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
              {sec.links.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onCloseMobile}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      color: isActive ? '#ffffff' : 'rgba(255,255,255,0.7)',
                      background: isActive ? 'var(--accent-primary)' : 'transparent',
                      fontWeight: isActive ? 600 : 500,
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
                      borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent'
                    })}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer User Info & Logout */}
      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 0.5rem' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'var(--accent-primary)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8rem',
            fontWeight: 700
          }}>
            {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.name}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.role === 'admin' ? 'Administrator' : user.email}
            </div>
          </div>
        </div>

        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="btn btn-secondary btn-sm"
          style={{
            width: '100%',
            justifyContent: 'flex-start',
            background: 'rgba(255,255,255,0.06)',
            borderColor: 'rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.8)'
          }}
        >
          <LogOut size={15} /> Logout
        </button>
      </div>
    </aside>
  );
}

