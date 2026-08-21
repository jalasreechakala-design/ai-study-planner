import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { competitiveAPI } from '../../services/api';
import { Award, Compass, Clock, CheckCircle, Sparkles, BookOpen, FileCheck, ArrowRight, HelpCircle, ListTodo, PieChart, AlertTriangle } from 'lucide-react';

export default function CompetitiveDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await competitiveAPI.getDashboardSummary();
      setData(res.data);
    } catch (err) {
      console.error('Failed to load competitive dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) return (
    <div className="page-wrapper">
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading Competitive Exam Dashboard...</p>
      </div>
    </div>
  );

  const selectedExam = data?.selectedExam || { id: 1, title: 'GATE CS & IT', code: 'GATE_CS' };
  const targetExamDate = data?.targetExamDate || 'Upcoming';
  const countdown = data?.countdown || { days: 0, hours: 0, minutes: 0 };
  const performance = data?.performance || { overallPreparationPct: 0, avgQuizScore: 0, avgMockScore: 0, totalStudyHours: '0.0' };
  const syllabusSummary = data?.syllabusSummary || { completionPercentage: 0, totalTopics: 0, completedTopics: 0, inProgressTopics: 0, pendingTopics: 0 };
  const recommendation = data?.recommendation || { message: 'Focus on revision and practice questions for optimal preparation.' };

  return (
    <div className="page-wrapper">
      {/* Target Exam & Countdown Banner */}
      <div className="glass-card" style={{
        marginBottom: '1.5rem',
        background: 'var(--bg-secondary)',
        borderLeft: '5px solid var(--color-competitive)',
        padding: '1.75rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span className="badge badge-success">
                <Compass size={13} /> Active Target Exam
              </span>
              <button
                onClick={() => navigate('/competitive/exams')}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 600 }}
              >
                Change Exam →
              </button>
            </div>
            <h1 style={{ fontSize: '2rem', margin: '0.2rem 0' }}>{selectedExam.title}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
              Target Exam Date: <strong>{targetExamDate}</strong>
            </p>
          </div>

          {/* Countdown Widget */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            background: 'var(--bg-primary)',
            padding: '0.85rem 1.5rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-competitive)' }}>{countdown.days}</div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Days</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-muted)' }}>:</div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-competitive)' }}>{countdown.hours}</div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Hours</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-muted)' }}>:</div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-competitive)' }}>{countdown.minutes}</div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Mins</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Next Action Banner */}
      {recommendation && (
        <div className="glass-card" style={{ marginBottom: '1.5rem', background: 'var(--bg-secondary)', borderLeft: '4px solid var(--accent-warning)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-warning)', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                <Sparkles size={15} /> RECOMMENDED NEXT TOPIC & TASK
              </div>
              <h3 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 600 }}>
                "{recommendation.message}"
              </h3>
            </div>

            <Link to="/competitive/quizzes" className="btn btn-primary btn-sm">
              Complete DBMS Quiz <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* 4 Summary Stats */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="glass-card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Overall Preparation</span>
          <h2 style={{ fontSize: '2rem', marginTop: '0.3rem', color: 'var(--color-competitive)' }}>
            {performance.overallPreparationPct}%
          </h2>
          <div className="progress-bar-bg" style={{ marginTop: '0.5rem' }}>
            <div className="progress-bar-fill" style={{ width: `${performance.overallPreparationPct}%`, backgroundColor: 'var(--color-competitive)' }} />
          </div>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Syllabus Completion</span>
          <h2 style={{ fontSize: '2rem', marginTop: '0.3rem', color: 'var(--accent-primary)' }}>
            {syllabusSummary.completionPercentage}%
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {syllabusSummary.completedTopics} of {syllabusSummary.totalTopics} topics completed
          </span>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Quiz Performance</span>
          <h2 style={{ fontSize: '2rem', marginTop: '0.3rem', color: 'var(--accent-warning)' }}>
            {performance.avgQuizScore}%
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Average topic quiz score</span>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Mock Test Average</span>
          <h2 style={{ fontSize: '2.2rem', marginTop: '0.3rem', color: 'var(--color-ai)' }}>
            {performance.avgMockScore}%
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>All-India Mock Papers</span>
        </div>
      </div>

      {/* Subject Strengths & Weaknesses Breakdown */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle size={18} color="var(--accent-success)" /> Strong Subjects
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-primary)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Computer Networks</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>10% Exam Weightage</span>
              </div>
              <span className="badge badge-success">80% Mastered</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-primary)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Data Structures & Algorithms</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>15% Exam Weightage</span>
              </div>
              <span className="badge badge-success">75% Mastered</span>
            </div>
          </div>
        </div>

        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <AlertTriangle size={18} color="var(--accent-warning)" /> Needs Improvement
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-primary)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Database Management Systems</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Focus: Normalization (3NF / BCNF)</span>
              </div>
              <span className="badge badge-warning">45% Mastered</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-primary)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Operating Systems</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Focus: Process Scheduling & Deadlocks</span>
              </div>
              <span className="badge badge-warning">50% Mastered</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Quick Access Grid */}
      <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Platform Navigation</h3>
      <div className="grid-3">
        <Link to={`/competitive/roadmap?examId=${selectedExam.id}`} className="glass-card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Compass size={28} color="var(--accent-primary)" style={{ marginBottom: '0.5rem' }} />
          <h4 style={{ fontSize: '1.05rem', marginBottom: '0.25rem' }}>Syllabus Roadmap</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Explore subject, topic, and subtopic hierarchies.</p>
        </Link>

        <Link to="/competitive/syllabus-tracker" className="glass-card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <ListTodo size={28} color="var(--color-competitive)" style={{ marginBottom: '0.5rem' }} />
          <h4 style={{ fontSize: '1.05rem', marginBottom: '0.25rem' }}>Syllabus Tracker</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Visual progress breakdown across all subjects.</p>
        </Link>

        <Link to="/competitive/materials" className="glass-card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <BookOpen size={28} color="var(--accent-warning)" style={{ marginBottom: '0.5rem' }} />
          <h4 style={{ fontSize: '1.05rem', marginBottom: '0.25rem' }}>Study Materials</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Curated PDFs, notes, slides, and references.</p>
        </Link>

        <Link to="/competitive/questions" className="glass-card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <HelpCircle size={28} color="var(--color-analytics)" style={{ marginBottom: '0.5rem' }} />
          <h4 style={{ fontSize: '1.05rem', marginBottom: '0.25rem' }}>PYQ & Question Bank</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Topic-wise practice questions with explanations.</p>
        </Link>

        <Link to="/competitive/quizzes" className="glass-card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Clock size={28} color="var(--color-ai)" style={{ marginBottom: '0.5rem' }} />
          <h4 style={{ fontSize: '1.05rem', marginBottom: '0.25rem' }}>Topic Quizzes</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Timed topic-wise tests with instant evaluation.</p>
        </Link>

        <Link to="/competitive/mock-tests" className="glass-card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <FileCheck size={28} color="var(--accent-danger)" style={{ marginBottom: '0.5rem' }} />
          <h4 style={{ fontSize: '1.05rem', marginBottom: '0.25rem' }}>Full Mock Tests</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Simulate real exam hall conditions with timer.</p>
        </Link>
      </div>
    </div>
  );
}
