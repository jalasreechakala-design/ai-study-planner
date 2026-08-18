import React, { useState, useEffect } from 'react';
import { collegeAPI } from '../../services/api';
import { Calculator, Plus, Edit2, Trash2, Award, AlertCircle, Loader2, BookOpen } from 'lucide-react';

const GRADE_POINTS = {
  'S': 10.0,
  'A+': 10.0,
  'A': 9.0,
  'B+': 8.0,
  'B': 7.0,
  'C': 6.0,
  'D': 5.0,
  'F': 0.0
};

export default function CgpaCalculatorPage() {
  const [cgpaData, setCgpaData] = useState({ records: [], cumulativeCGPA: '0.00', totalCredits: 0, semesterSgpaMap: {} });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    semester: 'Semester 1',
    subject_name: '',
    courseCode: '',
    credits: 4,
    grade: 'A',
    gpa: 9.0
  });

  useEffect(() => {
    loadCgpa();
  }, []);

  const loadCgpa = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await collegeAPI.getCgpa();
      setCgpaData(res.data || { records: [], cumulativeCGPA: '0.00', totalCredits: 0, semesterSgpaMap: {} });
    } catch (err) {
      console.error('Failed to load CGPA records:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to load CGPA records.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (g) => {
    const calculatedGpa = GRADE_POINTS[g] !== undefined ? GRADE_POINTS[g] : 9.0;
    setFormData({ ...formData, grade: g, gpa: calculatedGpa });
  };

  const handleOpenCreate = () => {
    setEditingRecordId(null);
    setFormData({
      semester: selectedSemester !== 'all' ? selectedSemester : 'Semester 1',
      subject_name: '',
      courseCode: '',
      credits: 4,
      grade: 'A',
      gpa: 9.0
    });
    setShowModal(true);
  };

  const handleOpenEdit = (rec) => {
    setEditingRecordId(rec.id);
    setFormData({
      semester: rec.semester || 'Semester 1',
      subject_name: rec.courseName || rec.subject_name || rec.subjectName || '',
      courseCode: rec.courseCode || '',
      credits: rec.credits || 4,
      grade: rec.grade || 'A',
      gpa: rec.gradePoints !== undefined ? rec.gradePoints : (rec.gpa || 9.0)
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    if (Number(formData.credits) <= 0) {
      alert('Credits must be a positive number greater than 0.');
      setSaving(false);
      return;
    }

    try {
      if (editingRecordId) {
        await collegeAPI.updateCgpa(editingRecordId, formData);
      } else {
        await collegeAPI.addCgpa(formData);
      }
      setShowModal(false);
      loadCgpa();
    } catch (err) {
      console.error('Save CGPA Record Error:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to save grade record.';
      alert(`Error saving grade record: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course grade record?')) return;
    try {
      await collegeAPI.deleteCgpa(id);
      loadCgpa();
    } catch (err) {
      console.error('Failed to delete CGPA record:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to delete grade record.';
      alert(`Error deleting record: ${msg}`);
    }
  };

  const records = cgpaData.records || [];
  const uniqueSemesters = Array.from(new Set(records.map(r => r.semester || 'Semester 1'))).filter(Boolean);

  const filteredRecords = selectedSemester === 'all' ? records : records.filter(r => r.semester === selectedSemester);

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>CGPA & SGPA Calculator 🔢</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Record course grades, calculate semester SGPA and cumulative CGPA stored in Firestore.</p>
        </div>
        <button onClick={handleOpenCreate} className="btn btn-primary">
          <Plus size={18} /> Add Grade Record
        </button>
      </div>

      {/* Error State Alert */}
      {errorMessage && (
        <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle size={20} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Cumulative & Grade Reference Grid */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        {/* Cumulative CGPA Card */}
        <div className="glass-card" style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Cumulative CGPA</div>
          <h2 style={{ fontSize: '3.8rem', fontWeight: 800, color: 'var(--accent-primary)', margin: 0 }}>
            {cgpaData.cumulativeCGPA ? Number(cgpaData.cumulativeCGPA).toFixed(2) : '0.00'}
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Based on {cgpaData.totalCredits || 0} completed credits across {uniqueSemesters.length} semesters
          </p>
        </div>

        {/* Grade Summary Box */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Grade Point Scale Reference</h3>
          <div className="grid-4" style={{ textAlign: 'center', fontSize: '0.85rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'var(--bg-primary)' }}><strong>S / A+</strong>: 10.0</div>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'var(--bg-primary)' }}><strong>A</strong>: 9.0</div>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'var(--bg-primary)' }}><strong>B+</strong>: 8.0</div>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'var(--bg-primary)' }}><strong>B</strong>: 7.0</div>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'var(--bg-primary)' }}><strong>C</strong>: 6.0</div>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'var(--bg-primary)' }}><strong>D</strong>: 5.0</div>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'var(--bg-primary)' }}><strong>F</strong>: 0.0</div>
          </div>
        </div>
      </div>

      {/* Semester Filter Bar */}
      <div className="glass-card" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Filter by Semester:</span>
          <select className="form-control" style={{ width: 'auto' }} value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
            <option value="all">All Semesters</option>
            {uniqueSemesters.map((sem, idx) => (
              <option key={idx} value={sem}>{sem}</option>
            ))}
          </select>
        </div>

        {selectedSemester !== 'all' && cgpaData.semesterSgpaMap && cgpaData.semesterSgpaMap[selectedSemester] !== undefined && (
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
            {selectedSemester} SGPA: <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{cgpaData.semesterSgpaMap[selectedSemester].toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 1rem', color: 'var(--accent-primary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading CGPA records from Firestore...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        /* Empty State */
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <BookOpen size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Course Grade Records</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Add your first course to calculate your CGPA.</p>
          <button onClick={handleOpenCreate} className="btn btn-primary btn-sm">
            <Plus size={16} /> Add First Course
          </button>
        </div>
      ) : (
        /* Grade Table */
        <div className="glass-card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>Semester Course Grade Records</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '0.85rem' }}>Semester</th>
                  <th style={{ padding: '0.85rem' }}>Course / Subject</th>
                  <th style={{ padding: '0.85rem' }}>Credits</th>
                  <th style={{ padding: '0.85rem' }}>Grade</th>
                  <th style={{ padding: '0.85rem' }}>Grade Points</th>
                  <th style={{ padding: '0.85rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(rec => (
                  <tr key={rec.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                    <td style={{ padding: '0.85rem', fontWeight: 600 }}>{rec.semester}</td>
                    <td style={{ padding: '0.85rem' }}>
                      {rec.courseCode && <span style={{ color: 'var(--text-muted)', marginRight: '0.5rem', fontSize: '0.8rem' }}>[{rec.courseCode}]</span>}
                      {rec.courseName || rec.subject_name || rec.subjectName || 'Subject'}
                    </td>
                    <td style={{ padding: '0.85rem' }}>{rec.credits}</td>
                    <td style={{ padding: '0.85rem' }}>
                      <span className="badge badge-primary">{rec.grade || 'A'}</span>
                    </td>
                    <td style={{ padding: '0.85rem', color: 'var(--accent-primary)', fontWeight: 700 }}>
                      {rec.gradePoints !== undefined ? rec.gradePoints : rec.gpa}
                    </td>
                    <td style={{ padding: '0.85rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button onClick={() => handleOpenEdit(rec)} className="btn btn-secondary btn-sm" title="Edit Course">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(rec.id)} className="btn btn-secondary btn-sm" style={{ color: 'var(--accent-danger)' }} title="Delete Course">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h3 style={{ marginBottom: '1.5rem' }}>{editingRecordId ? 'Edit Subject Grade Record' : 'Add Subject Grade Record'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="form-group">
                  <label>Semester *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Semester 1"
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Course Code (optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. CS101"
                    value={formData.courseCode}
                    onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Course / Subject Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Operating Systems"
                  value={formData.subject_name}
                  onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
                  required
                />
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label>Credits *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Letter Grade</label>
                  <select className="form-control" value={formData.grade} onChange={(e) => handleGradeChange(e.target.value)}>
                    <option value="S">S (10.0)</option>
                    <option value="A+">A+ (10.0)</option>
                    <option value="A">A (9.0)</option>
                    <option value="B+">B+ (8.0)</option>
                    <option value="B">B (7.0)</option>
                    <option value="C">C (6.0)</option>
                    <option value="D">D (5.0)</option>
                    <option value="F">F (0.0)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Grade Point</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-control"
                    value={formData.gpa}
                    readOnly
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : (editingRecordId ? 'Update Record' : 'Save Record')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
