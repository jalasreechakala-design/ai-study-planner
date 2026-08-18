import React, { useState, useEffect } from 'react';
import { competitiveAPI } from '../../services/api';
import { HelpCircle, CheckCircle, XCircle, Filter, BookOpen, Sparkles, Award } from 'lucide-react';

export default function PyqQuestionBankPage() {
  const [questions, setQuestions] = useState([]);
  const [yearFilter, setYearFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [revealedExplanations, setRevealedExplanations] = useState({});

  useEffect(() => {
    loadQuestions();
  }, [yearFilter, difficultyFilter]);

  const loadQuestions = async () => {
    try {
      const res = await competitiveAPI.getPyqs({
        year: yearFilter,
        difficulty: difficultyFilter
      });
      setQuestions(res.data.questions || []);
    } catch (err) {
      console.error('Failed to load questions');
    }
  };

  const handleSelectOption = (qId, option) => {
    setSelectedAnswers(prev => ({ ...prev, [qId]: option }));
    setRevealedExplanations(prev => ({ ...prev, [qId]: true }));
  };

  const totalAttempted = Object.keys(selectedAnswers).length;
  let correctCount = 0;
  questions.forEach(q => {
    if (selectedAnswers[q.id] === q.correct_option) correctCount++;
  });

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: '1.5rem' }}>
        <span className="badge badge-primary" style={{ marginBottom: '0.4rem' }}>
          <HelpCircle size={13} /> Interactive Question Bank & PYQs
        </span>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Previous Year Questions & Practice 🎯</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Solve past competitive exam questions topic-by-topic with instant answer verification and explanations.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>
          <Filter size={16} /> Filters:
        </div>

        <select
          className="form-control"
          style={{ width: 'auto', minWidth: '160px' }}
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
        >
          <option value="">All Exam Years</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
          <option value="2022">2022</option>
          <option value="2021">2021</option>
        </select>

        <select
          className="form-control"
          style={{ width: 'auto', minWidth: '160px' }}
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
        >
          <option value="">All Difficulty Levels</option>
          <option value="easy">Easy Level</option>
          <option value="medium">Medium Level</option>
          <option value="hard">Hard Level</option>
        </select>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
          <span>Attempted: <strong>{totalAttempted} / {questions.length}</strong></span>
          <span>Score: <strong style={{ color: 'var(--accent-success)' }}>{correctCount} Correct</strong></span>
        </div>
      </div>

      {/* Questions Stack */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {questions.map((q, idx) => {
          const userChoice = selectedAnswers[q.id];
          const isAnswered = !!userChoice;
          const isCorrect = userChoice === q.correct_option;

          return (
            <div key={q.id} className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="badge badge-primary">Q{idx + 1}</span>
                  {q.year && <span className="badge badge-secondary">GATE {q.year}</span>}
                </div>

                <span className={`badge ${q.difficulty === 'easy' ? 'badge-success' : (q.difficulty === 'medium' ? 'badge-warning' : 'badge-danger')}`}>
                  {q.difficulty}
                </span>
              </div>

              <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', lineHeight: 1.5 }}>
                {q.question_text}
              </div>

              {/* Options Grid */}
              <div className="grid-2" style={{ gap: '0.75rem', marginBottom: '1rem' }}>
                {['A', 'B', 'C', 'D'].map(optKey => {
                  const optionText = q[`option_${optKey.toLowerCase()}`];
                  const isSelected = userChoice === optKey;
                  const isThisCorrect = q.correct_option === optKey;

                  let bgColor = 'var(--bg-primary)';
                  let borderColor = 'var(--border-color)';

                  if (isAnswered) {
                    if (isThisCorrect) {
                      bgColor = 'rgba(16, 185, 129, 0.12)';
                      borderColor = 'var(--accent-success)';
                    } else if (isSelected) {
                      bgColor = 'rgba(239, 68, 68, 0.12)';
                      borderColor = 'var(--accent-danger)';
                    }
                  }

                  return (
                    <button
                      key={optKey}
                      type="button"
                      onClick={() => handleSelectOption(q.id, optKey)}
                      style={{
                        textAlign: 'left',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        border: `1px solid ${borderColor}`,
                        background: bgColor,
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: isSelected ? 600 : 400,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <strong style={{ color: 'var(--accent-primary)' }}>{optKey}.</strong> {optionText}
                    </button>
                  );
                })}
              </div>

              {/* Detailed Explanation Reveal */}
              {isAnswered && (
                <div style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '8px',
                  background: isCorrect ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  border: `1px solid ${isCorrect ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                  fontSize: '0.85rem'
                }}>
                  <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem', color: isCorrect ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                    {isCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    {isCorrect ? 'Correct Answer!' : `Incorrect Choice. Correct Option: ${q.correct_option}`}
                  </div>
                  <p style={{ color: 'var(--text-secondary)', margin: 0, fontStyle: 'italic' }}>
                    💡 <strong>Explanation:</strong> {q.explanation}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
