import React, { useState, useEffect } from 'react';
import { competitiveAPI } from '../../services/api';
import { FileCheck, Clock, Award, Play, AlertTriangle, CheckCircle, XCircle, Bookmark, X } from 'lucide-react';

export default function MockTestsPage() {
  const [mockTests, setMockTests] = useState([]);
  const [activeTest, setActiveTest] = useState(null);
  const [instructionsConfirmed, setInstructionsConfirmed] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [testResult, setTestResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Default Mock Questions Data for Simulation
  const mockQuestions = [
    {
      id: 1,
      subject: 'Computer Networks',
      text: 'In the TCP header, what is the length of the Source Port field?',
      option_a: '8 bits',
      option_b: '16 bits',
      option_c: '32 bits',
      option_d: '64 bits',
      correct_option: 'B'
    },
    {
      id: 2,
      subject: 'DBMS',
      text: 'Which normal form deals with Multivalued Dependency?',
      option_a: '2NF',
      option_b: '3NF',
      option_c: 'BCNF',
      option_d: '4NF',
      correct_option: 'D'
    },
    {
      id: 3,
      subject: 'Operating Systems',
      text: 'Which CPU scheduling algorithm gives minimum average waiting time?',
      option_a: 'FCFS',
      option_b: 'SJF (Shortest Job First)',
      option_c: 'Round Robin',
      option_d: 'Priority Scheduling',
      correct_option: 'B'
    }
  ];

  useEffect(() => {
    loadMockTests();
  }, []);

  useEffect(() => {
    let timer = null;
    if (activeTest && instructionsConfirmed && !testResult && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            submitMockTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeTest, instructionsConfirmed, testResult, timeLeft]);

  const loadMockTests = async () => {
    try {
      const res = await competitiveAPI.getMockTests();
      setMockTests(res.data.mockTests || []);
    } catch (err) {
      console.error('Failed to load mock tests');
    }
  };

  const handleLaunchTest = (test) => {
    setActiveTest(test);
    setInstructionsConfirmed(false);
    setAnswers({});
    setMarkedForReview({});
    setCurrentQIndex(0);
    setTestResult(null);
    setTimeLeft((test.duration_mins || 60) * 60);
  };

  const handleConfirmInstructions = () => {
    setInstructionsConfirmed(true);
  };

  const handleSelectOption = (qId, option) => {
    setAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const toggleMarkForReview = (qId) => {
    setMarkedForReview(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const submitMockTest = async () => {
    if (submitting) return;
    setSubmitting(true);

    let correctCount = 0;
    mockQuestions.forEach(q => {
      if (answers[q.id] === q.correct_option) correctCount++;
    });

    const totalQs = mockQuestions.length;
    const pct = Math.round((correctCount / totalQs) * 100);

    try {
      const res = await competitiveAPI.submitMockTest({
        mock_test_id: activeTest.id,
        score: pct,
        total_questions: totalQs,
        correct_count: correctCount
      });
      setTestResult({
        ...res.data,
        correctCount,
        totalQuestions: totalQs
      });
    } catch (err) {
      alert('Failed to submit mock test');
    } finally {
      setSubmitting(false);
    }
  };

  const closeMockModal = () => {
    setActiveTest(null);
    setInstructionsConfirmed(false);
    setTestResult(null);
  };

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: '1.5rem' }}>
        <span className="badge badge-danger" style={{ marginBottom: '0.4rem' }}>
          <FileCheck size={13} /> Exam Hall Simulator
        </span>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Full-Length Competitive Mock Tests 📝</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Simulate real examination conditions with live timer, question navigation palette, mark for review, and subject-wise score analytics.
        </p>
      </div>

      <div className="grid-2">
        {mockTests.map(test => (
          <div key={test.id} className="glass-card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(37, 99, 235, 0.1)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FileCheck size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem' }}>{test.title}</h3>
                <span className="badge badge-primary">GATE All-India Mock Paper</span>
              </div>
            </div>

            <div className="grid-3" style={{ background: 'var(--bg-primary)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.85rem', border: '1px solid var(--border-color)' }}>
              <div>⏱️ <strong>{test.duration_mins} Mins</strong></div>
              <div>❓ <strong>{test.total_questions} Questions</strong></div>
              <div>🎯 <strong>{test.passing_score}% Cutoff</strong></div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => handleLaunchTest(test)}>
              <Play size={16} /> Launch Full Mock Test
            </button>
          </div>
        ))}
      </div>

      {/* Mock Test Modal */}
      {activeTest && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '900px', maxHeight: '92vh' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{activeTest.title}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Full Exam Hall Mode</span>
              </div>

              {instructionsConfirmed && !testResult && (
                <div className="badge badge-danger" style={{ fontSize: '1rem', padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={16} /> {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
              )}

              <button onClick={closeMockModal} className="btn btn-secondary btn-sm" style={{ padding: '0.35rem' }}>
                <X size={16} />
              </button>
            </div>

            {/* STEP 1: Instructions Screen */}
            {!instructionsConfirmed ? (
              <div>
                <div style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', color: 'var(--accent-primary)' }}>Exam Instructions & Rules</h4>
                  <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    <li>The exam duration is <strong>{activeTest.duration_mins} minutes</strong>.</li>
                    <li>Each correct response awards positive marks. Unattempted questions carry zero marks.</li>
                    <li>You can mark questions for review using the <strong>Mark for Review</strong> button to re-evaluate them later.</li>
                    <li>Do not close or refresh your browser window during the active examination session.</li>
                  </ul>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button className="btn btn-secondary" onClick={closeMockModal}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleConfirmInstructions}>
                    Start Examination Now <Play size={16} />
                  </button>
                </div>
              </div>
            ) : testResult ? (
              /* STEP 3: Evaluation & Weak Topic Report */
              <div>
                <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--bg-primary)', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
                  <Award size={46} color={testResult.passed ? 'var(--accent-success)' : 'var(--accent-danger)'} style={{ marginBottom: '0.4rem' }} />
                  <h2 style={{ fontSize: '2rem', margin: 0 }}>
                    {testResult.passed ? 'PASSED 🎯' : 'REQUIRES REVISION'} ({testResult.percentage}%)
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.3rem' }}>
                    Correct: <strong>{testResult.correctCount} / {testResult.totalQuestions}</strong> questions
                  </p>
                </div>

                <div style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <AlertTriangle size={16} color="var(--accent-warning)" /> Weak Topic Diagnostics
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Based on your incorrect and skipped questions, the system recommends focusing on:
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    {testResult.weakSubjects.map((subject, idx) => (
                      <span key={idx} className="badge badge-warning" style={{ fontSize: '0.8rem' }}>{subject}</span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" onClick={closeMockModal}>Close Results</button>
                </div>
              </div>
            ) : (
              /* STEP 2: Live Question Execution & Palette Navigation */
              <div>
                {/* Question Palette Header */}
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                  {mockQuestions.map((q, idx) => {
                    const isAnswered = !!answers[q.id];
                    const isMarked = !!markedForReview[q.id];
                    const isCurrent = idx === currentQIndex;

                    let bg = 'var(--bg-primary)';
                    if (isCurrent) bg = 'var(--accent-primary)';
                    else if (isMarked) bg = 'var(--accent-warning)';
                    else if (isAnswered) bg = 'var(--accent-success)';

                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setCurrentQIndex(idx)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          border: `1px solid ${isCurrent ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                          background: bg,
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Active Question Box */}
                {mockQuestions[currentQIndex] && (
                  <div style={{ padding: '1.25rem', borderRadius: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span className="badge badge-secondary">{mockQuestions[currentQIndex].subject}</span>
                      <button
                        type="button"
                        onClick={() => toggleMarkForReview(mockQuestions[currentQIndex].id)}
                        className={`badge ${markedForReview[mockQuestions[currentQIndex].id] ? 'badge-warning' : 'badge-secondary'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                      >
                        <Bookmark size={12} /> {markedForReview[mockQuestions[currentQIndex].id] ? 'Marked for Review' : 'Mark for Review'}
                      </button>
                    </div>

                    <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1rem', lineHeight: 1.5 }}>
                      Q{currentQIndex + 1}. {mockQuestions[currentQIndex].text}
                    </div>

                    <div className="grid-2" style={{ gap: '0.75rem' }}>
                      {['A', 'B', 'C', 'D'].map(opt => {
                        const qObj = mockQuestions[currentQIndex];
                        const optionText = qObj[`option_${opt.toLowerCase()}`];
                        const isSelected = answers[qObj.id] === opt;

                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleSelectOption(qObj.id, opt)}
                            style={{
                              textAlign: 'left',
                              padding: '0.75rem 1rem',
                              borderRadius: '8px',
                              border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                              background: isSelected ? 'rgba(37, 99, 235, 0.15)' : 'var(--bg-secondary)',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
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

                {/* Footer Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    className="btn btn-secondary"
                    disabled={currentQIndex === 0}
                    onClick={() => setCurrentQIndex(prev => prev - 1)}
                  >
                    ← Previous
                  </button>

                  {currentQIndex < mockQuestions.length - 1 ? (
                    <button
                      className="btn btn-secondary"
                      onClick={() => setCurrentQIndex(prev => prev + 1)}
                    >
                      Next →
                    </button>
                  ) : (
                    <button className="btn btn-primary" onClick={submitMockTest} disabled={submitting}>
                      {submitting ? 'Submitting Test...' : 'Submit Full Mock Test'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
