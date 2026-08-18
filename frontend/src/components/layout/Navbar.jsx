import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { notificationAPI } from '../../services/api';
import StudentProfileModal from '../profile/StudentProfileModal';
import { Sun, Moon, Bell, GraduationCap, Award, LogOut, CheckCircle, Search, Plus, Menu } from 'lucide-react';

export default function Navbar({ onToggleMobileMenu }) {
  const { user, platformMode, switchPlatform, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const res = await notificationAPI.getNotifications();
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications');
    }
  };

  const markRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      loadNotifications();
    } catch (err) {
      console.error('Failed to mark notification read');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/competitive/materials?search=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <>
      <nav style={{
        height: '65px',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        {/* Left Section: Mobile Toggle & Global Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, maxWidth: '400px' }}>
          {user && (
            <button
              onClick={onToggleMobileMenu}
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.4rem', display: 'flex' }}
              id="mobile-menu-btn"
              title="Toggle Navigation Menu"
            >
              <Menu size={18} />
            </button>
          )}

          {user && (
            <form onSubmit={handleSearchSubmit} style={{ width: '100%', position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search subjects, notes, materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  paddingLeft: '2.25rem',
                  paddingTop: '0.4rem',
                  paddingBottom: '0.4rem',
                  fontSize: '0.85rem',
                  borderRadius: '8px',
                  background: 'var(--surface-secondary)'
                }}
              />
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </form>
          )}
        </div>

        {/* Center: Segmented Control Platform Switcher */}
        {user && user.role !== 'admin' && (
          <div style={{
            display: 'flex',
            background: 'var(--surface-secondary)',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid var(--border)'
          }}>
            <button
              onClick={() => {
                switchPlatform('college');
                navigate('/college/dashboard');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.8125rem',
                transition: 'all 0.15s ease',
                background: platformMode === 'college' ? 'var(--color-college)' : 'transparent',
                color: platformMode === 'college' ? '#ffffff' : 'var(--text-secondary)'
              }}
            >
              <GraduationCap size={15} /> College Mode
            </button>
            <button
              onClick={() => {
                switchPlatform('competitive');
                navigate('/competitive/dashboard');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.8125rem',
                transition: 'all 0.15s ease',
                background: platformMode === 'competitive' ? 'var(--color-competitive)' : 'transparent',
                color: platformMode === 'competitive' ? '#ffffff' : 'var(--text-secondary)'
              }}
            >
              <Award size={15} /> Competitive Mode
            </button>
          </div>
        )}

        {/* Right Section: Quick Action, Theme Toggle, Notifications & Profile Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Quick Action (+ Add Task) */}
          {user && user.role !== 'admin' && (
            <button
              onClick={() => navigate('/college/tasks')}
              className="btn btn-primary btn-sm"
              title="Add New Study Task"
            >
              <Plus size={16} /> Add Task
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              background: 'var(--surface-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              padding: '0.45rem',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Toggle Light / Dark Mode"
          >
            {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#2563eb" />}
          </button>

          {/* Notifications Dropdown */}
          {user && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                style={{
                  background: 'var(--surface-secondary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  padding: '0.45rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  position: 'relative'
                }}
                title="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-3px',
                    right: '-3px',
                    background: 'var(--accent-danger)',
                    color: '#fff',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div style={{
                  position: 'absolute',
                  top: '48px',
                  right: 0,
                  width: '320px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '1rem',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 200
                }}>
                  <h4 style={{ fontSize: '0.875rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                    Notifications <span>({unreadCount} unread)</span>
                  </h4>
                  <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No notifications yet.</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} style={{
                          padding: '0.6rem',
                          borderRadius: '8px',
                          background: n.is_read ? 'transparent' : 'var(--accent-primary-light)',
                          marginBottom: '0.5rem',
                          fontSize: '0.825rem'
                        }}>
                          <div style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                            {n.title}
                            {!n.is_read && (
                              <button onClick={() => markRead(n.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--accent-primary)' }}>
                                <CheckCircle size={14} />
                              </button>
                            )}
                          </div>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.2rem' }}>{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Profile Trigger */}
          {user && (
            <button
              onClick={() => setShowProfileModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'var(--surface-secondary)',
                border: '1px solid var(--border)',
                padding: '0.3rem 0.65rem',
                borderRadius: '8px',
                cursor: 'pointer',
                color: 'var(--text-primary)'
              }}
              title="View Student Profile"
            >
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'var(--accent-primary)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700
              }}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.name}</span>
            </button>
          )}
        </div>
      </nav>

      {/* Student Profile Modal */}
      <StudentProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </>
  );
}

