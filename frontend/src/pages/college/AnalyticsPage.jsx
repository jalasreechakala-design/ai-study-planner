import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collegeAPI } from '../../services/api';
import {
  BarChart2,
  CheckSquare,
  Clock,
  Award,
  Target,
  GraduationCap,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  BookOpen,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Zap,
  Calendar
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';
import EmptyState from '../../components/common/EmptyState';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const res = await collegeAPI.getAnalytics();
      setData(res.data);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ padding: '3rem 1.5rem' }}>
        <div className="skeleton" style={{ height: '140px', marginBottom: '1.5rem' }}></div>
        <div className="grid-5" style={{ marginBottom: '1.5rem' }}>
          <div className="skeleton" style={{ height: '100px' }}></div>
          <div className="skeleton" style={{ height: '100px' }}></div>
          <div className="skeleton" style={{ height: '100px' }}></div>
          <div className="skeleton" style={{ height: '100px' }}></div>
          <div className="skeleton" style={{ height: '100px' }}></div>
        </div>
      </div>
    );
  }

  const overall = data?.overallPerformance || {};
  const studyTime = data?.studyTime || {};
  const tasks = data?.tasks || {};
  const attendance = data?.attendance || {};
  const cgpa = data?.cgpa || {};
  const goals = data?.goals || {};
  const quizPerf = data?.quizPerformance || {};
  const mockPerf = data?.mockPerformance || {};
  const weakTopics = data?.weakTopics || [];
  const strongTopics = data?.strongTopics || [];
  const subjectPerf = data?.subjectPerformance || [];
  const recommendations = data?.recommendations || [];

  // Weekly study time chart data (Mon - Sun)
  const weeklyData = [
    { day: 'Mon', minutes: studyTime.weeklyBreakdown?.Monday || 0 },
    { day: 'Tue', minutes: studyTime.weeklyBreakdown?.Tuesday || 0 },
    { day: 'Wed', minutes: studyTime.weeklyBreakdown?.Wednesday || 0 },
    { day: 'Thu', minutes: studyTime.weeklyBreakdown?.Thursday || 0 },
    { day: 'Fri', minutes: studyTime.weeklyBreakdown?.Friday || 0 },
    { day: 'Sat', minutes: studyTime.weeklyBreakdown?.Saturday || 0 },
    { day: 'Sun', minutes: studyTime.weeklyBreakdown?.Sunday || 0 }
  ];

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'var(--accent-primary-light)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>
          <BarChart2 size={14} /> Comprehensive Analytics & Performance Intelligence
        </div>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.35rem' }}>Student Performance Dashboard 📊</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Real-time metrics calculated from your study sessions, tasks, attendance records, CGPA, quiz results, and mock test scores.
        </p>
      </div>

      {/* 1. Overall Performance Dashboard (5 Stat Cards) */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Zap size={18} color="var(--accent-primary)" /> Overall Performance Overview
        </h2>
        <div className="grid-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Tasks Completed</span>
            <h2 style={{ fontSize: '2rem', marginTop: '0.25rem', color: 'var(--accent-success)' }}>
              {tasks.completionRate !== null ? `${tasks.completionRate}%` : 'N/A'}
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {tasks.completed || 0} of {tasks.total || 0} completed
            </span>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Overall Attendance</span>
            <h2 style={{ fontSize: '2rem', marginTop: '0.25rem', color: (overall.attendancePct || 100) >= 75 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
              {overall.attendancePct !== undefined ? `${overall.attendancePct}%` : '100%'}
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {attendance.subjectsBelowTarget?.length ? `${attendance.subjectsBelowTarget.length} below target` : 'All safe'}
            </span>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Quiz Accuracy</span>
            <h2 style={{ fontSize: '2rem', marginTop: '0.25rem', color: 'var(--accent-primary)' }}>
              {data?.hasQuizData ? `${overall.quizAccuracyPct}%` : '—'}
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {data?.hasQuizData ? `${quizPerf.totalAttempts} attempts` : 'No quiz attempts yet'}
            </span>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Mock Test Score</span>
            <h2 style={{ fontSize: '2rem', marginTop: '0.25rem', color: 'var(--color-ai)' }}>
              {data?.hasMockData ? `${overall.mockTestScorePct}%` : '—'}
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {data?.hasMockData ? `Avg across ${mockPerf.totalAttempts} tests` : 'No mock tests yet'}
            </span>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Goals Progress</span>
            <h2 style={{ fontSize: '2rem', marginTop: '0.25rem', color: 'var(--color-competitive)' }}>
              {goals.averageProgress !== null ? `${goals.averageProgress}%` : '—'}
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {goals.completed || 0} of {goals.total || 0} goals finished
            </span>
          </div>
        </div>
      </div>

      {/* 2. Personalized Recommendations Section */}
      {recommendations.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} color="var(--accent-warning)" /> Recommended For You
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {recommendations.map(rec => (
              <div
                key={rec.id}
                className="glass-card"
                style={{
                  borderLeft: `4px solid ${rec.badgeColor || 'var(--accent-primary)'}`,
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{rec.title}</h3>
                    <span className="badge" style={{ background: `${rec.badgeColor}20`, color: rec.badgeColor, fontSize: '0.75rem' }}>
                      Advisory
                    </span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{rec.text}</p>
                </div>
                {rec.actionLabel && (
                  <button
                    onClick={() => navigate(rec.actionUrl)}
                    className="btn btn-sm"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', alignSelf: 'flex-start', fontWeight: 600 }}
                  >
                    {rec.actionLabel} <ArrowRight size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Study Time Analytics & Weekly Chart */}
      <div className="grid-2" style={{ marginBottom: '2.5rem' }}>
        <div className="glass-card">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} color="var(--accent-primary)" /> Study Time Breakdown
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Today</span>
              <h3 style={{ fontSize: '1.5rem', marginTop: '0.2rem', color: 'var(--accent-primary)' }}>
                {studyTime.todayFormatted || '0m'}
              </h3>
            </div>

            <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>This Week</span>
              <h3 style={{ fontSize: '1.5rem', marginTop: '0.2rem', color: 'var(--color-college)' }}>
                {studyTime.thisWeekFormatted || '0m'}
              </h3>
            </div>

            <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>This Month</span>
              <h3 style={{ fontSize: '1.5rem', marginTop: '0.2rem', color: 'var(--color-competitive)' }}>
                {studyTime.thisMonthFormatted || '0m'}
              </h3>
            </div>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Logged sessions: <strong>{studyTime.totalHours || '0.0'} total hours</strong> across all subjects.
          </p>
        </div>

        {/* Weekly Study Chart */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Weekly Study Activity (Minutes/Day)</h3>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis dataKey="day" stroke="var(--text-secondary)" fontSize={12} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} />
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                <Bar dataKey="minutes" fill="var(--color-college)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Quiz Performance & Mock Test Performance */}
      <div className="grid-2" style={{ marginBottom: '2.5rem' }}>
        {/* Quiz Performance */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem' }}>Quiz Performance Timeline</h3>
            {quizPerf.trend === 'improving' && (
              <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <TrendingUp size={12} /> Improving
              </span>
            )}
            {quizPerf.trend === 'declining' && (
              <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <TrendingDown size={12} /> Declining
              </span>
            )}
          </div>

          {!data?.hasQuizData ? (
            <EmptyState
              icon={HelpCircle}
              title="No Quiz Attempts Yet"
              description="Complete your first topic quiz to track your accuracy score over time."
              actionText="Take a Quiz"
              onAction={() => navigate('/competitive/quizzes')}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {quizPerf.attempts?.slice(-4).map((att) => (
                <div key={att.id} style={{ background: 'var(--bg-primary)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '0.9rem' }}>Attempt {att.attemptNumber}: {att.quizTitle}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {att.correctCount} of {att.totalQuestions} questions correct
                    </span>
                  </div>
                  <span className={`badge ${att.percentage >= 75 ? 'badge-success' : att.percentage >= 50 ? 'badge-warning' : 'badge-danger'}`}>
                    {att.percentage}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mock Test Performance */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem' }}>Mock Test Performance</h3>
            {mockPerf.improvementPercentage > 0 && (
              <span className="badge badge-success">+{mockPerf.improvementPercentage}% Improvement</span>
            )}
          </div>

          {!data?.hasMockData ? (
            <EmptyState
              icon={Award}
              title="No Mock Tests Recorded Yet"
              description="Attempt full mock tests to measure your overall exam readiness and score metrics."
              actionText="Attempt Mock Test"
              onAction={() => navigate('/competitive/mock-tests')}
            />
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ background: 'var(--bg-primary)', padding: '0.6rem', borderRadius: '6px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Best</span>
                  <p style={{ fontWeight: 700, color: 'var(--accent-success)' }}>{mockPerf.bestScore}%</p>
                </div>
                <div style={{ background: 'var(--bg-primary)', padding: '0.6rem', borderRadius: '6px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Average</span>
                  <p style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{mockPerf.averageScore}%</p>
                </div>
                <div style={{ background: 'var(--bg-primary)', padding: '0.6rem', borderRadius: '6px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Latest</span>
                  <p style={{ fontWeight: 700, color: 'var(--color-ai)' }}>{mockPerf.latestScore}%</p>
                </div>
                <div style={{ background: 'var(--bg-primary)', padding: '0.6rem', borderRadius: '6px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Trend</span>
                  <p style={{ fontWeight: 700, color: mockPerf.trend === 'improving' ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                    {mockPerf.trend}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {mockPerf.attempts?.slice(-3).map((m) => (
                  <div key={m.id} style={{ background: 'var(--bg-primary)', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem' }}>{m.testTitle}</span>
                    <span className={`badge ${m.percentage >= 70 ? 'badge-success' : 'badge-warning'}`}>
                      {m.percentage}% Score
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. Weak Topics & Strong Topics */}
      <div className="grid-2" style={{ marginBottom: '2.5rem' }}>
        {/* Weak Topics */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} color="var(--accent-danger)" /> Weak Topics (Needs Revision)
          </h3>

          {weakTopics.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--bg-primary)', borderRadius: '8px' }}>
              <CheckCircle2 size={32} color="var(--accent-success)" style={{ margin: '0 auto 0.5rem' }} />
              <h4 style={{ fontSize: '0.95rem' }}>No Weak Topics Detected 🎉</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Your accuracy across tested topics is above 65%. Keep up the strong performance!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {weakTopics.map((item, idx) => (
                <div key={idx} style={{ background: 'var(--bg-primary)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '0.9rem' }}>{item.statusTier} {item.topic}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Subject: {item.subject}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-danger)' }}>{item.accuracy}%</span>
                    <br />
                    <button
                      onClick={() => navigate('/competitive/questions')}
                      className="btn btn-sm"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', marginTop: '0.2rem', background: 'rgba(220, 38, 38, 0.1)', color: '#f87171' }}
                    >
                      Practice
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Strong Topics */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} color="var(--accent-success)" /> Strong Topics (Mastered)
          </h3>

          {strongTopics.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--bg-primary)', borderRadius: '8px' }}>
              <BookOpen size={32} color="var(--accent-primary)" style={{ margin: '0 auto 0.5rem' }} />
              <h4 style={{ fontSize: '0.95rem' }}>No Strong Topics Tagged Yet</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Complete more quizzes with 75%+ accuracy to highlight your mastered topics.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {strongTopics.map((item, idx) => (
                <div key={idx} style={{ background: 'var(--bg-primary)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '0.9rem' }}>{item.statusTier} {item.topic}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Subject: {item.subject}</span>
                  </div>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-success)' }}>
                    {item.accuracy}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6. Subject & Attendance Analytics */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        {/* Attendance Analytics */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem' }}>Attendance Analytics by Subject</h3>
            <button onClick={() => navigate('/college/attendance')} className="btn btn-sm btn-secondary" style={{ fontSize: '0.75rem' }}>
              Manage Attendance
            </button>
          </div>

          {!data?.hasAttendanceData ? (
            <EmptyState
              icon={Award}
              title="No Attendance Records"
              description="Add your course subjects and track class attendance percentages."
              actionText="Add Attendance"
              onAction={() => navigate('/college/attendance')}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {attendance.records?.map((rec) => (
                <div key={rec.id} style={{ background: 'var(--bg-primary)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{rec.subjectName}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: rec.currentPercentage < rec.targetPercentage ? 'var(--accent-danger)' : 'var(--accent-success)' }}>
                      {rec.currentPercentage}% <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>(Target: {rec.targetPercentage}%)</span>
                    </span>
                  </div>

                  <div className="progress-bar-bg" style={{ height: '8px' }}>
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${Math.min(100, rec.currentPercentage)}%`,
                        backgroundColor: rec.currentPercentage >= rec.targetPercentage ? 'var(--accent-success)' : 'var(--accent-danger)'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Goal Performance */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem' }}>Goal Completion Progress</h3>
            <button onClick={() => navigate('/college/goals')} className="btn btn-sm btn-secondary" style={{ fontSize: '0.75rem' }}>
              View Goals
            </button>
          </div>

          {!data?.hasGoalData ? (
            <EmptyState
              icon={Target}
              title="No Academic Goals Set"
              description="Set target milestones for exams, projects, and revision goals."
              actionText="Create Goal"
              onAction={() => navigate('/college/goals')}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {goals.list?.map((g) => (
                <div key={g.id} style={{ background: 'var(--bg-primary)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{g.title}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-competitive)' }}>
                      {g.progress}%
                    </span>
                  </div>

                  <div className="progress-bar-bg" style={{ height: '8px' }}>
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${g.progress}%`,
                        backgroundColor: g.completed ? 'var(--accent-success)' : 'var(--color-competitive)'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
