import React, { useState, useEffect } from 'react';
import { collegeAPI } from '../../services/api';
import { Calendar as CalendarIcon, Clock, CheckCircle, Info, Tag } from 'lucide-react';

export default function CalendarPage() {
  const [tasks, setTasks] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    collegeAPI.getTasks().then(res => setTasks(res.data.tasks || [])).catch(() => {});
  }, []);

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Academic & Exam Calendar 📅</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Interactive schedule displaying task deadlines, exams, and key academic dates. Click any item for details.</p>
      </div>

      <div className="glass-card">
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CalendarIcon size={20} color="var(--accent-primary)" /> Academic Events & Deadlines
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {tasks.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No scheduled deadlines in calendar.</p>
          ) : (
            tasks.map(task => (
              <div
                key={task.id}
                onClick={() => setSelectedEvent(task)}
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: '12px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ padding: '0.6rem', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                    <CalendarIcon size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', margin: 0 }}>{task.title}</h4>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Subject: {task.subject_name || 'General'} • Due: {task.due_date || 'No Date'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className={`badge ${task.priority === 'high' ? 'badge-danger' : 'badge-warning'}`}>
                    {task.priority}
                  </span>
                  <span className={`badge ${task.status === 'completed' ? 'badge-success' : 'badge-primary'}`}>
                    {task.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Info size={24} color="var(--accent-primary)" />
              <h3 style={{ fontSize: '1.4rem', margin: 0 }}>{selectedEvent.title}</h3>
            </div>

            <div style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid var(--border-color)', lineHeight: 1.8 }}>
              <div><strong>Subject:</strong> {selectedEvent.subject_name || 'General Academic'}</div>
              <div><strong>Due Date:</strong> {selectedEvent.due_date || 'Open Deadline'}</div>
              <div><strong>Priority:</strong> <span className={`badge ${selectedEvent.priority === 'high' ? 'badge-danger' : 'badge-warning'}`}>{selectedEvent.priority}</span></div>
              <div><strong>Status:</strong> {selectedEvent.status}</div>
              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} />
              <div><strong>Description:</strong></div>
              <p style={{ color: 'var(--text-secondary)' }}>{selectedEvent.description || 'No detailed instructions provided.'}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setSelectedEvent(null)}>Close Details</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
