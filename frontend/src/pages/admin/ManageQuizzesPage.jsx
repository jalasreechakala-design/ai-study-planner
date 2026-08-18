import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { HelpCircle, Plus, Trash2, CheckCircle } from 'lucide-react';

export default function ManageQuizzesPage() {
  const [questions, setQuestions] = useState([]);
  const [showQModal, setShowQModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);

  const [qForm, setQForm] = useState({
    subject_id: 1,
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: 'A',
    explanation: '',
    difficulty: 'medium'
  });

  const [quizForm, setQuizForm] = useState({
    title: '',
    exam_id: 1,
    subject_id: 1,
    time_limit_mins: 15,
    total_marks: 10
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const qRes = await adminAPI.getQuestions();
      setQuestions(qRes.data.questions || []);
    } catch (err) {
      console.error('Failed to load questions');
    }
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createQuestion(qForm);
      setShowQModal(false);
      setQForm({ subject_id: 1, question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A', explanation: '', difficulty: 'medium' });
      loadData();
    } catch (err) {
      alert('Failed to add question');
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Delete question?')) return;
    try {
      await adminAPI.deleteQuestion(id);
      loadData();
    } catch (err) {
      alert('Failed to delete question');
    }
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createQuiz(quizForm);
      setShowQuizModal(false);
      alert('Quiz created and published!');
    } catch (err) {
      alert('Failed to create quiz');
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Question Bank & Quiz Manager ❓</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Add MCQs to question bank & assemble timed quizzes for students.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setShowQModal(true)} className="btn btn-primary">
            <Plus size={18} /> Add MCQ Question
          </button>
          <button onClick={() => setShowQuizModal(true)} className="btn btn-secondary">
            <Plus size={18} /> Create Quiz
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>MCQ Question Bank ({questions.length})</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {questions.map(q => (
            <div key={q.id} style={{ padding: '1rem', borderRadius: '12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h4 style={{ fontSize: '1rem', margin: '0 0 0.5rem 0' }}>{q.question_text}</h4>
                <button onClick={() => handleDeleteQuestion(q.id)} className="btn btn-secondary btn-sm" style={{ color: 'var(--accent-danger)' }}>
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="grid-2" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.5rem 0' }}>
                <div style={{ color: q.correct_option === 'A' ? 'var(--accent-success)' : 'inherit', fontWeight: q.correct_option === 'A' ? 700 : 400 }}>A) {q.option_a}</div>
                <div style={{ color: q.correct_option === 'B' ? 'var(--accent-success)' : 'inherit', fontWeight: q.correct_option === 'B' ? 700 : 400 }}>B) {q.option_b}</div>
                <div style={{ color: q.correct_option === 'C' ? 'var(--accent-success)' : 'inherit', fontWeight: q.correct_option === 'C' ? 700 : 400 }}>C) {q.option_c}</div>
                <div style={{ color: q.correct_option === 'D' ? 'var(--accent-success)' : 'inherit', fontWeight: q.correct_option === 'D' ? 700 : 400 }}>D) {q.option_d}</div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Correct Answer: Option {q.correct_option} • Difficulty: {q.difficulty}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Question Modal */}
      {showQModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h3 style={{ marginBottom: '1.5rem' }}>Add Question to Bank</h3>
            <form onSubmit={handleCreateQuestion}>
              <div className="form-group">
                <label>Question Text *</label>
                <textarea className="form-control" rows={3} value={qForm.question_text} onChange={(e) => setQForm({ ...qForm, question_text: e.target.value })} required />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Option A *</label>
                  <input type="text" className="form-control" value={qForm.option_a} onChange={(e) => setQForm({ ...qForm, option_a: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Option B *</label>
                  <input type="text" className="form-control" value={qForm.option_b} onChange={(e) => setQForm({ ...qForm, option_b: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Option C *</label>
                  <input type="text" className="form-control" value={qForm.option_c} onChange={(e) => setQForm({ ...qForm, option_c: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Option D *</label>
                  <input type="text" className="form-control" value={qForm.option_d} onChange={(e) => setQForm({ ...qForm, option_d: e.target.value })} required />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Correct Option *</label>
                  <select className="form-control" value={qForm.correct_option} onChange={(e) => setQForm({ ...qForm, correct_option: e.target.value })}>
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Difficulty</label>
                  <select className="form-control" value={qForm.difficulty} onChange={(e) => setQForm({ ...qForm, difficulty: e.target.value })}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Explanation</label>
                <textarea className="form-control" rows={2} value={qForm.explanation} onChange={(e) => setQForm({ ...qForm, explanation: e.target.value })} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowQModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Question</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Quiz Modal */}
      {showQuizModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h3 style={{ marginBottom: '1.5rem' }}>Assemble & Publish Quiz</h3>
            <form onSubmit={handleCreateQuiz}>
              <div className="form-group">
                <label>Quiz Title *</label>
                <input type="text" className="form-control" placeholder="e.g. GATE Computer Networks Foundations Quiz" value={quizForm.title} onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })} required />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Time Limit (Minutes)</label>
                  <input type="number" className="form-control" value={quizForm.time_limit_mins} onChange={(e) => setQuizForm({ ...quizForm, time_limit_mins: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>Total Marks</label>
                  <input type="number" className="form-control" value={quizForm.total_marks} onChange={(e) => setQuizForm({ ...quizForm, total_marks: Number(e.target.value) })} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowQuizModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Publish Quiz</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
