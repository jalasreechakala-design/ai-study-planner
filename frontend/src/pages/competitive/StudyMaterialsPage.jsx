import React, { useState, useEffect } from 'react';
import { competitiveAPI } from '../../services/api';
import {
  BookOpen,
  Search,
  Bookmark,
  ExternalLink,
  Play,
  FileText,
  HelpCircle,
  Award,
  Book,
  FileCode,
  Star,
  CheckCircle,
  Clock,
  Globe
} from 'lucide-react';

export default function StudyMaterialsPage() {
  const [resources, setResources] = useState([]);
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);

  const [search, setSearch] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [onlyBookmarks, setOnlyBookmarks] = useState(false);

  useEffect(() => {
    loadExams();
  }, []);

  useEffect(() => {
    if (selectedExam) {
      loadSubjects(selectedExam);
    } else {
      setSubjects([]);
      setSelectedSubject('');
      setTopics([]);
      setSelectedTopic('');
    }
  }, [selectedExam]);

  useEffect(() => {
    if (selectedSubject) {
      loadTopics(selectedSubject);
    } else {
      setTopics([]);
      setSelectedTopic('');
    }
  }, [selectedSubject]);

  useEffect(() => {
    loadResources();
  }, [search, selectedExam, selectedSubject, selectedTopic, selectedType, selectedDifficulty, sortOption, onlyBookmarks]);

  const loadExams = async () => {
    try {
      const res = await competitiveAPI.getExams();
      setExams(res.data.exams || []);
    } catch (err) {
      console.error('Failed to load exams');
    }
  };

  const loadSubjects = async (examId) => {
    try {
      const res = await competitiveAPI.getRoadmap(examId);
      setSubjects(res.data.subjects || []);
    } catch (err) {
      console.error('Failed to load subjects');
    }
  };

  const loadTopics = async (subjectId) => {
    const foundSub = subjects.find(s => s.id === Number(subjectId));
    if (foundSub && foundSub.topics) {
      setTopics(foundSub.topics);
    } else {
      setTopics([]);
    }
  };

  const loadResources = async () => {
    try {
      const res = await competitiveAPI.getResources({
        search,
        exam_id: selectedExam,
        subject_id: selectedSubject,
        topic_id: selectedTopic,
        resource_type: selectedType,
        difficulty: selectedDifficulty,
        sort: sortOption,
        only_bookmarked: onlyBookmarks ? 'true' : 'false'
      });
      setResources(res.data.resources || res.data.materials || []);
    } catch (err) {
      console.error('Failed to load resources');
    }
  };

  const handleOpenResource = async (resObj) => {
    try {
      await competitiveAPI.trackResourceClick(resObj.id);
    } catch (err) {
      // Ignore click tracking error
    }
    const targetUrl = resObj.url || resObj.file_url;
    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleToggleBookmark = async (resId) => {
    try {
      await competitiveAPI.toggleResourceBookmark(resId);
      loadResources();
    } catch (err) {
      console.error('Failed to bookmark resource');
    }
  };

  const getTypeBadge = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('video')) {
      return { label: '🎥 VIDEO', icon: Play, color: 'var(--accent-primary)', bg: 'var(--accent-primary-light)' };
    }
    if (t.includes('article')) {
      return { label: '📖 ARTICLE', icon: FileText, color: 'var(--color-college)', bg: 'var(--color-college-light)' };
    }
    if (t.includes('practice')) {
      return { label: '📝 PRACTICE', icon: FileCode, color: 'var(--warning)', bg: 'rgba(217, 119, 6, 0.12)' };
    }
    if (t.includes('reference')) {
      return { label: '📚 REFERENCE', icon: Book, color: 'var(--success)', bg: 'rgba(22, 163, 74, 0.12)' };
    }
    if (t.includes('paper') || t.includes('pyq')) {
      return { label: '🏆 PREVIOUS PAPER', icon: Award, color: '#9333ea', bg: 'rgba(147, 51, 234, 0.12)' };
    }
    return { label: '🌐 DOCUMENTATION', icon: Globe, color: 'var(--text-secondary)', bg: 'var(--surface-secondary)' };
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span className="badge badge-primary" style={{ marginBottom: '0.4rem' }}>
            <BookOpen size={13} /> Curated Exam Preparation Index
          </span>
          <h1 style={{ fontSize: '1.85rem', marginBottom: '0.25rem' }}>Learning Resources</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Curated resources for your preparation — video lessons, articles, practice tools & reference guides.
          </p>
        </div>

        <button
          onClick={() => setOnlyBookmarks(!onlyBookmarks)}
          className={`btn ${onlyBookmarks ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Star size={16} fill={onlyBookmarks ? '#fff' : 'none'} />
          {onlyBookmarks ? 'Showing Saved Resources' : 'My Saved Resources'}
        </button>
      </div>

      {/* Search & Cascading Filter Controls */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ flex: 2, position: 'relative', minWidth: '220px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search resources..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.4rem' }}
            />
            <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          {/* Exam Selector */}
          <select
            className="form-control"
            style={{ flex: 1, minWidth: '140px' }}
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
          >
            <option value="">All Exams</option>
            {exams.map(e => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>

          {/* Subject Selector (Cascading) */}
          <select
            className="form-control"
            style={{ flex: 1, minWidth: '140px' }}
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            disabled={!selectedExam && subjects.length === 0}
          >
            <option value="">{selectedExam ? 'All Subjects' : 'Select Exam First'}</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>

          {/* Topic Selector (Cascading) */}
          <select
            className="form-control"
            style={{ flex: 1, minWidth: '140px' }}
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            disabled={!selectedSubject && topics.length === 0}
          >
            <option value="">{selectedSubject ? 'All Topics' : 'Select Subject First'}</option>
            {topics.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>

          {/* Type Selector */}
          <select
            className="form-control"
            style={{ flex: 1, minWidth: '130px' }}
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="video">🎥 Video Lessons</option>
            <option value="article">📖 Articles</option>
            <option value="practice">📝 Practice</option>
            <option value="reference">📚 Reference</option>
            <option value="previous_paper">🏆 Previous Paper</option>
            <option value="documentation">🌐 Documentation</option>
          </select>

          {/* Difficulty Selector */}
          <select
            className="form-control"
            style={{ flex: 1, minWidth: '130px' }}
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
          >
            <option value="">All Difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          {/* Sort */}
          <select
            className="form-control"
            style={{ flex: 1, minWidth: '120px' }}
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="popular">Most Opened</option>
          </select>
        </div>
      </div>

      {/* Resource Cards Grid */}
      {resources.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={36} />
          <h3>No Learning Resources Found</h3>
          <p>No curated resources match your selected search and filter criteria.</p>
        </div>
      ) : (
        <div className="grid-3">
          {resources.map(resObj => {
            const badge = getTypeBadge(resObj.resource_type || resObj.material_type);
            const IconComp = badge.icon;

            return (
              <div key={resObj.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  {/* Top Type Badge & Bookmark */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.25rem 0.6rem',
                      borderRadius: '6px',
                      color: badge.color,
                      background: badge.bg,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}>
                      <IconComp size={12} /> {badge.label}
                    </span>

                    <button
                      onClick={() => handleToggleBookmark(resObj.id)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        color: resObj.isBookmarked ? 'var(--warning)' : 'var(--text-muted)',
                        padding: '0.2rem'
                      }}
                      title={resObj.isBookmarked ? 'Remove Saved Resource' : 'Save Resource'}
                    >
                      <Bookmark size={17} fill={resObj.isBookmarked ? 'var(--warning)' : 'none'} />
                    </button>
                  </div>

                  {/* Title & Tags */}
                  <h3 style={{ fontSize: '1.05rem', marginBottom: '0.4rem', lineHeight: 1.35 }}>{resObj.title}</h3>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.65rem' }}>
                    {resObj.source_name || 'Educational Source'} · <span style={{ textTransform: 'capitalize' }}>{resObj.difficulty || 'Intermediate'}</span>
                  </div>

                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '0.85rem' }}>
                    {resObj.description || 'Curated educational material for structured topic learning.'}
                  </p>
                </div>

                {/* Footer launch button */}
                <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                    👁️ {resObj.clicks_count || 0} visits
                  </span>

                  <button
                    onClick={() => handleOpenResource(resObj)}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.85rem' }}
                  >
                    Open Resource <ExternalLink size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

