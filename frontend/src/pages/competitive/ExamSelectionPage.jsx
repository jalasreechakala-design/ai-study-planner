import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { competitiveAPI } from '../../services/api';
import { Compass, Award, Cpu, Briefcase, DollarSign, Activity, TrendingUp, Shield, MapPin, Navigation, BookOpen, Search, Calendar, Check, X } from 'lucide-react';

const ICON_MAP = {
  Cpu, Award, Briefcase, DollarSign, Compass, Activity, TrendingUp, Shield, MapPin, Navigation, BookOpen
};

export default function ExamSelectionPage() {
  const [exams, setExams] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedExamForTarget, setSelectedExamForTarget] = useState(null);
  const [targetDate, setTargetDate] = useState('');
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadExams();
  }, [search]);

  const loadExams = async () => {
    try {
      const res = await competitiveAPI.getExams({ search });
      setExams(res.data.exams || []);
    } catch (err) {
      console.error('Failed to load exams');
    }
  };

  const handleOpenSetTargetModal = (exam, e) => {
    e.stopPropagation();
    setSelectedExamForTarget(exam);
    const futureDate = new Date(Date.now() + 86400000 * 120).toISOString().split('T')[0];
    setTargetDate(futureDate);
  };

  const handleConfirmSetTarget = async (e) => {
    e.preventDefault();
    if (!selectedExamForTarget) return;

    setUpdating(true);
    try {
      await competitiveAPI.setTarget({
        exam_id: selectedExamForTarget.id,
        target_exam_date: targetDate
      });
      alert(`Successfully set ${selectedExamForTarget.title} as your active target exam!`);
      setSelectedExamForTarget(null);
      navigate('/competitive/dashboard');
    } catch (err) {
      alert('Failed to set target exam.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 2.5rem auto' }}>
        <span className="badge badge-success" style={{ marginBottom: '0.75rem', padding: '0.35rem 0.8rem' }}>
          <Compass size={14} /> Competitive Exam Directory
        </span>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>Select Your Target Competitive Exam</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          Database-managed target exams. Select your primary target exam, customize your target exam date, and unlock tailored syllabus roadmaps.
        </p>
      </div>

      {/* Search Bar */}
      <div className="glass-card" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
        <Search size={18} color="var(--text-muted)" />
        <input
          type="text"
          className="form-control"
          placeholder="Search exams by name, category, or code (e.g., GATE, UPSC, SSC, Banking, JEE...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ border: 'none', background: 'transparent', padding: 0 }}
        />
      </div>

      {/* Exam Grid */}
      <div className="grid-3">
        {exams.map(exam => {
          const IconComp = ICON_MAP[exam.icon] || BookOpen;

          return (
            <div
              key={exam.id}
              className="glass-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderTop: '4px solid var(--accent-primary)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(37, 99, 235, 0.1)',
                    color: 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <IconComp size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem' }}>{exam.title}</h3>
                    <span className="badge badge-secondary" style={{ fontSize: '0.65rem' }}>{exam.category}</span>
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {exam.description}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => navigate(`/competitive/roadmap?examId=${exam.id}`)}
                >
                  View Roadmap
                </button>

                <button
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                  onClick={(e) => handleOpenSetTargetModal(exam, e)}
                >
                  Set Target Exam
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Set Target Exam & Date Picker Modal */}
      {selectedExamForTarget && (
        <div className="modal-overlay" onClick={() => setSelectedExamForTarget(null)}>
          <div className="modal-container" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Set Target Exam</h3>
              <button onClick={() => setSelectedExamForTarget(null)} className="btn btn-secondary btn-sm" style={{ padding: '0.3rem' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleConfirmSetTarget}>
              <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Selected Exam</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-primary)', marginTop: '0.2rem' }}>
                  {selectedExamForTarget.title}
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Code: {selectedExamForTarget.code}</span>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={16} color="var(--accent-primary)" /> Target Examination Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem', display: 'block' }}>
                  Your exam countdown dashboard will automatically sync with this target date.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedExamForTarget(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={updating}>
                  {updating ? 'Updating...' : 'Confirm Active Target'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
