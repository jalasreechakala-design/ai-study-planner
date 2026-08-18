import React, { useState } from 'react';
import { adminAPI } from '../../services/api';
import { Bell, Send, CheckCircle } from 'lucide-react';

export default function AdminNotificationsPage() {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'announcement'
  });
  const [statusMsg, setStatusMsg] = useState('');

  const handleBroadcast = async (e) => {
    e.preventDefault();
    try {
      const res = await adminAPI.sendNotification(formData);
      setStatusMsg(res.data.message || 'Announcement broadcasted successfully!');
      setFormData({ title: '', message: '', type: 'announcement' });
    } catch (err) {
      alert('Failed to send announcement');
    }
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '750px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Send Announcements & Alerts 📢</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Broadcast in-app notifications regarding new study materials, exam dates & mock tests to all students.</p>
      </div>

      {statusMsg && (
        <div className="glass-card" style={{ marginBottom: '1.5rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={18} /> {statusMsg}
        </div>
      )}

      <div className="glass-card">
        <form onSubmit={handleBroadcast}>
          <div className="form-group">
            <label>Announcement Title *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. New GATE 2027 Mock Test Paper Available Now!"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Notification Category</label>
            <select
              className="form-control"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="announcement">General Announcement</option>
              <option value="exam_update">Important Exam Update</option>
              <option value="new_material">New Study Resource Uploaded</option>
              <option value="reminder">Deadline Reminder</option>
            </select>
          </div>

          <div className="form-group">
            <label>Message Content *</label>
            <textarea
              className="form-control"
              rows={5}
              placeholder="Full notification body text..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
              <Send size={18} /> Broadcast Announcement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
