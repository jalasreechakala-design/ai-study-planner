import React, { useState, useEffect } from 'react';
import { adminAPI, competitiveAPI } from '../../services/api';
import { Compass, Plus, Edit2, Trash2, Search, BookOpen, Layers, CheckCircle2, XCircle, ChevronRight, CornerDownRight, AlertTriangle, X } from 'lucide-react';

export default function ManageExamsPage() {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [selectedExamRoadmap, setSelectedExamRoadmap] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals & Forms
  const [showExamModal, setShowExamModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [showSubtopicModal, setShowSubtopicModal] = useState(false);

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', text: '', onConfirm: null });

  // Form states
  const [examForm, setExamForm] = useState({ id: null, title: '', code: '', category: 'Engineering', description: '', duration: '3 Hours', eligibility: 'Graduates', examDate: '' });
  const [subjectForm, setSubjectForm] = useState({ examId: 1, title: '', code: '', weightage: '10%' });
  const [topicForm, setTopicForm] = useState({ examId: 1, subjectId: '', title: '', description: '', estimatedHours: 3, difficulty: 'intermediate' });
  const [subtopicForm, setSubtopicForm] = useState({ examId: 1, subjectId: '', topicId: '', title: '', description: '' });

  useEffect(() => {
    loadExams();
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      loadRoadmap(selectedExamId);
    }
  }, [selectedExamId]);

  const loadExams = async () => {
    try {
      const res = await adminAPI.getExams();
      const list = res.data.exams || [];
      setExams(list);
      if (list.length > 0 && !selectedExamId) {
        setSelectedExamId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load exams', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRoadmap = async (examId) => {
    try {
      const res = await competitiveAPI.getRoadmap(examId);
      setSelectedExamRoadmap(res.data);
    } catch (err) {
      console.error('Failed to load exam roadmap', err);
    }
  };

  // Handlers
  const handleSaveExam = async (e) => {
    e.preventDefault();
    try {
      if (examForm.id) {
        await adminAPI.updateExam(examForm.id, examForm);
      } else {
        await adminAPI.createExam(examForm);
      }
      setShowExamModal(false);
      setExamForm({ id: null, title: '', code: '', category: 'Engineering', description: '', duration: '3 Hours', eligibility: 'Graduates', examDate: '' });
      loadExams();
    } catch (err) {
      alert('Failed to save exam');
    }
  };

  const handleDeleteExam = (id, name) => {
    setConfirmModal({
      open: true,
      title: 'Delete Exam Stream?',
      text: `Are you sure you want to delete exam "${name}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await adminAPI.deleteExam(id);
          setSelectedExamId(null);
          loadExams();
        } catch (err) {
          alert('Failed to delete exam');
        }
      }
    });
  };

  const handleSaveSubject = async (e) => {
    e.preventDefault();
    try {
      if (subjectForm.id) {
        await adminAPI.updateSubject(subjectForm.id, {
          exam_id: selectedExamId,
          examId: selectedExamId,
          title: subjectForm.title,
          code: subjectForm.code,
          weightage: subjectForm.weightage
        });
      } else {
        await adminAPI.createSubject({
          exam_id: selectedExamId,
          examId: selectedExamId,
          title: subjectForm.title,
          code: subjectForm.code,
          weightage: subjectForm.weightage
        });
      }
      setShowSubjectModal(false);
      setSubjectForm({ id: null, examId: selectedExamId, title: '', code: '', weightage: '10%' });
      loadRoadmap(selectedExamId);
    } catch (err) {
      alert('Failed to save subject');
    }
  };

  const handleDeleteSubject = (subjectId, subjectTitle) => {
    setConfirmModal({
      open: true,
      title: 'Delete Subject?',
      text: `Are you sure you want to delete subject "${subjectTitle}" from this exam?`,
      onConfirm: async () => {
        try {
          await adminAPI.deleteSubject(subjectId, selectedExamId);
          loadRoadmap(selectedExamId);
        } catch (err) {
          alert('Failed to delete subject');
        }
      }
    });
  };

  const handleSaveTopic = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createTopic({
        exam_id: selectedExamId,
        examId: selectedExamId,
        subject_id: topicForm.subjectId,
        subjectId: topicForm.subjectId,
        title: topicForm.title,
        description: topicForm.description,
        estimatedHours: topicForm.estimatedHours,
        difficulty: topicForm.difficulty
      });
      setShowTopicModal(false);
      setTopicForm({ examId: selectedExamId, subjectId: '', title: '', description: '', estimatedHours: 3, difficulty: 'intermediate' });
      loadRoadmap(selectedExamId);
    } catch (err) {
      alert('Failed to add topic');
    }
  };

  const handleDeleteTopic = (topicId, topicTitle, subjectId) => {
    setConfirmModal({
      open: true,
      title: 'Delete Topic?',
      text: `Are you sure you want to delete topic "${topicTitle}"?`,
      onConfirm: async () => {
        try {
          await adminAPI.deleteTopic(topicId, selectedExamId, subjectId);
          loadRoadmap(selectedExamId);
        } catch (err) {
          alert('Failed to delete topic');
        }
      }
    });
  };

  const handleSaveSubtopic = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createSubtopic({
        examId: selectedExamId,
        subjectId: subtopicForm.subjectId,
        topic_id: subtopicForm.topicId,
        topicId: subtopicForm.topicId,
        title: subtopicForm.title,
        description: subtopicForm.description
      });
      setShowSubtopicModal(false);
      setSubtopicForm({ examId: selectedExamId, subjectId: '', topicId: '', title: '', description: '' });
      loadRoadmap(selectedExamId);
    } catch (err) {
      alert('Failed to add subtopic');
    }
  };

  const handleDeleteSubtopic = (subtopicId, subtopicTitle, subjectId, topicId) => {
    setConfirmModal({
      open: true,
      title: 'Delete Subtopic?',
      text: `Are you sure you want to delete subtopic "${subtopicTitle}"?`,
      onConfirm: async () => {
        try {
          await adminAPI.deleteSubtopic(subtopicId, selectedExamId, subjectId, topicId);
          loadRoadmap(selectedExamId);
        } catch (err) {
          alert('Failed to delete subtopic');
        }
      }
    });
  };

  const filteredExams = exams.filter(e =>
    (e.title || e.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.code || e.shortName || '').toLowerCase().includes(search.toLowerCase())
  );

  const activeExamDoc = exams.find(e => String(e.id) === String(selectedExamId));

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span className="badge badge-primary" style={{ marginBottom: '0.4rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <Compass size={13} /> Firestore Hierarchy Management
          </span>
          <h1 style={{ fontSize: '1.85rem', margin: 0 }}>Exams & Roadmap Hierarchy 🧭</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
            Manage exam streams, subjects, topics, subtopics, and visual roadmaps dynamically.
          </p>
        </div>

        <button onClick={() => {
          setExamForm({ id: null, title: '', code: '', category: 'Engineering', description: '', duration: '3 Hours', eligibility: 'Graduates', examDate: '' });
          setShowExamModal(true);
        }} className="btn btn-primary">
          <Plus size={16} /> Add New Exam Stream
        </button>
      </div>

      {/* Main Split Interface */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Column: Exams Directory List */}
        <div className="glass-card">
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-primary)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search exams..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filteredExams.map(exam => {
              const isSelected = String(exam.id) === String(selectedExamId);
              return (
                <div
                  key={exam.id}
                  onClick={() => setSelectedExamId(exam.id)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    background: isSelected ? 'var(--accent-primary-light)' : 'var(--bg-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '0.9rem', margin: 0, color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                      {exam.title || exam.name}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Code: {exam.code || exam.shortName} • {exam.category}
                    </span>
                  </div>

                  <ChevronRight size={16} color={isSelected ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Exam Details & Visual Hierarchy Tree */}
        <div>
          {activeExamDoc ? (
            <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h2 style={{ fontSize: '1.4rem', margin: 0 }}>{activeExamDoc.title || activeExamDoc.name}</h2>
                    <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>{activeExamDoc.code || activeExamDoc.shortName}</span>
                    <span className={`badge ${activeExamDoc.isActive !== false ? 'badge-success' : 'badge-danger'}`}>
                      {activeExamDoc.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                    {activeExamDoc.description || 'Comprehensive exam roadmap and syllabus structure.'}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => {
                    setExamForm({
                      id: activeExamDoc.id,
                      title: activeExamDoc.title || activeExamDoc.name,
                      code: activeExamDoc.code || activeExamDoc.shortName,
                      category: activeExamDoc.category || 'Engineering',
                      description: activeExamDoc.description || '',
                      duration: activeExamDoc.duration || '3 Hours',
                      eligibility: activeExamDoc.eligibility || 'Graduates',
                      examDate: activeExamDoc.examDate || ''
                    });
                    setShowExamModal(true);
                  }} className="btn btn-sm btn-secondary">
                    <Edit2 size={14} /> Edit Exam
                  </button>

                  <button onClick={() => handleDeleteExam(activeExamDoc.id, activeExamDoc.title || activeExamDoc.name)} className="btn btn-sm btn-danger">
                    <Trash2 size={14} /> Delete Exam
                  </button>

                  <button onClick={() => {
                    setSubjectForm({ examId: selectedExamId, title: '', code: '', weightage: '10%' });
                    setShowSubjectModal(true);
                  }} className="btn btn-sm btn-primary">
                    <Plus size={14} /> Add Subject
                  </button>
                </div>
              </div>

              {/* Visual Roadmap Hierarchy Tree Viewer */}
              <div style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Layers size={16} color="var(--accent-primary)" /> Visual Roadmap Hierarchy Tree
                </h3>

                {!selectedExamRoadmap || !selectedExamRoadmap.subjects || selectedExamRoadmap.subjects.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>No subjects added to this exam stream yet.</p>
                    <button onClick={() => setShowSubjectModal(true)} className="btn btn-sm btn-primary" style={{ marginTop: '0.75rem' }}>
                      <Plus size={14} /> Add First Subject
                    </button>
                  </div>
                ) : (
                  <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    <div style={{ fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>
                      {activeExamDoc.code || activeExamDoc.title} (Target Exam Stream)
                    </div>

                    {selectedExamRoadmap.subjects.map((sub, sIdx) => {
                      const isLastSub = sIdx === selectedExamRoadmap.subjects.length - 1;
                      const subPrefix = isLastSub ? '└── ' : '├── ';
                      const topicBranchPrefix = isLastSub ? '    ' : '│   ';

                      return (
                        <div key={sub.id} style={{ marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(37, 99, 235, 0.05)', padding: '0.35rem 0.6rem', borderRadius: '6px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {subPrefix}{sub.name || sub.title} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({sub.code || 'CODE'})</span>
                            </span>

                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button onClick={() => {
                                setSubjectForm({
                                  id: sub.id,
                                  examId: selectedExamId,
                                  title: sub.name || sub.title || '',
                                  code: sub.code || '',
                                  weightage: sub.weightage || '10%'
                                });
                                setShowSubjectModal(true);
                              }} className="btn btn-sm btn-secondary" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}>
                                Edit
                              </button>

                              <button onClick={() => {
                                setTopicForm({ examId: selectedExamId, subjectId: sub.id, title: '', description: '', estimatedHours: 3, difficulty: 'intermediate' });
                                setShowTopicModal(true);
                              }} className="btn btn-sm btn-secondary" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}>
                                + Topic
                              </button>

                              <button onClick={() => handleDeleteSubject(sub.id, sub.name || sub.title)} className="btn btn-sm btn-danger" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}>
                                Delete
                              </button>
                            </div>
                          </div>

                          {/* Topics List */}
                          {(sub.topics || []).map((top, tIdx) => {
                            const isLastTop = tIdx === (sub.topics || []).length - 1;
                            const topPrefix = isLastTop ? '└── ' : '├── ';

                            return (
                              <div key={top.id} style={{ marginLeft: '1rem', marginTop: '0.3rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.2rem 0.4rem' }}>
                                  <span style={{ color: 'var(--text-secondary)' }}>
                                    {topicBranchPrefix}{topPrefix}{top.name || top.title} <span style={{ fontSize: '0.75rem', color: 'var(--accent-warning)' }}>[{top.difficulty || 'medium'}]</span>
                                  </span>

                                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    <button onClick={() => {
                                      setSubtopicForm({ examId: selectedExamId, subjectId: sub.id, topicId: top.id, title: '', description: '' });
                                      setShowSubtopicModal(true);
                                    }} className="btn btn-sm btn-secondary" style={{ padding: '0.1rem 0.35rem', fontSize: '0.65rem' }}>
                                      + Subtopic
                                    </button>

                                    <button onClick={() => handleDeleteTopic(top.id, top.name || top.title, sub.id)} className="btn btn-sm btn-danger" style={{ padding: '0.1rem 0.35rem', fontSize: '0.65rem' }}>
                                      Delete
                                    </button>
                                  </div>
                                </div>

                                {/* Subtopics List */}
                                {(top.subtopics || []).map((stop, stIdx) => (
                                  <div key={stop.id} style={{ marginLeft: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.15rem 0.4rem' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                      └── {stop.name || stop.title}
                                    </span>
                                    <button onClick={() => handleDeleteSubtopic(stop.id, stop.name || stop.title, sub.id, top.id)} className="btn btn-sm btn-danger" style={{ padding: '0.05rem 0.3rem', fontSize: '0.6rem' }}>
                                      Delete
                                    </button>
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-secondary)' }}>Select an exam stream to view and manage its roadmap hierarchy.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Exam Modal */}
      {showExamModal && (
        <div className="modal-overlay" onClick={() => setShowExamModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{examForm.id ? 'Edit Exam Stream' : 'Add New Exam Stream'}</h3>
              <button onClick={() => setShowExamModal(false)} className="btn btn-secondary btn-sm" style={{ padding: '0.3rem' }}><X size={16} /></button>
            </div>

            <form onSubmit={handleSaveExam}>
              <div className="form-group">
                <label>Exam Full Title / Name *</label>
                <input type="text" className="form-control" value={examForm.title} onChange={(e) => setExamForm({ ...examForm, title: e.target.value })} placeholder="e.g. GATE CS & IT" required />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Exam Short Code *</label>
                  <input type="text" className="form-control" value={examForm.code} onChange={(e) => setExamForm({ ...examForm, code: e.target.value })} placeholder="e.g. GATE_CS" required />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select className="form-control" value={examForm.category} onChange={(e) => setExamForm({ ...examForm, category: e.target.value })}>
                    <option value="Engineering">Engineering</option>
                    <option value="Medical Entrance">Medical Entrance</option>
                    <option value="Civil Services">Civil Services</option>
                    <option value="Banking">Banking</option>
                    <option value="Staff Selection">Staff Selection</option>
                    <option value="Management">Management</option>
                    <option value="Railways">Railways</option>
                    <option value="State PSC">State PSC</option>
                    <option value="Lectureship & JRF">Lectureship & JRF</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea className="form-control" rows="3" value={examForm.description} onChange={(e) => setExamForm({ ...examForm, description: e.target.value })} placeholder="Brief description of the examination..." />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowExamModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Exam Stream</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {showSubjectModal && (
        <div className="modal-overlay" onClick={() => setShowSubjectModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Add Subject</h3>
              <button onClick={() => setShowSubjectModal(false)} className="btn btn-secondary btn-sm" style={{ padding: '0.3rem' }}><X size={16} /></button>
            </div>

            <form onSubmit={handleSaveSubject}>
              <div className="form-group">
                <label>Subject Title / Name *</label>
                <input type="text" className="form-control" value={subjectForm.title} onChange={(e) => setSubjectForm({ ...subjectForm, title: e.target.value })} placeholder="e.g. Computer Networks" required />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Subject Code</label>
                  <input type="text" className="form-control" value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} placeholder="e.g. CN" />
                </div>
                <div className="form-group">
                  <label>Exam Weightage %</label>
                  <input type="text" className="form-control" value={subjectForm.weightage} onChange={(e) => setSubjectForm({ ...subjectForm, weightage: e.target.value })} placeholder="e.g. 10%" />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSubjectModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Subject</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Topic Modal */}
      {showTopicModal && (
        <div className="modal-overlay" onClick={() => setShowTopicModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Add Topic</h3>
              <button onClick={() => setShowTopicModal(false)} className="btn btn-secondary btn-sm" style={{ padding: '0.3rem' }}><X size={16} /></button>
            </div>

            <form onSubmit={handleSaveTopic}>
              <div className="form-group">
                <label>Topic Name *</label>
                <input type="text" className="form-control" value={topicForm.title} onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })} placeholder="e.g. TCP Congestion Control" required />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Estimated Study Hours</label>
                  <input type="number" className="form-control" value={topicForm.estimatedHours} onChange={(e) => setTopicForm({ ...topicForm, estimatedHours: e.target.value })} min="1" max="50" />
                </div>
                <div className="form-group">
                  <label>Difficulty Tier</label>
                  <select className="form-control" value={topicForm.difficulty} onChange={(e) => setTopicForm({ ...topicForm, difficulty: e.target.value })}>
                    <option value="easy">Easy</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea className="form-control" rows="2" value={topicForm.description} onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })} placeholder="Topic summary..." />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTopicModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Topic</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subtopic Modal */}
      {showSubtopicModal && (
        <div className="modal-overlay" onClick={() => setShowSubtopicModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Add Subtopic</h3>
              <button onClick={() => setShowSubtopicModal(false)} className="btn btn-secondary btn-sm" style={{ padding: '0.3rem' }}><X size={16} /></button>
            </div>

            <form onSubmit={handleSaveSubtopic}>
              <div className="form-group">
                <label>Subtopic Name *</label>
                <input type="text" className="form-control" value={subtopicForm.title} onChange={(e) => setSubtopicForm({ ...subtopicForm, title: e.target.value })} placeholder="e.g. Slow Start Algorithm" required />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSubtopicModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Subtopic</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.open && (
        <div className="modal-overlay" onClick={() => setConfirmModal({ ...confirmModal, open: false })}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--accent-danger)' }}>
              <AlertTriangle size={22} />
              <h3 style={{ fontSize: '1.15rem', margin: 0 }}>{confirmModal.title}</h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              {confirmModal.text}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setConfirmModal({ ...confirmModal, open: false })}>Cancel</button>
              <button className="btn btn-danger" onClick={() => {
                confirmModal.onConfirm();
                setConfirmModal({ ...confirmModal, open: false });
              }}>Confirm Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
