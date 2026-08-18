import React, { useState, useEffect } from 'react';
import { competitiveAPI } from '../../services/api';
import { HelpCircle, Play, Clock, CheckCircle, XCircle, AlertCircle, Award, X, Bookmark } from 'lucide-react';

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [reviewed, setReviewed] = useState({});
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadQuizzes();
  }, []);

  useEffect(() => {
    let timer = null;
    if (activeQuiz && !result && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            submitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeQuiz, result, timeLeft]);

  const loadQuizzes = async () => {
    try {
      const res = await competitiveAPI.getQuizzes();
      setQuizzes(res.data.quizzes || []);
    } catch (err) {
      console.error('Failed to load quizzes');
    }
  };

  const startQuiz = async (quizId) => {
    try {
      const res = await competitiveAPI.getQuizDetails(quizId);
      setActiveQuiz(res.data.quiz);
      setQuizQuestions(res.data.questions || []);
      setAnswers({});
      setReviewed({});
      setCurrentQIndex(0);
      setResult(null);
      setTimeLeft((res.data.quiz.time_limit_mins || 15) * 60);
    } catch (err) {
      alert('Failed to load quiz details');
    }
  };

  const handleSelectAnswer = (qId, option) => {
    setAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const toggleMarkForReview = (qId) => {
    setReviewed(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const submitQuiz = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await competitiveAPI.submitQuiz({
        quiz_id: activeQuiz.id,
        answers,
        time_taken_seconds: (activeQuiz.time_limit_mins * 60) - timeLeft
      });
      setResult(res.data);
    } catch (err) {
      alert('Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const closeQuizModal = () => {
    setActiveQuiz(null);
    setQuizQuestions([]);
    setAnswers({});
    setReviewed({});
    setCurrentQIndex(0);
    setResult(null);
  };

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: '1.5rem' }}>
        <span className="badge badge-warning" style={{ marginBottom: '0.4rem' }}>
          <Clock size={13} /> Timed Practice Quizzes
        </span>
        <h1 style={{ fontSize: '1.85rem', marginBottom: '0.25rem' }}>Topic Practice Quizzes ⚡</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Challenge yourself with topic-wise timed quizzes, automatic evaluation, and instant explanation analysis.
        </p>
      </div>

      {/* Quizzes List Grid */}
      <div className="grid-3">
        {quizzes.map(qz => (
          <div key={qz.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.85rem' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  background: 'rgba(217, 119, 6, 0.12)',
                  color: 'var(--warning)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <HelpCircle size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem' }}>{qz.title}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Topic Quiz</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--surface-secondary)', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <span>⏱️ {qz.time_limit_mins} Mins</span>
                <span>• Total Marks: {qz.total_marks}</span>
              </div>
            </div>

            <button
              onClick={() => startQuiz(qz.id)}
              className="btn btn-primary"
              style={{ marginTop: '1.25rem', width: '100%' }}
            >
              <Play size={16} /> Attempt Quiz
            </button>
          </div>
        ))}
      </div>

      {/* Quiz Modal Execution Interface */}
      {activeQuiz && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '850px', maxHeight: '92vh' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', margin: 0 }}>{activeQuiz.title}</h3>
                <span style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)' }}>
                  QUESTION {String(currentQIndex + 1).padStart(2, '0')} / {String(quizQuestions.length).padStart(2, '0')}
                </span>
              </div>

              {!result && (
                <div className="badge badge-warning" style={{ fontSize: '0.9rem', padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={16} /> {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
              )}

              <button onClick={closeQuizModal} className="btn btn-secondary btn-sm" style={{ padding: '0.35rem' }}>
                <X size={16} />
              </button>
            </div>

            {/* Evaluation Breakdown Screen */}
            {result ? (
              <div>
                <div style={{ textAlign: 'center', padding: '1.75rem 1rem', background: 'var(--surface-secondary)', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
                  <Award size={42} color="var(--accent-primary)" style={{ marginBottom: '0.4rem' }} />
                  <h2 style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>{result.percentage}%</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Correct Answers: <strong>{result.correctCount} / {result.totalQuestions}</strong> | Score: <strong>{result.score} / {activeQuiz.total_marks}</strong>
                  </p>
                </div>

                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.85rem' }}>Detailed Explanations</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '340px', overflowY: 'auto' }}>
                  {result.feedback.map((fb, idx) => (
                    <div key={idx} style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '8px',
                      background: fb.isCorrect ? 'rgba(22, 163, 74, 0.08)' : 'rgba(220, 38, 38, 0.08)',
                      border: `1px solid ${fb.isCorrect ? 'rgba(22, 163, 74, 0.25)' : 'rgba(220, 38, 38, 0.25)'}`
                    }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                        Q{idx + 1}: {fb.questionText}
                      </div>
                      <div style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                        Your Choice: <strong>{fb.userChoice || 'None'}</strong> | Correct Answer: <strong style={{ color: 'var(--success)' }}>{fb.correctOption}</strong>
                      </div>
                      <p style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', margin: 0, fontStyle: 'italic' }}>
                        💡 {fb.explanation}
                      </p>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                  <button className="btn btn-primary" onClick={closeQuizModal}>Back to Quizzes</button>
                </div>
              </div>
            ) : (
              /* Active Test Navigation View */
              <div>
                {/* Question Palette with Review Status */}
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                  {quizQuestions.map((q, idx) => {
                    const isAnswered = !!answers[q.id];
                    const isMarked = !!reviewed[q.id];
                    const isCurrent = idx === currentQIndex;

                    let bg = 'var(--surface)';
                    let border = 'var(--border)';
                    if (isCurrent) border = 'var(--accent-primary)';
                    if (isMarked) bg = 'var(--warning)';
                    else if (isAnswered) bg = 'var(--success)';

                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setCurrentQIndex(idx)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          border: `2px solid ${border}`,
                          background: bg,
                          color: (isAnswered || isMarked) ? '#ffffff' : 'var(--text-primary)',
                          fontWeight: 700,
                          fontSize: '0.78125rem',
                          cursor: 'pointer'
                        }}
                        title={`Q${idx + 1}${isMarked ? ' (Marked for Review)' : (isAnswered ? ' (Answered)' : '')}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Single Question Box */}
                {quizQuestions[currentQIndex] && (
                  <div style={{ padding: '1.25rem', borderRadius: '10px', background: 'var(--surface-secondary)', border: '1px solid var(--border)', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.5, flex: 1 }}>
                        Q{currentQIndex + 1}. {quizQuestions[currentQIndex].question_text}
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleMarkForReview(quizQuestions[currentQIndex].id)}
                        className={`btn btn-sm ${reviewed[quizQuestions[currentQIndex].id] ? 'btn-danger' : 'btn-secondary'}`}
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                      >
                        <Bookmark size={14} /> {reviewed[quizQuestions[currentQIndex].id] ? 'Marked' : 'Mark for Review'}
                      </button>
                    </div>

                    <div className="grid-2" style={{ gap: '0.75rem' }}>
                      {['A', 'B', 'C', 'D'].map(opt => {
                        const qObj = quizQuestions[currentQIndex];
                        const optionText = qObj[`option_${opt.toLowerCase()}`];
                        const isSelected = answers[qObj.id] === opt;

                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleSelectAnswer(qObj.id, opt)}
                            style={{
                              textAlign: 'left',
                              padding: '0.75rem 1rem',
                              borderRadius: '8px',
                              border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border)'}`,
                              background: isSelected ? 'var(--accent-primary-light)' : 'var(--surface)',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              fontWeight: isSelected ? 600 : 400
                            }}
                          >
                            <strong style={{ color: 'var(--accent-primary)' }}>{opt}.</strong> {optionText}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Question Navigation Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    className="btn btn-secondary"
                    disabled={currentQIndex === 0}
                    onClick={() => setCurrentQIndex(prev => prev - 1)}
                  >
                    ← Previous
                  </button>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {currentQIndex < quizQuestions.length - 1 ? (
                      <button
                        className="btn btn-secondary"
                        onClick={() => setCurrentQIndex(prev => prev + 1)}
                      >
                        Next →
                      </button>
                    ) : null}

                    <button className="btn btn-primary" onClick={submitQuiz} disabled={submitting}>
                      {submitting ? 'Evaluating...' : 'Submit Quiz'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

