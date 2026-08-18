import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { competitiveAPI } from '../../services/api';
import {
  PieChart,
  BarChart2,
  Award,
  Clock,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  BookOpen,
  AlertCircle,
  Sparkles,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import EmptyState from '../../components/common/EmptyState';

export default function CompetitiveAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const res = await competitiveAPI.getAnalytics();
      setAnalytics(res.data);
    } catch (err) {
      console.error('Failed to load competitive analytics', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analytics) return (
    <div className="page-wrapper" style={{ padding: '3rem 1.5rem' }}>
      <div className="skeleton" style={{ height: '140px', marginBottom: '1.5rem' }}></div>
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="skeleton" style={{ height: '100px' }}></div>
        <div className="skeleton" style={{ height: '100px' }}></div>
        <div className="skeleton" style={{ height: '100px' }}></div>
        <div className="skeleton" style={{ height: '100px' }}></div>
      </div>
    </div>
  );

  const overall = analytics.overallPerformance || {};
  const studyTime = analytics.studyTime || {};
  const quizPerf = analytics.quizPerformance || {};
  const mockPerf = analytics.mockPerformance || {};
  const weakTopics = analytics.weakTopics || [];
  const strongTopics = analytics.strongTopics || [];
  const subjectStats = analytics.subjectPerformance || [];
  const recommendations = analytics.recommendations || [];

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
      <div style={{ marginBottom: '1.5rem' }}>
        <span className="badge badge-primary" style={{ marginBottom: '0.4rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
          <PieChart size={13} /> Competitive Performance Analytics
        </span>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Exam Preparation Analytics 📊</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Detailed performance breakdown of your study hours, quiz attempts, weak topics, and mock test scores for {analytics.examTitle}.
        </p>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="glass-card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Study Time</span>
          <h2 style={{ fontSize: '2.2rem', marginTop: '0.3rem', color: 'var(--accent-primary)' }}>
            {analytics.totalStudyHours} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>hrs</span>
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Accumulated study sessions</span>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Quiz Accuracy</span>
          <h2 style={{ fontSize: '2.2rem', marginTop: '0.3rem', color: 'var(--accent-warning)' }}>
            {analytics.hasQuizData ? `${overall.quizAccuracyPct}%` : '—'}
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {analytics.hasQuizData ? `Across ${quizPerf.totalAttempts} quizzes` : 'No quiz attempts yet'}
          </span>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Mock Test Average</span>
          <h2 style={{ fontSize: '2.2rem', marginTop: '0.3rem', color: 'var(--color-ai)' }}>
            {analytics.hasMockData ? `${overall.mockTestScorePct}%` : '—'}
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {analytics.hasMockData ? `Across ${mockPerf.totalAttempts} mock tests` : 'No mock tests yet'}
          </span>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Weak Topics Alert</span>
          <h2 style={{ fontSize: '2.2rem', marginTop: '0.3rem', color: weakTopics.length > 0 ? 'var(--accent-danger)' : 'var(--accent-success)' }}>
            {weakTopics.length}
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Topics below 65% accuracy</span>
        </div>
      </div>

      {/* Recommendations Banner */}
      {recommendations.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={16} color="var(--accent-warning)" /> Personalized Exam Advisory
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {recommendations.map(rec => (
              <div key={rec.id} className="glass-card" style={{ borderLeft: `4px solid ${rec.badgeColor || 'var(--color-competitive)'}`, padding: '1rem 1.2rem' }}>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.25rem' }}>{rec.title}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>{rec.text}</p>
                {rec.actionLabel && (
                  <button onClick={() => navigate(rec.actionUrl)} className="btn btn-sm btn-secondary" style={{ fontSize: '0.75rem' }}>
                    {rec.actionLabel} <ArrowRight size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Study Time Chart & Weak Topics Grid */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Weekly Study Time Chart */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Weekly Study Hours</h3>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis dataKey="day" stroke="var(--text-secondary)" fontSize={12} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} />
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                <Bar dataKey="minutes" fill="var(--color-competitive)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weak Topics Identification */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <AlertCircle size={16} color="var(--accent-danger)" /> Weak Topic Detection
          </h3>
          {weakTopics.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No Weak Topics Detected"
              description="Your accuracy across all tested topics is looking strong!"
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {weakTopics.map((wt, idx) => (
                <div key={idx} style={{ background: 'var(--bg-primary)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{wt.statusTier} {wt.topic}</span>
                    <br />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{wt.subject}</span>
                  </div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-danger)' }}>{wt.accuracy}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Strong Topics & Subject Stats */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Strong Topics */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle2 size={16} color="var(--accent-success)" /> Strong Topics (Mastered)
          </h3>
          {strongTopics.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No Mastered Topics Yet"
              description="Score above 75% on quiz attempts to highlight your strong topics."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {strongTopics.map((st, idx) => (
                <div key={idx} style={{ background: 'var(--bg-primary)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{st.statusTier} {st.topic}</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-success)' }}>{st.accuracy}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quiz Attempts History */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Quiz Attempts History</h3>
          {!analytics.hasQuizData ? (
            <EmptyState
              icon={HelpCircle}
              title="No Quiz Attempts Recorded"
              description="Complete quizzes to view attempt history and accuracy trends."
              actionText="Take Quiz"
              onAction={() => navigate('/competitive/quizzes')}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {quizPerf.attempts?.slice(-4).map((att) => (
                <div key={att.id} style={{ background: 'var(--bg-primary)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Attempt {att.attemptNumber}: {att.quizTitle}</span>
                    <br />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{att.correctCount} / {att.totalQuestions} correct</span>
                  </div>
                  <span className={`badge ${att.percentage >= 75 ? 'badge-success' : 'badge-warning'}`}>
                    {att.percentage}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
