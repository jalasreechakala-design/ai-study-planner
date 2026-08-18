import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { collegeAPI, aiAPI } from '../../services/api';
import { GraduationCap, Award, CheckSquare, Clock, Flame, Calendar, Sparkles, ArrowRight, BookOpen, Target, Plus, Play, CheckCircle2 } from 'lucide-react';

export default function CollegeDashboard() {
  const { user, switchPlatform } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [aiRec, setAiRec] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [sumRes, aiRes] = await Promise.all([
        collegeAPI.getDashboardSummary(),
        aiAPI.getRecommendations()
      ]);

      setSummary(sumRes.data);
      setAiRec(aiRes.data);
    } catch (err) {
      console.error('Failed to load dashboard summary');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !summary) {
    return (
      <div className="page-wrapper" style={{ padding: '3rem 1.5rem' }}>
        <div className="skeleton" style={{ height: '140px', marginBottom: '1.5rem' }}></div>
        <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
          <div className="skeleton" style={{ height: '90px' }}></div>
          <div className="skeleton" style={{ height: '90px' }}></div>
          <div className="skeleton" style={{ height: '90px' }}></div>
          <div className="skeleton" style={{ height: '90px' }}></div>
        </div>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning 👋';
    if (hour < 18) return 'Good Afternoon 👋';
    return 'Good Evening 👋';
  };

  return (
    <div className="page-wrapper">
      {/* Hero Header Section */}
      <div
        className="card"
        style={{
          marginBottom: '2rem',
          padding: '2rem',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
          color: '#ffffff',
          border: 'none',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255, 255, 255, 0.15)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.78125rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              <Calendar size={14} /> {summary.todayDate}
            </div>
            <h1 style={{ fontSize: '2rem', color: '#ffffff', marginBottom: '0.4rem' }}>{getGreeting()}, {user?.name?.split(' ')[0]}</h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.95rem', margin: 0 }}>
              Let's make today productive. You have <strong>{summary.taskSummary.pending} pending tasks</strong> and <strong>{summary.studySummary.todayHours || 0} hrs</strong> logged today.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/college/pomodoro')}
              className="btn"
              style={{ background: '#ffffff', color: 'var(--primary)', fontWeight: 700 }}
            >
              <Play size={16} fill="var(--primary)" /> Start Studying
            </button>
            <button
              onClick={() => navigate('/college/tasks')}
              className="btn"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)', fontWeight: 600 }}
            >
              <Plus size={16} /> Add Task
            </button>
          </div>
        </div>
      </div>

      {/* AI Academic Advisory Banner */}
      {aiRec && (
        <div className="card" style={{
          marginBottom: '2rem',
          borderLeft: '4px solid var(--accent)',
          background: 'var(--surface-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
            <Sparkles size={16} /> AI Academic Recommendation
          </div>
          <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>
            "{aiRec.primaryRecommendation}"
          </h3>
        </div>
      )}

      {/* Statistics Row */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Tasks Overview</span>
              <h2 style={{ fontSize: '1.75rem', marginTop: '0.2rem', color: 'var(--text-primary)' }}>
                {summary.taskSummary.pending}
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{summary.taskSummary.completed} completed today</span>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(217, 119, 6, 0.12)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}>
              <CheckSquare size={20} style={{ margin: 'auto' }} />
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Study Hours</span>
              <h2 style={{ fontSize: '1.75rem', marginTop: '0.2rem', color: 'var(--text-primary)' }}>
                {summary.studySummary.todayHours || 0}h
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{summary.studySummary.currentStreak} day streak 🔥</span>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(79, 70, 229, 0.12)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}>
              <Clock size={20} style={{ margin: 'auto' }} />
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Attendance Health</span>
              <h2 style={{ fontSize: '1.75rem', marginTop: '0.2rem', color: summary.attendanceSummary.overallPercentage >= 75 ? 'var(--success)' : 'var(--danger)' }}>
                {summary.attendanceSummary.overallPercentage}%
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target: 75% min</span>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(22, 163, 74, 0.12)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}>
              <Award size={20} style={{ margin: 'auto' }} />
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Cumulative CGPA</span>
              <h2 style={{ fontSize: '1.75rem', marginTop: '0.2rem', color: 'var(--accent-primary)' }}>
                {summary.cgpaSummary.cumulativeCGPA}
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{summary.cgpaSummary.totalCredits} Credits</span>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--accent-primary-light)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}>
              <GraduationCap size={20} style={{ margin: 'auto' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Focus & Today's Schedule Timeline */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        {/* Continue Learning & Today's Focus Card */}
        <div className="card" style={{ borderTop: '4px solid var(--accent)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
            CONTINUE LEARNING
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>DBMS · Normalization</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            80% complete · Functional dependencies, 3NF & BCNF decomposition
          </p>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              <span>Topic Completion</span>
              <span style={{ color: 'var(--accent)' }}>80%</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: '80%', backgroundColor: 'var(--accent)' }}></div>
            </div>
          </div>

          <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--surface-secondary)', border: '1px solid var(--border)', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
              RECOMMENDED RESOURCE FOR YOU
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.2rem' }}>
              🎥 TCP/IP Architecture & Protocol Stack Masterclass
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Because you are currently studying Computer Networks.
            </div>
          </div>

          <button
            onClick={() => navigate('/competitive/roadmap')}
            className="btn btn-outline"
            style={{ width: '100%', padding: '0.6rem' }}
          >
            Continue Roadmap <ArrowRight size={16} />
          </button>
        </div>

        {/* Today's Schedule Timeline */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Today's Study Schedule</h3>
            <Link to="/college/calendar" style={{ fontSize: '0.8125rem', color: 'var(--accent-primary)', fontWeight: 600 }}>Full Calendar →</Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-primary)', width: '45px' }}>09:00</span>
              <div style={{ flex: 1, padding: '0.55rem 0.85rem', background: 'var(--surface-secondary)', borderRadius: '8px', borderLeft: '3px solid var(--primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                Computer Networks — Lecture & Notes
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', width: '45px' }}>11:00</span>
              <div style={{ flex: 1, padding: '0.55rem 0.85rem', background: 'var(--surface-secondary)', borderRadius: '8px', borderLeft: '3px solid var(--secondary)', fontSize: '0.85rem', fontWeight: 600 }}>
                DBMS Revision — Normalization & Indexing
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', width: '45px' }}>14:00</span>
              <div style={{ flex: 1, padding: '0.55rem 0.85rem', background: 'var(--surface-secondary)', borderRadius: '8px', borderLeft: '3px solid var(--warning)', fontSize: '0.85rem', fontWeight: 600 }}>
                Assignment Submission & Lab Practice
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', width: '45px' }}>17:00</span>
              <div style={{ flex: 1, padding: '0.55rem 0.85rem', background: 'var(--surface-secondary)', borderRadius: '8px', borderLeft: '3px solid var(--accent)', fontSize: '0.85rem', fontWeight: 600 }}>
                GATE Practice Questions & Quiz Session
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deadlines & Earned Badges Row */}
      <div className="grid-2">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Upcoming Academic Deadlines</h3>
            <Link to="/college/tasks" style={{ fontSize: '0.8125rem', color: 'var(--accent-primary)', fontWeight: 600 }}>View All Tasks →</Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {summary.taskSummary.upcomingDeadlines.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No pending task deadlines.</p>
            ) : (
              summary.taskSummary.upcomingDeadlines.map(task => (
                <div key={task.id} style={{
                  padding: '0.75rem 0.9rem',
                  borderRadius: '8px',
                  background: 'var(--surface-secondary)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{task.title}</div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Subject: {task.subject_name || 'General'} • Due: {task.due_date || 'No Date'}
                    </span>
                  </div>
                  <span className={`badge ${task.priority === 'high' ? 'badge-danger' : 'badge-warning'}`}>
                    {task.priority}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Earned Badges & Academic Milestones</h3>
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            {summary.studySummary.badges.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Complete study sessions or tasks to unlock milestone badges!</p>
            ) : (
              summary.studySummary.badges.map((b, idx) => (
                <div key={idx} style={{
                  padding: '0.6rem 0.85rem',
                  borderRadius: '8px',
                  background: 'var(--accent-primary-light)',
                  border: '1px solid rgba(36, 59, 122, 0.2)',
                  color: 'var(--accent-primary)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  🏆 {b}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

