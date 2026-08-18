import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Phone, GraduationCap, Award, BookOpen, Calendar, Edit3, X, Check } from 'lucide-react';

export default function StudentProfileModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.profile?.phone || '+1 555-0199',
    college: user?.profile?.college || 'National Institute of Technology',
    course: user?.profile?.course || 'B.Tech',
    branch: user?.profile?.branch || 'Computer Science',
    year_of_study: user?.profile?.year_of_study || '3rd Year'
  });

  if (!isOpen || !user) return null;

  const handleSave = (e) => {
    e.preventDefault();
    setEditing(false);
    alert('Profile updated successfully!');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: 'var(--accent-primary)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.25rem'
            }}>
              {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', margin: 0 }}>{user.name}</h2>
              <span className={`badge ${user.role === 'admin' ? 'badge-danger' : 'badge-primary'}`} style={{ marginTop: '0.2rem' }}>
                {user.role === 'admin' ? 'System Administrator' : 'Enrolled Student'}
              </span>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: '0.4rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Profile Content / Form */}
        {editing ? (
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                className="form-control"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Year of Study</label>
                <input
                  type="text"
                  className="form-control"
                  value={profileData.year_of_study}
                  onChange={(e) => setProfileData({ ...profileData, year_of_study: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>College / Institution</label>
              <input
                type="text"
                className="form-control"
                value={profileData.college}
                onChange={(e) => setProfileData({ ...profileData, college: e.target.value })}
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>Degree / Course</label>
                <input
                  type="text"
                  className="form-control"
                  value={profileData.course}
                  onChange={(e) => setProfileData({ ...profileData, course: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Branch / Major</label>
                <input
                  type="text"
                  className="form-control"
                  value={profileData.branch}
                  onChange={(e) => setProfileData({ ...profileData, branch: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary"><Check size={16} /> Save Changes</button>
            </div>
          </form>
        ) : (
          <div>
            <div className="grid-2" style={{ marginBottom: '1.5rem', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Email Address</span>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Mail size={14} color="var(--accent-primary)" /> {user.email}
                </div>
              </div>

              <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Phone Number</span>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Phone size={14} color="var(--accent-primary)" /> {profileData.phone}
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <GraduationCap size={18} color="var(--color-college)" /> Academic Credentials
              </h4>

              <div className="grid-2" style={{ gap: '0.75rem', fontSize: '0.875rem' }}>
                <div><strong>College:</strong> {profileData.college}</div>
                <div><strong>Course:</strong> {profileData.course}</div>
                <div><strong>Branch:</strong> {profileData.branch}</div>
                <div><strong>Year:</strong> {profileData.year_of_study}</div>
              </div>
            </div>

            {/* Preparation Metrics Overview */}
            <div style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Award size={18} color="var(--color-competitive)" /> Active Study Metrics
              </h4>

              <div className="grid-3" style={{ gap: '0.75rem', textAlign: 'center' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-competitive)' }}>GATE 2027</div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Target Exam</span>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-warning)' }}>5 Days 🔥</div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Study Streak</span>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-primary)' }}>80%</div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Prep Progress</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setEditing(true)}>
                <Edit3 size={16} /> Edit Profile Information
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
