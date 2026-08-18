import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { competitiveAPI } from '../../services/api';
import { Map, CheckCircle2, Clock, Award, BookOpen, HelpCircle, ChevronRight, CircleDot, Circle, ArrowRight, ExternalLink, Play, FileText, FileCode, Book, Globe } from 'lucide-react';

export default function ExamRoadmapPage() {
  const [searchParams] = useSearchParams();
  const examId = searchParams.get('examId') || 1;

  const [roadmap, setRoadmap] = useState(null);
  const [allResources, setAllResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoadmap();
  }, [examId]);

  const loadRoadmap = async () => {
    try {
      const [rmRes, matRes] = await Promise.all([
        competitiveAPI.getRoadmap(examId),
        competitiveAPI.getResources({ exam_id: examId })
      ]);
      setRoadmap(rmRes.data);
      setAllResources(matRes.data.resources || matRes.data.materials || []);
    } catch (err) {
      console.error('Failed to load roadmap or learning resources');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (topicId, newStatus) => {
    try {
      await competitiveAPI.updateTopicProgress({ topicId, status: newStatus });
      loadRoadmap();
    } catch (err) {
      console.error('Failed to update topic status');
    }
  };

  const handleOpenResource = async (resObj) => {
    try {
      await competitiveAPI.trackResourceClick(resObj.id);
    } catch (err) {
      // Ignore click error
    }
    const targetUrl = resObj.url || resObj.file_url;
    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const getResourceIcon = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('video')) return { icon: Play, label: 'Video', color: 'var(--accent-primary)' };
    if (t.includes('article')) return { icon: FileText, label: 'Article', color: 'var(--color-college)' };
    if (t.includes('practice')) return { icon: FileCode, label: 'Practice', color: 'var(--warning)' };
    if (t.includes('reference')) return { icon: Book, label: 'Reference', color: 'var(--success)' };
    return { icon: Globe, label: 'Resource', color: 'var(--text-secondary)' };
  };

  if (loading || !roadmap) return (
    <div className="page-wrapper">
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div className="skeleton" style={{ height: '140px', marginBottom: '1.5rem' }}></div>
        <div className="skeleton" style={{ height: '300px' }}></div>
      </div>
    </div>
  );

  return (
    <div className="page-wrapper">
      {/* Exam Header Banner */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', color: '#ffffff', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255, 255, 255, 0.15)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              <Award size={14} /> Exam-Specific Learning & Syllabus Roadmap
            </div>
            <h1 style={{ fontSize: '2rem', color: '#ffffff', margin: 0 }}>{roadmap.exam.title}</h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.875rem', marginTop: '0.25rem' }}>{roadmap.exam.description}</p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600 }}>Mastery Progress</span>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              {roadmap.overallPercentage}%
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)' }}>
              ({roadmap.completedTopics} of {roadmap.totalTopics} topics completed)
            </span>
          </div>
        </div>

        <div className="progress-bar-bg" style={{ marginTop: '1.25rem', height: '8px', background: 'rgba(255, 255, 255, 0.2)' }}>
          <div className="progress-bar-fill" style={{ width: `${roadmap.overallPercentage}%`, backgroundColor: '#ffffff' }} />
        </div>
      </div>

      {/* Stepper Breadcrumb / Flow Indicator */}
      <div style={{
        background: 'var(--surface)',
        padding: '0.75rem 1.25rem',
        borderRadius: '10px',
        border: '1px solid var(--border)',
        marginBottom: '1.5rem',
        fontSize: '0.8125rem',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        flexWrap: 'wrap'
      }}>
        <strong style={{ color: 'var(--text-primary)' }}>Exam Flow:</strong>
        <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>Exam</span> <ChevronRight size={14} />
        <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>Subject</span> <ChevronRight size={14} />
        <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>Topic</span> <ChevronRight size={14} />
        <span style={{ fontWeight: 600, color: 'var(--warning)' }}>Curated Resources</span> <ChevronRight size={14} />
        <span>Practice Questions</span> <ChevronRight size={14} />
        <span>Quiz</span> <ChevronRight size={14} />
        <span style={{ color: 'var(--success)', fontWeight: 700 }}>Completion</span>
      </div>

      {/* Vertical Learning Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {roadmap.subjects.map((subject, sIdx) => (
          <div key={subject.id} className="card" style={{ position: 'relative' }}>
            {/* Subject Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  SUBJECT {String(sIdx + 1).padStart(2, '0')}
                </span>
                <h3 style={{ fontSize: '1.3rem', margin: '0.1rem 0 0 0' }}>{subject.title}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Weightage: {subject.weightage}</span>
              </div>
              <span className="badge badge-success" style={{ fontSize: '0.8125rem' }}>
                {subject.completionPercentage}% Mastered
              </span>
            </div>

            {/* Topics Vertical Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative', paddingLeft: '1.5rem' }}>
              <div style={{ position: 'absolute', left: '0.5rem', top: '10px', bottom: '10px', width: '2px', background: 'var(--border)' }}></div>

              {subject.topics.map((topic, tIdx) => {
                const isCompleted = topic.status === 'completed';
                const isInProgress = topic.status === 'in_progress';

                // Topic-specific curated resources
                const topicResources = allResources.filter(r => r.topic_id === topic.id || (r.subject_id === subject.id && !r.topic_id));

                return (
                  <div key={topic.id} style={{
                    position: 'relative',
                    padding: '1.1rem 1.25rem',
                    borderRadius: '10px',
                    background: 'var(--surface-secondary)',
                    border: isInProgress ? '1px solid var(--accent-primary)' : '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}>
                    {/* Timeline Node Bullet */}
                    <div style={{
                      position: 'absolute',
                      left: '-1.5rem',
                      top: '1.4rem',
                      transform: 'translateX(-50%)',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: isCompleted ? 'var(--success)' : (isInProgress ? 'var(--accent-primary)' : 'var(--border)'),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff'
                    }}>
                      {isCompleted ? <CheckCircle2 size={12} /> : (isInProgress ? <CircleDot size={12} /> : <Circle size={10} />)}
                    </div>

                    {/* Topic Header & Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                            {String(tIdx + 1).padStart(2, '0')}
                          </span>
                          <div style={{ fontWeight: 700, fontSize: '1rem' }}>{topic.title}</div>
                        </div>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>{topic.description}</p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <select
                          className="form-select"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78125rem', width: 'auto', fontWeight: 600 }}
                          value={topic.status}
                          onChange={(e) => handleStatusChange(topic.id, e.target.value)}
                        >
                          <option value="not_started">⚪ Upcoming</option>
                          <option value="in_progress">🟡 Currently Learning</option>
                          <option value="completed">🟢 Completed</option>
                          <option value="revision_needed">🔴 Revision Needed</option>
                        </select>
                      </div>
                    </div>

                    {/* Section 1: LEARN (Curated Learning Resources) */}
                    <div style={{ background: 'var(--surface)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.725rem', fontWeight: 800, letterSpacing: '0.05em', color: 'var(--accent-primary)', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                        LEARN — CURATED RESOURCES
                      </div>

                      {topicResources.length === 0 ? (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          No specific resources tagged for this topic yet. Explore general resources in{' '}
                          <Link to="/competitive/materials" style={{ color: 'var(--accent-primary)' }}>Learning Resources</Link>.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {topicResources.map(resObj => {
                            const iconInfo = getResourceIcon(resObj.resource_type || resObj.material_type);
                            const IconComp = iconInfo.icon;

                            return (
                              <div key={resObj.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.5rem 0.75rem',
                                borderRadius: '6px',
                                background: 'var(--surface-secondary)',
                                border: '1px solid var(--border)',
                                fontSize: '0.8125rem'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0, paddingRight: '0.5rem' }}>
                                  <IconComp size={15} color={iconInfo.color} />
                                  <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {resObj.title}
                                  </span>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({resObj.source_name || 'Source'})</span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleOpenResource(resObj)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-primary)' }}
                                >
                                  Open <ExternalLink size={12} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Section 2: PRACTICE & ASSESSMENT */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.6rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <Link to="/competitive/questions" className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <HelpCircle size={13} /> Practice Questions
                        </Link>
                        <Link to="/competitive/quizzes" className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--warning)' }}>
                          <Clock size={13} /> Take Quiz
                        </Link>
                      </div>

                      <button
                        onClick={() => handleStatusChange(topic.id, isCompleted ? 'not_started' : 'completed')}
                        className={`btn btn-sm ${isCompleted ? 'btn-success' : 'btn-outline'}`}
                        style={{ fontSize: '0.75rem' }}
                      >
                        {isCompleted ? '✓ Mark Complete' : 'Mark Topic Complete'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


