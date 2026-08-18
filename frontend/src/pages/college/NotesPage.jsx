import React, { useState, useEffect } from 'react';
import { collegeAPI, aiAPI } from '../../services/api';
import { FileText, Plus, Sparkles, Trash2, Edit2, Search, Filter, AlertCircle, Loader2 } from 'lucide-react';

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [summaryModal, setSummaryModal] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    tags: ''
  });

  useEffect(() => {
    loadNotes();
  }, [search, categoryFilter]);

  const loadNotes = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const params = {};
      if (search) params.search = search;
      if (categoryFilter !== 'all') params.subject = categoryFilter;

      const res = await collegeAPI.getNotes(params);
      setNotes(res.data.notes || []);
    } catch (err) {
      console.error('Failed to load notes:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to load notes from database.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingNoteId(null);
    setFormData({
      title: '',
      content: '',
      category: 'General',
      tags: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (note) => {
    setEditingNoteId(note.id);
    setFormData({
      title: note.title || '',
      content: note.content || '',
      category: note.category || note.subject || note.subject_name || 'General',
      tags: note.tags || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingNoteId) {
        await collegeAPI.updateNote(editingNoteId, {
          title: formData.title,
          content: formData.content,
          category: formData.category,
          subject: formData.category,
          tags: formData.tags
        });
      } else {
        await collegeAPI.createNote({
          title: formData.title,
          content: formData.content,
          category: formData.category,
          subject: formData.category,
          tags: formData.tags
        });
      }
      setShowModal(false);
      loadNotes();
    } catch (err) {
      console.error('Save Note Error:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to save note.';
      alert(`Error saving note: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await collegeAPI.deleteNote(id);
      loadNotes();
    } catch (err) {
      console.error('Failed to delete note:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to delete note.';
      alert(`Error deleting note: ${msg}`);
    }
  };

  const handleAiSummarize = async (note) => {
    setLoadingSummary(true);
    try {
      const res = await aiAPI.summarizeNote({ title: note.title, content: note.content });
      setSummaryModal({
        noteTitle: note.title,
        summary: res.data.summary,
        keyTakeaways: res.data.keyTakeaways || [],
        flashcards: res.data.flashcards || []
      });
    } catch (err) {
      alert('Failed to generate AI summary');
    } finally {
      setLoadingSummary(false);
    }
  };

  // Extract unique categories for filter dropdown
  const categories = Array.from(new Set(notes.map(n => n.category || n.subject || 'General'))).filter(Boolean);

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Academic Notes & AI Summarizer 📝</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Store lecture notes and instantly generate AI summaries & interactive flashcards.</p>
        </div>
        <button onClick={handleOpenCreate} className="btn btn-primary">
          <Plus size={18} /> Add New Note
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative', minWidth: '220px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search notes by title, content or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
          <Search size={18} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Category:</span>
          <select className="form-control" style={{ width: 'auto' }} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All Categories</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Alert State */}
      {errorMessage && (
        <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle size={20} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 1rem', color: 'var(--accent-primary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading notes from Firestore...</p>
        </div>
      ) : notes.length === 0 ? (
        /* Empty State */
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <FileText size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Notes Found</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            {search || categoryFilter !== 'all' ? 'No notes matched your search criteria.' : 'You have not added any lecture notes yet.'}
          </p>
          <button onClick={handleOpenCreate} className="btn btn-primary btn-sm">
            <Plus size={16} /> Create Your First Note
          </button>
        </div>
      ) : (
        /* Notes Grid */
        <div className="grid-2">
          {notes.map(note => (
            <div key={note.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>{note.title}</h3>
                  <span className="badge badge-primary">{note.category || note.subject || 'General'}</span>
                </div>

                <p style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-line',
                  maxHeight: '140px',
                  overflow: 'hidden'
                }}>
                  {note.content}
                </p>

                {note.tags && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {note.tags.split(',').map((t, idx) => (
                      <span key={idx} className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                        #{t.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                <button
                  onClick={() => handleAiSummarize(note)}
                  className="btn btn-primary btn-sm"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)' }}
                  disabled={loadingSummary}
                >
                  <Sparkles size={14} /> AI Summarize & Flashcards
                </button>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleOpenEdit(note)} className="btn btn-secondary btn-sm" title="Edit Note">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(note.id)} className="btn btn-secondary btn-sm" style={{ color: 'var(--accent-danger)' }} title="Delete Note">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Note Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h3 style={{ marginBottom: '1.5rem' }}>{editingNoteId ? 'Edit Academic Note' : 'Add Academic Note'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Note Title *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Operating Systems - Deadlock Avoidance"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Note Content *</label>
                <textarea
                  className="form-control"
                  rows={6}
                  placeholder="Type or paste your detailed lecture notes here..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Category / Subject</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. OS, DBMS, Networks"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Tags (comma separated)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="gate, college, quiz"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : (editingNoteId ? 'Update Note' : 'Save Note')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Summary Modal */}
      {summaryModal && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '720px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Sparkles color="#c084fc" size={24} />
              <h3 style={{ fontSize: '1.4rem', margin: 0 }}>AI Summary: {summaryModal.noteTitle}</h3>
            </div>

            <div style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>Executive Summary</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {summaryModal.summary}
              </p>
            </div>

            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>🎴 Auto-Generated Revision Flashcards</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {summaryModal.flashcards.map(fc => (
                <div key={fc.id} style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#818cf8', marginBottom: '0.35rem' }}>Q: {fc.question}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>A: {fc.answer}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn btn-primary" onClick={() => setSummaryModal(null)}>Close Summary</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
