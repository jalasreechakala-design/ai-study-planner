import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Mail, Lock, ShieldCheck, Eye, EyeOff, GraduationCap } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Student Login Firebase Error:', {
        code: err.code,
        message: err.message,
        error: err
      });

      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please try again.');
      } else if (err.code === 'auth/invalid-email') {
        setError('The email address is not valid.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Email/password authentication is not enabled in Firebase Console.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network connection failed. Please check your internet connection and try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Access to this account has been temporarily disabled due to many failed login attempts.');
      } else if (err.code === 'permission-denied') {
        setError('Firestore permission denied. Access restriction in place.');
      } else if (err.code === 'auth/configuration-not-initialized' || err.code === 'auth/account-disabled') {
        setError(err.message);
      } else {
        setError(err.response?.data?.error || err.message || 'Invalid email or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 65px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2.5rem 1rem',
      backgroundColor: 'var(--bg-primary)'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2.25rem' }}>
        {/* Brand & Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'var(--accent-primary)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto'
          }}>
            <GraduationCap size={28} />
          </div>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.35rem' }}>Student Login</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Welcome back! Log in to access your study planner.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--accent-danger)',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-email"
                type="email"
                className="form-control"
                placeholder="student@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: '2.5rem' }}
              />
              <Mail size={18} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label htmlFor="login-password" style={{ marginBottom: 0 }}>Password</label>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
              />
              <Lock size={18} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex'
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="skeleton" style={{ width: '16px', height: '16px', borderRadius: '50%' }}></span>
                Logging in...
              </>
            ) : (
              <>
                <LogIn size={18} /> Sign In
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
            Register Account
          </Link>
        </div>

        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
          <Link to="/admin/login" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldCheck size={16} color="var(--accent-danger)" /> Admin Portal Login
          </Link>
        </div>
      </div>
    </div>
  );
}

