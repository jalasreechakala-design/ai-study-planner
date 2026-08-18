import React, { useState, useEffect } from 'react';
import { competitiveAPI } from '../../services/api';
import { ListTodo, CheckCircle, Clock, AlertCircle, PieChart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SyllabusTrackerPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTracker();
  }, []);

  const loadTracker = async () => {
    try {
      const res = await competitiveAPI.getSyllabusTracker();
      setData(res.data);
    } catch (err) {
      console.error('Failed to load syllabus tracker');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) return (
    <div className="page-wrapper">
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading Visual Syllabus Tracker...</p>
      </div>
    </div>
  );

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: '2rem' }}>
        <span className="badge badge-success" style={{ marginBottom: '0.5rem', padding: '0.35rem 0.8rem' }}>
          <ListTodo size={14} /> Competitive Preparation Tracker
        </span>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Visual Syllabus Tracker 📊</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Track your real-time completion progress across subjects, topics, and subtopics.
        </p>
      </div>

      {/* Top Progress Summary Grid */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="glass-card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Overall Preparation</span>
          <h2 style={{ fontSize: '2.2rem', marginTop: '0.3rem', color: 'var(--color-competitive)' }}>
            {data.overallPercentage}%
          </h2>
          <div className="progress-bar-bg" style={{ marginTop: '0.5rem' }}>
            <div className="progress-bar-fill" style={{ width: `${data.overallPercentage}%`, backgroundColor: 'var(--color-competitive)' }} />
          </div>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Completed Topics</span>
          <h2 style={{ fontSize: '2.2rem', marginTop: '0.3rem', color: 'var(--accent-success)' }}>
            {data.completed}
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>out of {data.totalTopics} topics</span>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>In Progress Topics</span>
          <h2 style={{ fontSize: '2.2rem', marginTop: '0.3rem', color: 'var(--accent-warning)' }}>
            {data.inProgress}
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>currently active</span>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Pending Topics</span>
          <h2 style={{ fontSize: '2.2rem', marginTop: '0.3rem', color: 'var(--text-muted)' }}>
            {data.notStarted}
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>remaining to cover</span>
        </div>
      </div>

      {/* Subject-Wise Completion Progress Bars */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>Subject Progress Breakdown</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {data.subjectBreakdown.map((subject, idx) => (
            <div key={idx} style={{ background: 'var(--bg-primary)', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div>
                  <h4 style={{ fontSize: '1.05rem' }}>{subject.subjectTitle}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {subject.completedTopics} of {subject.totalTopics} topics completed
                  </span>
                </div>

                <span className="badge badge-success" style={{ fontSize: '0.9rem', padding: '0.3rem 0.75rem' }}>
                  {subject.completionPercentage}%
                </span>
              </div>

              <div className="progress-bar-bg" style={{ height: '10px' }}>
                <div className="progress-bar-fill" style={{
                  width: `${subject.completionPercentage}%`,
                  backgroundColor: subject.completionPercentage > 70 ? 'var(--accent-success)' : (subject.completionPercentage > 40 ? 'var(--accent-primary)' : 'var(--accent-warning)')
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Action Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
        <Link to="/competitive/roadmap" className="btn btn-primary">
          Open Full Syllabus Roadmap <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
