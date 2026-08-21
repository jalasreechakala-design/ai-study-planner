import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { collegeAPI, aiAPI } from '../../services/api';
import { GraduationCap, Award, CheckSquare, Clock, Flame, Calendar, Sparkles, ArrowRight, BookOpen, Target, Plus, Play, CheckCircle2, FileText, Bell, FolderKanban } from 'lucide-react';

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
    setLoading(true);
    try {
      const [sumRes, aiRes] = await Promise.allSettled([
        collegeAPI.getDashboardSummary(),
        aiAPI.getRecommendations()
      ]);

      if (sumRes.status === 'fulfilled' && sumRes.value?.data) {
        setSummary(sumRes.value.data);
      } else {
        console.error('Dashboard Summary API Error:', sumRes.reason);
      }

      if (aiRes.status === 'fulfilled' && aiRes.value?.data) {
        setAiRec(aiRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !summary) {
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

  const tasksData = summary?.taskSummary || { total: 0, pending: 0, completed: 0, upcomingDeadlines: [] };
  const studyData = summary?.studySummary || { todayHours: '0.0', totalHours: '0.0', currentStreak: 0, longestStreak: 0, isStreakActiveToday: false, badges: [] };
  const attData = summary?.attendanceSummary || { records: [], overallPercentage: 100 };
  const cgpaData = summary?.cgpaSummary || { records: [], cumulativeCGPA: 0, totalCredits: 0 };
  const notesData = summary?.notesSummary || { total: 0, recent: [] };
  const subjectsData = summary?.subjectsSummary || { total: 0, list: [] };
  const assignmentsData = summary?.assignmentsSummary || { total: 0, pending: 0, list: [] };
  const remindersData = summary?.remindersSummary || { total: 0, list: [] };
  const profileInfo = summary?.profile || user?.profile || {};

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
              <Calendar size={14} /> {summary?.todayDate || new Date().toLocaleDateString()}
            </div>
            <h1 style={{ fontSize: '2rem', color: '#ffffff', marginBottom: '0.4rem' }}>{getGreeting()}, {user?.name?.split(' ')[0] || 'Student'}</h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.95rem', margin: 0 }}>
              Let's make today productive. You have <strong>{tasksData.pending} pending tasks</strong> and <strong>{studyData.todayHours || 0} hrs</strong> logged today.
              {profileInfo?.course && ` • ${profileInfo.course} (${profileInfo.branch || ''})`}
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

      {/* Statistics Row (4 Cards) */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Tasks Overview</span>
              <h2 style={{ fontSize: '1.75rem', marginTop: '0.2rem', color: 'var(--text-primary)' }}>
                {tasksData.pending}
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tasksData.completed} completed today</span>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(217, 119, 6, 0.12)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckSquare size={20} style={{ margin: 'auto' }} />
            </div>
          </div>
        </div>

        <div className="card" style={{ borderLeft: '3px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Study Streak</span>
              <h2 style={{ fontSize: '1.5rem', marginTop: '0.2rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                🔥 {studyData.currentStreak || 0} Day Streak
              </h2>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Longest Streak: <strong>{studyData.longestStreak || 0} days</strong>
              </div>
              <div style={{ fontSize: '0.725rem', fontWeight: 600, color: studyData.isStreakActiveToday ? 'var(--success)' : 'var(--warning)', marginTop: '0.25rem' }}>
                {studyData.isStreakActiveToday ? '🔥 Streak active today' : 'Complete a study activity today to continue your streak.'}
              </div>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Flame size={20} style={{ margin: 'auto' }} />
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Attendance Health</span>
              <h2 style={{ fontSize: '1.75rem', marginTop: '0.2rem', color: attData.overallPercentage >= 75 ? 'var(--success)' : 'var(--danger)' }}>
                {attData.overallPercentage}%
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target: 75% min</span>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(22, 163, 74, 0.12)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={20} style={{ margin: 'auto' }} />
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Cumulative CGPA</span>
              <h2 style={{ fontSize: '1.75rem', marginTop: '0.2rem', color: 'var(--accent-primary)' }}>
                {cgpaData.cumulativeCGPA}
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cgpaData.totalCredits} Credits</span>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--accent-primary-light)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={20} style={{ margin: 'auto' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Academic Modules Overview Row: Subjects, Notes, Assignments, Reminders */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        {/* Subjects Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <BookOpen size={16} color="var(--primary)" /> Subjects ({subjectsData.total})
            </span>
            <Link to="/college/subjects" style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>View All →</Link>
          </div>
          {subjectsData.list.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>No subjects added yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {subjectsData.list.map((sub, idx) => (
                <div key={sub.id || idx} style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem', borderRadius: '6px', background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
                  <strong>{sub.subjectName || sub.title || sub.name}</strong>
                  {sub.code && <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>({sub.code})</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Notes Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileText size={16} color="var(--secondary)" /> Notes ({notesData.total})
            </span>
            <Link to="/college/notes" style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>View All →</Link>
          </div>
          {notesData.recent.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>No notes saved yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {notesData.recent.map((n, idx) => (
                <div key={n.id || idx} style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem', borderRadius: '6px', background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{n.subject || n.category || 'General'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Assignments Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FolderKanban size={16} color="var(--warning)" /> Assignments ({assignmentsData.pending})
            </span>
            <Link to="/college/assignments" style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>View All →</Link>
          </div>
          {assignmentsData.list.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>No assignments yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {assignmentsData.list.map((a, idx) => (
                <div key={a.id || idx} style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem', borderRadius: '6px', background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Due: {a.dueDate || a.due_date || 'Soon'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reminders Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Bell size={16} color="var(--accent)" /> Reminders ({remindersData.total})
            </span>
            <Link to="/college/reminders" style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>View All →</Link>
          </div>
          {remindersData.list.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>No reminders yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {remindersData.list.map((r, idx) => (
                <div key={r.id || idx} style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem', borderRadius: '6px', background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title || r.subject}</div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{r.time || r.reminderTime || 'Scheduled'}</span>
                </div>
              ))}
            </div>
          )}
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
            {tasksData.upcomingDeadlines.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No tasks yet.</p>
            ) : (
              tasksData.upcomingDeadlines.map(task => (
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
            {studyData.badges.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Complete study sessions or tasks to unlock milestone badges!</p>
            ) : (
              studyData.badges.map((b, idx) => (
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
