import React, { useState } from 'react';
import { aiAPI } from '../../services/api';
import { Cpu, Clock, Sparkles, Calendar, Coffee } from 'lucide-react';

export default function AiTimetablePage() {
  const [availableHours, setAvailableHours] = useState(4);
  const [startTime, setStartTime] = useState('09:00');
  const [subjectsText, setSubjectsText] = useState('Computer Networks, DBMS, Operating Systems, Quantitative Aptitude');
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const subjectsArr = subjectsText.split(',').map(s => s.trim()).filter(Boolean);
      const res = await aiAPI.generateTimetable({
        availableHours: Number(availableHours),
        startTime,
        subjects: subjectsArr
      });
      setTimetable(res.data.timetable || []);
    } catch (err) {
      alert('Failed to generate AI timetable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>AI Study Timetable Generator 🤖</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Generate an optimized study schedule tailored to your available daily hours and focus subjects.</p>
      </div>

      <div className="grid-2" style={{ alignItems: 'flex-start' }}>
        {/* Generator Form */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} color="var(--accent-primary)" /> Configure Schedule Inputs
          </h3>

          <form onSubmit={handleGenerate}>
            <div className="form-group">
              <label>Daily Available Study Hours</label>
              <input
                type="number"
                min="1"
                max="12"
                className="form-control"
                value={availableHours}
                onChange={(e) => setAvailableHours(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Preferred Start Time</label>
              <input
                type="time"
                className="form-control"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Target Subjects (comma separated)</label>
              <textarea
                className="form-control"
                rows={3}
                value={subjectsText}
                onChange={(e) => setSubjectsText(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem' }} disabled={loading}>
              <Cpu size={18} /> {loading ? 'Generating Schedule...' : 'Generate AI Schedule'}
            </button>
          </form>
        </div>

        {/* Timetable Schedule Display */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>Optimized Daily Timetable</h3>

          {timetable.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              <Clock size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>Configure options on the left and click "Generate AI Schedule".</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {timetable.map((slot, idx) => (
                <div key={idx} style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  background: slot.type === 'Break' ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-primary)',
                  border: `1px solid ${slot.type === 'Break' ? 'rgba(245, 158, 11, 0.25)' : 'var(--border-color)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {slot.type === 'Break' ? <Coffee size={18} color="#fbbf24" /> : <Clock size={18} color="#818cf8" />}
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{slot.activity}</div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Slot: {slot.slot}</span>
                    </div>
                  </div>
                  <span className={`badge ${slot.type === 'Break' ? 'badge-warning' : 'badge-primary'}`}>
                    {slot.duration}
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
