import React, { useState, useEffect } from 'react';
import { collegeAPI } from '../../services/api';
import { Award, Plus, Calculator, Edit2, Trash2, AlertCircle, Loader2 } from 'lucide-react';

export default function AttendancePage() {
  const [attendance, setAttendance] = useState([]);
  const [overallPercentage, setOverallPercentage] = useState(100);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    subject_name: '',
    attended_classes: 0,
    total_classes: 0,
    target_percentage: 75
  });

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await collegeAPI.getAttendance();
      setAttendance(res.data.attendance || []);
      setOverallPercentage(res.data.overallPercentage !== undefined ? res.data.overallPercentage : 100);
    } catch (err) {
      console.error('Failed to load attendance:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to load attendance records.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingRecordId(null);
    setFormData({
      subject_name: '',
      attended_classes: 0,
      total_classes: 0,
      target_percentage: 75
    });
    setShowModal(true);
  };

  const handleOpenEdit = (rec) => {
    setEditingRecordId(rec.id);
    setFormData({
      subject_name: rec.subject_name || rec.subjectName || '',
      attended_classes: rec.attended_classes !== undefined ? rec.attended_classes : rec.attendedClasses || 0,
      total_classes: rec.total_classes !== undefined ? rec.total_classes : rec.totalClasses || 0,
      target_percentage: rec.target_percentage !== undefined ? rec.target_percentage : rec.targetPercentage || 75
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    if (Number(formData.attended_classes) > Number(formData.total_classes)) {
      alert('Attended classes cannot be greater than total classes.');
      setSaving(false);
      return;
    }

    try {
      if (editingRecordId) {
        await collegeAPI.updateAttendance(editingRecordId, formData);
      } else {
        await collegeAPI.addAttendance(formData);
      }
      setShowModal(false);
      loadAttendance();
    } catch (err) {
      console.error('Save Attendance Error:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to save attendance record.';
      alert(`Error saving record: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject attendance record?')) return;
    try {
      await collegeAPI.deleteAttendance(id);
      loadAttendance();
    } catch (err) {
      console.error('Failed to delete attendance:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to delete attendance record.';
      alert(`Error deleting record: ${msg}`);
    }
  };

  const getTierBadge = (tier, currentPct, targetPct) => {
    const isSafe = currentPct >= (targetPct || 75);
    if (isSafe) return <span className="badge badge-success" style={{ fontSize: '0.85rem' }}>🟢 Safe (≥ {targetPct}%)</span>;
    if (currentPct >= 65) return <span className="badge badge-warning" style={{ fontSize: '0.85rem' }}>🟡 Warning (65-{targetPct - 1}%)</span>;
    return <span className="badge badge-danger" style={{ fontSize: '0.85rem' }}>🔴 Critical (&lt; 65%)</span>;
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Attendance Tracker & Bunk Calculator 📈</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track class attendance, calculate allowable skips & monitor warning thresholds.</p>
        </div>
        <button onClick={handleOpenCreate} className="btn btn-primary">
          <Plus size={18} /> Add Subject Record
        </button>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle size={20} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Overall Summary Card */}
      <div className="glass-card" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)' }}>
        <div>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Overall Academic Attendance</span>
          <h2 style={{ fontSize: '2.8rem', fontWeight: 800, margin: '0.2rem 0', color: overallPercentage >= 75 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
            {overallPercentage}%
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Required minimum threshold: 75%</span>
        </div>
        <div style={{ padding: '1rem', borderRadius: '16px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>
          <Award size={40} />
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 1rem', color: 'var(--accent-primary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading attendance records from Firestore...</p>
        </div>
      ) : attendance.length === 0 ? (
        /* Empty State */
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Award size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Attendance Records Found</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Add your subjects to start tracking attendance and bunk allowances.</p>
          <button onClick={handleOpenCreate} className="btn btn-primary btn-sm">
            <Plus size={16} /> Add First Subject Record
          </button>
        </div>
      ) : (
        /* Attendance Grid */
        <div className="grid-2">
          {attendance.map(sub => {
            const target = sub.target_percentage || sub.targetPercentage || 75;
            const currentPct = sub.currentPercentage !== undefined ? sub.currentPercentage : (sub.total_classes > 0 ? Math.round((sub.attended_classes / sub.total_classes) * 100) : 100);
            const isSafe = currentPct >= target;

            return (
              <div key={sub.id} className="glass-card" style={{ borderLeft: `4px solid ${currentPct >= target ? 'var(--accent-success)' : (currentPct >= 65 ? 'var(--accent-warning)' : 'var(--accent-danger)')}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.25rem' }}>{sub.subject_name || sub.subjectName}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {getTierBadge(sub.statusTier || '', currentPct, target)}
                    <button onClick={() => handleOpenEdit(sub)} className="btn btn-secondary btn-sm" title="Edit Record">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(sub.id)} className="btn btn-secondary btn-sm" style={{ color: 'var(--accent-danger)' }} title="Delete Record">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '2.2rem', fontWeight: 800, color: currentPct >= target ? 'var(--accent-success)' : (currentPct >= 65 ? 'var(--accent-warning)' : 'var(--accent-danger)') }}>
                    {currentPct}%
                  </span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    ({sub.attended_classes !== undefined ? sub.attended_classes : sub.attendedClasses} attended / {sub.total_classes !== undefined ? sub.total_classes : sub.totalClasses} total)
                  </span>
                </div>

                <div className="progress-bar-bg" style={{ marginBottom: '1.25rem' }}>
                  <div className="progress-bar-fill" style={{
                    width: `${Math.min(currentPct, 100)}%`,
                    background: currentPct >= target ? 'var(--accent-gradient)' : (currentPct >= 65 ? '#f59e0b' : '#ef4444')
                  }} />
                </div>

                {/* Bunk Analytics Card */}
                <div style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  background: isSafe ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${isSafe ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: isSafe ? '#34d399' : '#f87171' }}>
                    <Calculator size={18} />
                    {isSafe ? 'Bunk Allowance' : 'Attendance Deficit'}
                  </div>

                  <p style={{ fontSize: '0.875rem', marginTop: '0.4rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {isSafe ? (
                      <>You can safely <strong style={{ color: '#34d399' }}>skip {sub.safeToBunk || 0} classes</strong> while staying above {target}% target.</>
                    ) : (
                      <>You must <strong style={{ color: '#f87171' }}>attend next {sub.classesNeeded || 0} consecutive classes</strong> to restore target {target}% attendance.</>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h3 style={{ marginBottom: '1.5rem' }}>{editingRecordId ? 'Edit Subject Attendance Record' : 'Add Subject Attendance Record'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Subject Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Computer Networks"
                  value={formData.subject_name}
                  onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
                  required
                />
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label>Attended Classes</label>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    value={formData.attended_classes}
                    onChange={(e) => setFormData({ ...formData, attended_classes: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Total Classes</label>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    value={formData.total_classes}
                    onChange={(e) => setFormData({ ...formData, total_classes: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Target %</label>
                  <input
                    type="number"
                    className="form-control"
                    min="50"
                    max="100"
                    value={formData.target_percentage}
                    onChange={(e) => setFormData({ ...formData, target_percentage: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : (editingRecordId ? 'Update Record' : 'Save Record')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
