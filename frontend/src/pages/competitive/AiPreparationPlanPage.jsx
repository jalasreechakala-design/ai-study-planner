import React, { useState, useEffect } from 'react';
import { aiAPI } from '../../services/api';
import { Sparkles, Cpu, Target, Clock, AlertTriangle, BookOpen, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AiPreparationPlanPage() {
  const [availableHours, setAvailableHours] = useState(3);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlan();
  }, [availableHours]);

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const res = await aiAPI.getRecommendations({ availableHours });
      setData(res.data);
    } catch (err) {
      console.error('Failed to load AI prep plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: '1.5rem' }}>
        <span className="badge badge-primary" style={{ marginBottom: '0.4rem', padding: '0.35rem 0.8rem' }}>
          <Sparkles size={14} /> AI Recommendation Engine
        </span>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Personalized Preparation Plan 🚀</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Real-time rule-based recommendation system analyzing target exam date, weak subjects, quiz scores, and daily available study hours.
        </p>
      </div>

      {/* Available Hours Adjuster */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h4 style={{ fontSize: '1.05rem', marginBottom: '0.2rem' }}>Adjust Your Available Daily Study Time</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>The AI engine dynamically recalculates your priority plan based on available study hours.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <input
            type="range"
            min="1"
            max="10"
            value={availableHours}
            onChange={(e) => setAvailableHours(Number(e.target.value))}
            style={{ width: '180px', accentColor: 'var(--accent-primary)' }}
          />
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{availableHours} Hours / Day</span>
        </div>
      </div>

      {loading || !data ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>AI Engine is analyzing performance data...</p>
        </div>
      ) : (
        <div>
          {/* Main Primary Recommendation Banner */}
          <div className="glass-card" style={{
            marginBottom: '1.5rem',
            background: 'var(--bg-secondary)',
            borderLeft: '5px solid var(--color-ai)',
            padding: '1.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-ai)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.6rem' }}>
              <Cpu size={18} /> PRIMARY DAILY ADVISORY RECOMMENDATION
            </div>
            <h2 style={{ fontSize: '1.4rem', lineHeight: 1.4, marginBottom: '1rem' }}>
              "{data.primaryRecommendation}"
            </h2>
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
              <span>🎯 Target Exam: <strong>{data.examTitle}</strong></span>
              <span>📊 Syllabus Covered: <strong>{data.syllabusCompletionPct}%</strong></span>
              <span>⭐ Quiz Average: <strong>{data.avgQuizScore}%</strong></span>
            </div>
          </div>

          {/* Actionable Priorities Stack */}
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Actionable Daily Priorities</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {data.recommendations.map(item => (
              <div key={item.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span className="badge badge-warning">{item.badge}</span>
                    <h4 style={{ fontSize: '1.05rem' }}>{item.title}</h4>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{item.detail}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>⏱️ {item.estimatedMinutes} mins</span>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate('/competitive/quizzes')}>
                    Start Action <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
