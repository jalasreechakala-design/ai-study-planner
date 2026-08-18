import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { BookOpen, Plus, Trash2, Edit3, Link as LinkIcon, Search, Eye, X, Globe, ExternalLink, ShieldCheck, Check, AlertCircle, Play, FileText, FileCode, Award, Book } from 'lucide-react';

export default function ManageMaterialsPage() {
  const [resources, setResources] = useState([]);
  const [exams, setExams] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [allTopics, setAllTopics] = useState([]);

  // Cascading dropdown states for Add/Edit Form
  const [formSubjects, setFormSubjects] = useState([]);
  const [formTopics, setFormTopics] = useState([]);

  // Filter states
  const [search, setSearch] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [validationError, setValidationError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    exam_id: '',
    subject_id: '',
    topic_id: '',
    resource_type: 'video',
    source_name: 'YouTube',
    url: '',
    difficulty: 'intermediate',
    description: '',
    is_active: 1
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rRes, eRes, sRes, tRes] = await Promise.all([
        adminAPI.getResources(),
        adminAPI.getExams(),
        adminAPI.getSubjects(),
        adminAPI.getTopics()
      ]);

      setResources(rRes.data.resources || rRes.data.materials || []);
      const exList = eRes.data.exams || [];
      setExams(exList);
      setAllSubjects(sRes.data.subjects || []);
      setAllTopics(tRes.data.topics || []);

      if (exList.length > 0 && !formData.exam_id) {
        setFormData(prev => ({ ...prev, exam_id: exList[0].id }));
      }
    } catch (err) {
      console.error('Failed to load admin resource manager data');
    }
  };

  // Handle Form Exam Change (Cascading Subjects)
  const handleFormExamChange = (examId) => {
    const numExamId = Number(examId);
    setFormData(prev => ({ ...prev, exam_id: numExamId, subject_id: '', topic_id: '' }));
    const filteredSubs = allSubjects.filter(s => s.exam_id === numExamId);
    setFormSubjects(filteredSubs);
    setFormTopics([]);
  };

  // Handle Form Subject Change (Cascading Topics)
  const handleFormSubjectChange = (subjectId) => {
    const numSubId = Number(subjectId);
    setFormData(prev => ({ ...prev, subject_id: numSubId, topic_id: '' }));
    const filteredTops = allTopics.filter(t => t.subject_id === numSubId);
    setFormTopics(filteredTops);
  };

  const openAddModal = () => {
    setEditingId(null);
    setValidationError('');
    const firstExamId = exams[0]?.id || '';
    const initialSubs = allSubjects.filter(s => s.exam_id === Number(firstExamId));

    setFormData({
      title: '',
      exam_id: firstExamId,
      subject_id: '',
      topic_id: '',
      resource_type: 'video',
      source_name: 'YouTube',
      url: '',
      difficulty: 'intermediate',
      description: '',
      is_active: 1
    });
    setFormSubjects(initialSubs);
    setFormTopics([]);
    setShowModal(true);
  };

  const openEditModal = (resObj) => {
    setEditingId(resObj.id);
    setValidationError('');
    const examId = resObj.exam_id || '';
    const subId = resObj.subject_id || '';

    const initialSubs = allSubjects.filter(s => s.exam_id === Number(examId));
    const initialTops = allTopics.filter(t => t.subject_id === Number(subId));

    setFormData({
      title: resObj.title || '',
      exam_id: examId,
      subject_id: subId,
      topic_id: resObj.topic_id || '',
      resource_type: resObj.resource_type || resObj.material_type || 'video',
      source_name: resObj.source_name || 'YouTube',
      url: resObj.url || resObj.file_url || '',
      difficulty: resObj.difficulty || 'intermediate',
      description: resObj.description || '',
      is_active: resObj.is_active !== undefined ? resObj.is_active : 1
    });

    setFormSubjects(initialSubs);
    setFormTopics(initialTops);
    setShowModal(true);
  };

  const handleSaveResource = async (e) => {
    e.preventDefault();
    setValidationError('');

    const targetUrl = formData.url.trim();

    // URL Validation Rule
    if (!targetUrl) {
      setValidationError('Resource URL is required.');
      return;
    }
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      setValidationError('Please enter a valid educational URL starting with http:// or https://');
      return;
    }

    try {
      if (editingId) {
        await adminAPI.updateResource(editingId, formData);
      } else {
        await adminAPI.createResource(formData);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      setValidationError(err.response?.data?.error || 'Failed to save resource.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    try {
      await adminAPI.deleteResource(id);
      loadData();
    } catch (err) {
      alert('Failed to delete resource');
    }
  };

  const handleToggleActive = async (resObj) => {
    try {
      await adminAPI.updateResource(resObj.id, {
        ...resObj,
        is_active: resObj.is_active ? 0 : 1
      });
      loadData();
    } catch (err) {
      alert('Failed to toggle status');
    }
  };

  // Filtered resources list for Admin view
  const filteredResources = resources.filter(r => {
    if (selectedExam && r.exam_id !== Number(selectedExam)) return false;
    if (selectedSubject && r.subject_id !== Number(selectedSubject)) return false;
    if (selectedTopic && r.topic_id !== Number(selectedTopic)) return false;
    if (selectedType && (r.resource_type || r.material_type) !== selectedType) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = r.title && r.title.toLowerCase().includes(q);
      const matchSource = r.source_name && r.source_name.toLowerCase().includes(q);
      const matchDesc = r.description && r.description.toLowerCase().includes(q);
      if (!matchTitle && !matchSource && !matchDesc) return false;
    }
    return true;
  });

  const totalResources = resources.length;
  const activeCount = resources.filter(r => r.is_active !== 0).length;
  const inactiveCount = totalResources - activeCount;
  const mostClicked = resources.length ? [...resources].sort((a, b) => (b.clicks_count || 0) - (a.clicks_count || 0))[0] : null;

  return (
    <div className="page-wrapper">
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span className="badge badge-primary" style={{ marginBottom: '0.4rem' }}>
            <ShieldCheck size={13} /> Admin Curation Console
          </span>
          <h1 style={{ fontSize: '1.85rem', marginBottom: '0.25rem' }}>Resource Manager</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Curate, edit, publish and validate high-quality external educational links for exam roadmaps.
          </p>
        </div>

        <button onClick={openAddModal} className="btn btn-primary">
          <Plus size={16} /> Add Learning Resource
        </button>
      </div>

      {/* Admin Statistics Row */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <span style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Resources</span>
          <h2 style={{ fontSize: '1.6rem', marginTop: '0.2rem', color: 'var(--accent-primary)' }}>{totalResources}</h2>
        </div>
        <div className="card">
          <span style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Published Active</span>
          <h2 style={{ fontSize: '1.6rem', marginTop: '0.2rem', color: 'var(--success)' }}>{activeCount}</h2>
        </div>
        <div className="card">
          <span style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Draft / Disabled</span>
          <h2 style={{ fontSize: '1.6rem', marginTop: '0.2rem', color: 'var(--warning)' }}>{inactiveCount}</h2>
        </div>
        <div className="card">
          <span style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Top Clicked Resource</span>
          <h4 style={{ fontSize: '0.9rem', marginTop: '0.25rem', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {mostClicked ? mostClicked.title : 'N/A'}
          </h4>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 2, position: 'relative', minWidth: '200px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by title, source, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.4rem' }}
            />
            <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          <select className="form-control" style={{ flex: 1, minWidth: '130px' }} value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)}>
            <option value="">All Exams</option>
            {exams.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>

          <select className="form-control" style={{ flex: 1, minWidth: '130px' }} value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
            <option value="">All Types</option>
            <option value="video">Video</option>
            <option value="article">Article</option>
            <option value="practice">Practice</option>
            <option value="reference">Reference</option>
            <option value="previous_paper">Previous Paper</option>
            <option value="documentation">Documentation</option>
          </select>
        </div>
      </div>

      {/* Resources Data Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--surface-secondary)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700 }}>RESOURCE TITLE</th>
              <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700 }}>TYPE</th>
              <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700 }}>SOURCE</th>
              <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700 }}>DIFFICULTY</th>
              <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700 }}>VISITS</th>
              <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700 }}>STATUS</th>
              <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredResources.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No curated resources found. Click "+ Add Learning Resource" to publish verified external links.
                </td>
              </tr>
            ) : (
              filteredResources.map(resObj => (
                <tr key={resObj.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{resObj.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      <a href={resObj.url || resObj.file_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        {resObj.url || resObj.file_url} <ExternalLink size={11} />
                      </a>
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className="badge badge-secondary" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>
                      {resObj.resource_type || resObj.material_type || 'video'}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.8125rem' }}>
                    {resObj.source_name || 'YouTube'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.8125rem', textTransform: 'capitalize' }}>
                    {resObj.difficulty || 'Intermediate'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.8125rem' }}>
                    👁️ {resObj.clicks_count || 0}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <button
                      onClick={() => handleToggleActive(resObj)}
                      className={`badge ${resObj.is_active !== 0 ? 'badge-success' : 'badge-danger'}`}
                      style={{ cursor: 'pointer', border: 'none' }}
                    >
                      {resObj.is_active !== 0 ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                      <button onClick={() => openEditModal(resObj)} className="btn btn-secondary btn-sm" style={{ padding: '0.35rem 0.6rem' }} title="Edit Resource">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => handleDelete(resObj.id)} className="btn btn-secondary btn-sm" style={{ padding: '0.35rem 0.6rem', color: 'var(--danger)' }} title="Delete Resource">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Resource Modal with Cascading Dropdowns */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '620px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>
                {editingId ? 'Edit Learning Resource' : 'Add New Learning Resource'}
              </h3>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary btn-sm" style={{ padding: '0.35rem' }}>
                <X size={16} />
              </button>
            </div>

            {validationError && (
              <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} /> {validationError}
              </div>
            )}

            <form onSubmit={handleSaveResource}>
              {/* Cascading Exam & Subject Row */}
              <div className="grid-2" style={{ gap: '0.85rem' }}>
                <div className="form-group">
                  <label>Exam *</label>
                  <select
                    className="form-control"
                    value={formData.exam_id}
                    onChange={(e) => handleFormExamChange(e.target.value)}
                    required
                  >
                    <option value="">[Select Exam]</option>
                    {exams.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Subject *</label>
                  <select
                    className="form-control"
                    value={formData.subject_id}
                    onChange={(e) => handleFormSubjectChange(e.target.value)}
                  >
                    <option value="">[Select Subject]</option>
                    {formSubjects.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                </div>
              </div>

              {/* Topic Row */}
              <div className="form-group">
                <label>Topic</label>
                <select
                  className="form-control"
                  value={formData.topic_id}
                  onChange={(e) => setFormData({ ...formData, topic_id: e.target.value })}
                >
                  <option value="">[Select Topic]</option>
                  {formTopics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>

              {/* Resource Type & Difficulty */}
              <div className="grid-2" style={{ gap: '0.85rem' }}>
                <div className="form-group">
                  <label>Resource Type *</label>
                  <select
                    className="form-control"
                    value={formData.resource_type}
                    onChange={(e) => setFormData({ ...formData, resource_type: e.target.value })}
                    required
                  >
                    <option value="video">Video</option>
                    <option value="article">Article</option>
                    <option value="documentation">Documentation</option>
                    <option value="practice">Practice</option>
                    <option value="reference">Reference</option>
                    <option value="previous_paper">Previous Paper</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Difficulty</label>
                  <select
                    className="form-control"
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              {/* Title */}
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. TCP Congestion Control Algorithms"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              {/* Source & URL */}
              <div className="grid-2" style={{ gap: '0.85rem' }}>
                <div className="form-group">
                  <label>Source Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="YouTube / GeeksforGeeks / NPTEL / MIT OCW"
                    value={formData.source_name}
                    onChange={(e) => setFormData({ ...formData, source_name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Resource URL *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="https://..."
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Brief summary of key concepts covered in this resource..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Resource</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

