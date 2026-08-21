import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, User, Mail, Lock, Phone, Building, GraduationCap, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    college: '',
    course: 'B.Tech',
    branch: 'Computer Science',
    year_of_study: '3rd Year'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Name is required.';
    if (!formData.email.trim()) return 'Email is required.';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return 'Please enter a valid email address.';

    if (!formData.password) return 'Password is required.';
    if (formData.password.length < 6 || !/[A-Za-z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      return 'Password must be at least 6 characters long and contain both letters and numbers.';
    }

    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match.';
    }

    if (!formData.college.trim()) return 'College name is required.';
    if (!formData.course.trim()) return 'Course degree is required.';
    if (!formData.branch.trim()) return 'Branch/Stream is required.';

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      console.error('Student Registration Firebase Error:', {
        code: err.code,
        message: err.message,
        error: err
      });

      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please use a different email or sign in.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Password must be at least 6 characters long and contain both letters and numbers.');
      } else if (err.code === 'auth/invalid-email') {
        setError('The email address is not valid.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Email/password authentication is not enabled in Firebase Console.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network connection failed. Please check your internet connection.');
      } else if (err.code === 'permission-denied') {
        setError('Firestore permission denied. Unable to create profile document.');
      } else if (err.code === 'auth/configuration-not-initialized') {
        setError(err.message);
      } else {
        setError(err.response?.data?.error || err.message || 'Registration failed. Please try again.');
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
      <div className="card" style={{ width: '100%', maxWidth: '640px', padding: '2.25rem' }}>
        {/* Header */}
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
          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.35rem' }}>Student Registration</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Create your account to access the Academic & Competitive Exam Platform.
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
            border: '1px solid rgba(239, 68, 68, 0.25)'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label>Full Name *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  placeholder="Alex Johnson"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={{ paddingLeft: '2.5rem' }}
                />
                <User size={18} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  placeholder="alex@college.edu"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Mail size={18} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
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

            <div className="form-group">
              <label>Confirm Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  className="form-control"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Lock size={18} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Phone Number</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  name="phone"
                  className="form-control"
                  placeholder="+1 555-0199"
                  value={formData.phone}
                  onChange={handleChange}
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Phone size={18} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="form-group">
              <label>College / Institution *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  name="college"
                  className="form-control"
                  placeholder="National Institute of Technology"
                  value={formData.college}
                  onChange={handleChange}
                  required
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Building size={18} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label>Course *</label>
              <input
                type="text"
                name="course"
                className="form-control"
                placeholder="B.Tech"
                value={formData.course}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Branch *</label>
              <input
                type="text"
                name="branch"
                className="form-control"
                placeholder="Computer Science"
                value={formData.branch}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Year of Study *</label>
              <select name="year_of_study" className="form-select" value={formData.year_of_study} onChange={handleChange}>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Postgraduate">Postgraduate</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : (
              <>
                <UserPlus size={18} /> Create Account
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Sign In</Link>
        </div>
      </div>
    </div>
  );
}

