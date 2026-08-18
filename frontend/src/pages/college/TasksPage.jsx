import React, { useState, useEffect } from 'react';
import { collegeAPI } from '../../services/api';
import { CheckSquare, Plus, Edit2, Trash2, CheckCircle, Clock, Search, Filter } from 'lucide-react';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject_name: 'Computer Networks',
    due_date: '',
    priority: 'medium',
    category: 'college'
  });

  useEffect(() => {
    loadTasks();
  }, [search, priorityFilter, statusFilter]);

  const loadTasks = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await collegeAPI.getTasks(params);
      setTasks(res.data.tasks || []);
    } catch (err) {
      console.error('Failed to load tasks');
    }
  };

  const handleOpenCreate = () => {
    setEditingTaskId(null);
    setFormData({
      title: '',
      description: '',
      subject_name: 'Computer Networks',
      due_date: '',
      priority: 'medium',
      category: 'college'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (task) => {
    setEditingTaskId(task.id);
    setFormData({
      title: task.title,
      description: task.description || '',
      subject_name: task.subject_name || 'General',
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      priority: task.priority || 'medium',
      category: task.category || 'college'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTaskId) {
        await collegeAPI.updateTask(editingTaskId, formData);
      } else {
        await collegeAPI.createTask(formData);
      }
      setShowModal(false);
      loadTasks();
    } catch (err) {
      alert('Failed to save task');
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await collegeAPI.updateTaskStatus(id, nextStatus);
      loadTasks();
    } catch (err) {
      console.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await collegeAPI.deleteTask(id);
      loadTasks();
    } catch (err) {
      console.error('Failed to delete task');
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Task Management 📋</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Organize tasks by subject, priority, due date & completion status.</p>
        </div>
        <button onClick={handleOpenCreate} className="btn btn-primary">
          <Plus size={18} /> Add New Task
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative', minWidth: '220px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
          <Search size={18} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Status:</span>
          <select className="form-control" style={{ width: 'auto' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Priority:</span>
          <select className="form-control" style={{ width: 'auto' }} value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {tasks.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <CheckSquare size={40} style={{ opacity: 0.5, marginBottom: '0.75rem' }} />
            <p>No tasks found matching filters.</p>
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="glass-card" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              opacity: task.status === 'completed' ? 0.65 : 1,
              borderLeft: `4px solid ${task.priority === 'high' ? 'var(--accent-danger)' : (task.priority === 'medium' ? 'var(--accent-warning)' : 'var(--accent-primary)')}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                  onClick={() => toggleStatus(task.id, task.status)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: task.status === 'completed' ? 'var(--accent-success)' : 'var(--text-muted)' }}
                >
                  <CheckCircle size={26} />
                </button>
                <div>
                  <h4 style={{ fontSize: '1.05rem', textDecoration: task.status === 'completed' ? 'line-through' : 'none' }}>
                    {task.title}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{task.description}</p>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} /> Due: {task.due_date ? task.due_date.split('T')[0] : 'No Date'}
                    </span>
                    <span className="badge badge-primary">
                      Subject: {task.subject_name || 'General'}
                    </span>
                    <span className={`badge ${task.priority === 'high' ? 'badge-danger' : 'badge-warning'}`}>
                      {task.priority} priority
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => handleOpenEdit(task)} className="btn btn-secondary btn-sm">
                  <Edit2 size={14} /> Edit
                </button>
                <button onClick={() => handleDelete(task.id)} className="btn btn-secondary btn-sm" style={{ color: 'var(--accent-danger)' }}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Task Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h3 style={{ marginBottom: '1.5rem' }}>{editingTaskId ? 'Edit Task' : 'Add New Task'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Task Title *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Operating Systems Lab Assignment 4"
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
                  placeholder="Details or notes..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label>Subject Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Computer Networks"
                    value={formData.subject_name}
                    onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <select className="form-control" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingTaskId ? 'Update Task' : 'Save Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
