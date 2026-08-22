import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Mail, Lock, AlertTriangle } from 'lucide-react';

export default function AdminLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (!user || user.role !== 'admin') {
        setError('Access denied. This account does not have Admin privileges.');
        return;
      }
      navigate('/admin');
    } catch (err) {
      console.error('Admin Login Firebase Error:', {
        code: err.code,
        message: err.message,
        error: err
      });

      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid Admin credentials. Please check the admin email and password.');
      } else if (err.code === 'auth/invalid-email') {
        setError('The admin email address is not valid.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Email/password authentication is not enabled in Firebase Console.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network connection failed. Please check your internet connection.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Access to this account has been temporarily disabled due to many failed login attempts.');
      } else if (err.code === 'permission-denied') {
        setError('Firestore permission denied.');
      } else if (err.code === 'auth/configuration-not-initialized' || err.code === 'auth/account-disabled') {
        setError(err.message);
      } else {
        setError(err.response?.data?.error || err.message || 'Invalid Admin credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 70px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'radial-gradient(circle at center, rgba(239, 68, 68, 0.15) 0%, transparent 70%)'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem', borderLeft: '4px solid var(--accent-danger)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto'
          }}>
            <ShieldCheck size={32} />
          </div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Admin Portal Login</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Restricted access for system administrators & managers.</p>
        </div>

        <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontSize: '0.8rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={16} /> Public Admin Registration is disabled. Use system admin credentials.
        </div>

        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Admin Email</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: '2.5rem' }}
              />
              <Mail size={18} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="form-group">
            <label>Master Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: '2.5rem' }}
              />
              <Lock size={18} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <button type="submit" className="btn btn-danger" style={{ width: '100%', marginTop: '1rem', padding: '0.8rem' }} disabled={loading}>
            <ShieldCheck size={18} /> {loading ? 'Verifying Admin Credentials...' : 'Authenticate Admin'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          <Link to="/login" style={{ color: 'var(--text-secondary)' }}>← Back to Student Login</Link>
        </div>
      </div>
    </div>
  );
}
