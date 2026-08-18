import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Award, Cpu, BookOpen, Clock, ShieldCheck, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Hero Banner */}
      <section style={{
        padding: '5rem 2rem 4rem 2rem',
        textAlign: 'center',
        background: 'radial-gradient(circle at top, rgba(99, 102, 241, 0.2) 0%, transparent 70%)'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <span className="badge badge-primary" style={{ marginBottom: '1rem', padding: '0.5rem 1rem' }}>
            <Cpu size={14} /> AI-Powered Dual Platform
          </span>
          <h1 style={{ fontSize: '3.2rem', lineHeight: 1.15, marginBottom: '1.5rem' }}>
            Master Your <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>College Academics</span> & Ace <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Competitive Exams</span>
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: 1.6 }}>
            The all-in-one learning OS with integrated task planning, attendance bunk calculator, CGPA predictor, GATE/UPSC/SSC exam roadmaps, study material library, timed mock tests, and smart AI recommendations.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary" style={{ padding: '0.85rem 2rem', fontSize: '1.1rem' }}>
              Get Started as Student <ArrowRight size={20} />
            </Link>
            <Link to="/login" className="btn btn-secondary" style={{ padding: '0.85rem 2rem', fontSize: '1.1rem' }}>
              Student Login
            </Link>
            <Link to="/admin-login" className="btn btn-secondary" style={{ padding: '0.85rem 2rem', fontSize: '1.1rem', borderColor: 'var(--accent-danger)', color: '#f87171' }}>
              <ShieldCheck size={20} /> Admin Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '3rem' }}>Integrated Dual-Engine Platform</h2>

        <div className="grid-2">
          {/* College Card */}
          <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                <GraduationCap size={28} />
              </div>
              <h3 style={{ fontSize: '1.5rem' }}>🎓 College Academic Platform</h3>
            </div>
            <ul style={{ listStyle: 'none', color: 'var(--text-secondary)', lineHeight: 2 }}>
              <li>✅ Subject Attendance Tracker & Bunk Calculator</li>
              <li>✅ SGPA / CGPA Semester Calculator & Grade Predictor</li>
              <li>✅ Pomodoro Focus Sessions & Streak Badges</li>
              <li>✅ Rich Notes Hub & Instant AI Notes Summarizer</li>
              <li>✅ AI Daily Study Timetable Generator</li>
            </ul>
          </div>

          {/* Competitive Card */}
          <div className="glass-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc' }}>
                <Award size={28} />
              </div>
              <h3 style={{ fontSize: '1.5rem' }}>🏆 Competitive Exam Platform</h3>
            </div>
            <ul style={{ listStyle: 'none', color: 'var(--text-secondary)', lineHeight: 2 }}>
              <li>✅ GATE, UPSC, SSC, Banking, JEE, NEET, CAT & State PSCs</li>
              <li>✅ Interactive Syllabus Roadmaps & Completion Tracker</li>
              <li>✅ PDFs, PPTs, Hand-written Notes & PYQ Bank</li>
              <li>✅ Timed Quizzes, Instant Score Feedback & Mock Tests</li>
              <li>✅ AI Recommendation Engine based on weak topics</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
