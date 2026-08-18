import React, { useState, useEffect } from 'react';
import { collegeAPI } from '../../services/api';
import { Target, Plus, Calendar, CheckCircle2, Clock, AlertCircle, Edit2, Trash2, Loader2, Search, SlidersHorizontal, Award } from 'lucide-react';

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_date: '',
    category: 'Academic',
    progress_percentage: 0
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await collegeAPI.getGoals();
      setGoals(res.data.goals || []);
    } catch (err) {
      console.error('Failed to load goals:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to load study goals.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingGoalId(null);
    setFormData({
      title: '',
      description: '',
      target_date: '',
      category: 'Academic',
      progress_percentage: 0
    });
    setShowModal(true);
  };

  const handleOpenEdit = (goal) => {
    setEditingGoalId(goal.id);
    setFormData({
      title: goal.title || '',
      description: goal.description || '',
      target_date: goal.target_date || goal.targetDate ? (goal.target_date || goal.targetDate).split('T')[0] : '',
      category: goal.category || 'Academic',
      progress_percentage: goal.progress_percentage !== undefined ? goal.progress_percentage : (goal.progress || 0)
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const prog = Number(formData.progress_percentage);
    if (isNaN(prog) || prog < 0 || prog > 100) {
      alert('Progress percentage must be between 0% and 100%.');
      setSaving(false);
      return;
    }

    try {
      if (editingGoalId) {
        await collegeAPI.updateGoal(editingGoalId, formData);
      } else {
        await collegeAPI.createGoal(formData);
      }
      setShowModal(false);
      loadGoals();
    } catch (err) {
      console.error('Save Goal Error:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to save goal.';
      alert(`Error saving goal: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickProgressUpdate = async (goal, newProgress) => {
    const clampedProgress = Math.min(100, Math.max(0, newProgress));
    try {
      await collegeAPI.updateGoal(goal.id, {
        ...goal,
        progress_percentage: clampedProgress,
        progress: clampedProgress
      });
      loadGoals();
    } catch (err) {
      console.error('Failed to update progress:', err);
      alert('Failed to update progress percentage.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this study goal?')) return;
    try {
      await collegeAPI.deleteGoal(id);
      loadGoals();
    } catch (err) {
      console.error('Failed to delete goal:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to delete goal.';
      alert(`Error deleting goal: ${msg}`);
    }
  };

  const filteredGoals = goals.filter(g => {
    const matchesSearch = (g.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (g.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || g.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const activeGoalsCount = goals.filter(g => (g.progress_percentage || g.progress || 0) < 100).length;
  const completedGoalsCount = goals.filter(g => (g.progress_percentage || g.progress || 0) >= 100).length;

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Goals & Targets 🎯</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Set academic, competitive exam & personal study targets stored securely in Firestore.</p>
        </div>
        <button onClick={handleOpenCreate} className="btn btn-primary">
          <Plus size={18} /> Set New Goal
        </button>
      </div>

      {/* Error State Alert */}
      {errorMessage && (
        <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle size={20} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.85rem', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            <Target size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Active Goals</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{activeGoalsCount}</div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.85rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <CheckCircle2 size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Completed Targets</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{completedGoalsCount}</div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.85rem', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
            <Award size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Goals Tracked</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{goals.length}</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="glass-card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search goals by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <SlidersHorizontal size={18} style={{ color: 'var(--text-muted)' }} />
          <select className="form-control" style={{ width: 'auto' }} value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="all">All Categories</option>
            <option value="Academic">Academic</option>
            <option value="Competitive Exam">Competitive Exam</option>
            <option value="Personal">Personal</option>
            <option value="Skill Development">Skill Development</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 1rem', color: 'var(--accent-primary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading study goals from Firestore...</p>
        </div>
      ) : filteredGoals.length === 0 ? (
        /* Empty State */
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Target size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Goals Found</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Set your first goal to start tracking progress towards academic & exam success.</p>
          <button onClick={handleOpenCreate} className="btn btn-primary btn-sm">
            <Plus size={16} /> Set First Goal
          </button>
        </div>
      ) : (
        /* Goals Grid */
        <div className="grid-2">
          {filteredGoals.map(goal => {
            const prog = goal.progress_percentage !== undefined ? goal.progress_percentage : (goal.progress || 0);
            const isCompleted = prog >= 100 || goal.completed === true;

            const isCompetitive = (goal.category || '').includes('Exam') || (goal.title || '').toLowerCase().includes('gate') || (goal.title || '').toLowerCase().includes('cat');

            return (
              <div key={goal.id} className="glass-card" style={{ borderLeft: `4px solid ${isCompleted ? 'var(--accent-success)' : (goal.isOverdue ? 'var(--accent-danger)' : 'var(--accent-primary)')}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', textDecoration: isCompleted ? 'line-through' : 'none', color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                      {goal.title}
                    </h3>
                    {isCompetitive && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600, display: 'inline-block', marginTop: '0.2rem' }}>
                        ⚡ Linked to Exam Roadmap
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge badge-primary">{goal.category || 'Academic'}</span>
                    <button onClick={() => handleOpenEdit(goal)} className="btn btn-secondary btn-sm" title="Edit Goal">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(goal.id)} className="btn btn-secondary btn-sm" style={{ color: 'var(--accent-danger)' }} title="Delete Goal">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                  {goal.description || 'No additional description provided.'}
                </p>

                {/* Target Date & Deadline Badge */}
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={14} /> Target Date: {goal.target_date || goal.targetDate ? (goal.target_date || goal.targetDate).split('T')[0] : 'Open Deadline'}
                  </div>

                  {goal.isOverdue ? (
                    <span className="badge badge-danger" style={{ fontSize: '0.75rem' }}>Overdue</span>
                  ) : goal.daysRemaining !== null && goal.daysRemaining !== undefined && !isCompleted ? (
                    <span style={{ fontSize: '0.8rem', color: 'var(--accent-warning)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} /> {goal.daysRemaining} days remaining
                    </span>
                  ) : isCompleted ? (
                    <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>Completed</span>
                  ) : null}
                </div>

                {/* Progress Bar & Slider Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  <span>Completion Progress</span>
                  <span style={{ fontWeight: 700, color: isCompleted ? 'var(--accent-success)' : 'var(--accent-primary)' }}>{prog}%</span>
                </div>

                <div className="progress-bar-bg" style={{ marginBottom: '0.75rem' }}>
                  <div className="progress-bar-fill" style={{
                    width: `${prog}%`,
                    background: isCompleted ? 'var(--accent-success)' : 'var(--accent-gradient)'
                  }} />
                </div>

                {/* Quick Progress Adjustment Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <button onClick={() => handleQuickProgressUpdate(goal, prog - 10)} disabled={prog <= 0} className="btn btn-secondary btn-sm" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                    -10%
                  </button>
                  <button onClick={() => handleQuickProgressUpdate(goal, prog + 10)} disabled={prog >= 100} className="btn btn-secondary btn-sm" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                    +10%
                  </button>
                  <button onClick={() => handleQuickProgressUpdate(goal, 100)} disabled={isCompleted} className="btn btn-primary btn-sm" style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}>
                    Mark 100%
                  </button>
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
            <h3 style={{ marginBottom: '1.5rem' }}>{editingGoalId ? 'Edit Study Goal' : 'Set New Study Goal'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Goal Title *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Master Computer Networks & GATE CS Revision"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Key milestones, strategy or topics..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label>Target Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.target_date}
                    onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <select className="form-control" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                    <option value="Academic">Academic Goal</option>
                    <option value="Competitive Exam">Competitive Exam</option>
                    <option value="Personal">Personal Goal</option>
                    <option value="Skill Development">Skill Development</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Progress (%): {formData.progress_percentage}%</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="form-control"
                    value={formData.progress_percentage}
                    onChange={(e) => setFormData({ ...formData, progress_percentage: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : (editingGoalId ? 'Update Goal' : 'Save Goal')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
