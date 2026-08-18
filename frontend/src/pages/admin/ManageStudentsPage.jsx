import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Users, Shield, CheckCircle, XCircle, Search, Flame, Award, HelpCircle, FileCheck, AlertTriangle } from 'lucide-react';

export default function ManageStudentsPage() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', text: '', onConfirm: null });

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const res = await adminAPI.getStudents();
      setStudents(res.data.students || []);
    } catch (err) {
      console.error('Failed to load student directory', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = (id, currentStatus, studentName) => {
    const nextStatus = currentStatus === 'deactivated' ? 'active' : 'deactivated';
    const actionName = nextStatus === 'active' ? 'activate' : 'deactivate';

    setConfirmModal({
      open: true,
      title: `${actionName === 'activate' ? 'Activate' : 'Deactivate'} Student Account?`,
      text: `Are you sure you want to ${actionName} access for ${studentName}?`,
      onConfirm: async () => {
        try {
          await adminAPI.toggleStudentStatus(id, nextStatus);
          loadStudents();
        } catch (err) {
          alert('Failed to update student status');
        }
      }
    });
  };

  const filtered = students.filter(s =>
    (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.targetExam || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span className="badge badge-primary" style={{ marginBottom: '0.4rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <Users size={13} /> Firestore Student Directory
          </span>
          <h1 style={{ fontSize: '1.85rem', margin: 0 }}>Student Account Directory 👥</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
            View student platform activity, target exams, study streaks, and manage account status securely.
          </p>
        </div>

        <div style={{ background: 'var(--bg-primary)', padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Registered Students:</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{students.length}</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Search size={18} color="var(--text-muted)" />
        <input
          type="text"
          className="form-control"
          placeholder="Search students by name, email, or target exam (e.g., Alex, GATE, JEE...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ border: 'none', background: 'transparent', padding: 0 }}
        />
      </div>

      {/* Student Directory Table */}
      <div className="glass-card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <th style={{ padding: '0.85rem' }}>Student</th>
                <th style={{ padding: '0.85rem' }}>Target Exam</th>
                <th style={{ padding: '0.85rem' }}>Streak</th>
                <th style={{ padding: '0.85rem' }}>Quizzes</th>
                <th style={{ padding: '0.85rem' }}>Mock Tests</th>
                <th style={{ padding: '0.85rem' }}>Reg. Date</th>
                <th style={{ padding: '0.85rem' }}>Status</th>
                <th style={{ padding: '0.85rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(st => (
                <tr key={st.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                  <td style={{ padding: '0.85rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{st.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{st.email}</div>
                  </td>

                  <td style={{ padding: '0.85rem' }}>
                    <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>
                      <Award size={12} /> {st.targetExam || 'GATE CS & IT'}
                    </span>
                  </td>

                  <td style={{ padding: '0.85rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-warning)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Flame size={14} /> {st.currentStreak || 1} Days
                    </span>
                  </td>

                  <td style={{ padding: '0.85rem', color: 'var(--text-secondary)' }}>
                    {st.quizAttemptsCount || 0} attempts
                  </td>

                  <td style={{ padding: '0.85rem', color: 'var(--text-secondary)' }}>
                    {st.mockAttemptsCount || 0} tests
                  </td>

                  <td style={{ padding: '0.85rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {st.createdAt ? st.createdAt.split('T')[0] : '2026-08-15'}
                  </td>

                  <td style={{ padding: '0.85rem' }}>
                    <span className={`badge ${st.status === 'deactivated' ? 'badge-danger' : 'badge-success'}`}>
                      {st.status === 'deactivated' ? 'Deactivated' : 'Active'}
                    </span>
                  </td>

                  <td style={{ padding: '0.85rem', textAlign: 'right' }}>
                    <button
                      onClick={() => handleToggleStatus(st.id, st.status, st.name)}
                      className={`btn btn-sm ${st.status === 'deactivated' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ color: st.status === 'deactivated' ? '#fff' : 'var(--accent-danger)' }}
                    >
                      {st.status === 'deactivated' ? 'Activate Account' : 'Deactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.open && (
        <div className="modal-overlay" onClick={() => setConfirmModal({ ...confirmModal, open: false })}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--accent-danger)' }}>
              <AlertTriangle size={22} />
              <h3 style={{ fontSize: '1.15rem', margin: 0 }}>{confirmModal.title}</h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              {confirmModal.text}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setConfirmModal({ ...confirmModal, open: false })}>Cancel</button>
              <button className="btn btn-danger" onClick={() => {
                confirmModal.onConfirm();
                setConfirmModal({ ...confirmModal, open: false });
              }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
