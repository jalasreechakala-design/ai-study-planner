import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Users, Compass, BookOpen, HelpCircle, FileCheck, Award, ShieldAlert, Bell, Layers, CheckSquare } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await adminAPI.getStats();
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load admin stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="page-wrapper" style={{ padding: '3rem 1.5rem' }}>
        <div className="skeleton" style={{ height: '100px', marginBottom: '1.5rem' }}></div>
        <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
          <div className="skeleton" style={{ height: '90px' }}></div>
          <div className="skeleton" style={{ height: '90px' }}></div>
          <div className="skeleton" style={{ height: '90px' }}></div>
          <div className="skeleton" style={{ height: '90px' }}></div>
        </div>
      </div>
    );
  }

  const s = stats.stats;

  return (
    <div className="page-wrapper">
      {/* Header Banner */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--surface-secondary)', borderLeft: '4px solid var(--danger)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
              <ShieldAlert size={15} /> System Administration Workspace
            </div>
            <h1 style={{ fontSize: '1.85rem', margin: 0 }}>Admin Platform Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Manage competitive exams, study material catalog, quizzes, student accounts & platform announcements.
            </p>
          </div>
        </div>
      </div>

      {/* Primary Management Metrics */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Students</span>
              <h2 style={{ fontSize: '1.75rem', marginTop: '0.2rem', color: 'var(--accent-primary)' }}>{s.totalStudents}</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered student accounts</span>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--accent-primary-light)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} />
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Exam Streams</span>
              <h2 style={{ fontSize: '1.75rem', marginTop: '0.2rem', color: 'var(--color-college)' }}>{s.totalExams}</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>GATE, UPSC, JEE, etc.</span>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--color-college-light)', color: 'var(--color-college)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Compass size={20} />
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Study Materials</span>
              <h2 style={{ fontSize: '1.75rem', marginTop: '0.2rem', color: 'var(--success)' }}>{s.totalMaterials}</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PDFs, PPTs & Notes</span>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(22, 163, 74, 0.12)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={20} />
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Question Bank</span>
              <h2 style={{ fontSize: '1.75rem', marginTop: '0.2rem', color: 'var(--warning)' }}>{s.totalQuestions}</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>MCQ bank items</span>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(217, 119, 6, 0.12)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HelpCircle size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <span style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Subjects Catalog</span>
          <h3 style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>{s.totalSubjects}</h3>
        </div>
        <div className="card">
          <span style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Topics</span>
          <h3 style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>{s.totalTopics}</h3>
        </div>
        <div className="card">
          <span style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Published Quizzes</span>
          <h3 style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>{s.totalQuizzes}</h3>
        </div>
        <div className="card">
          <span style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Full Mock Tests</span>
          <h3 style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>{s.totalMockTests}</h3>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid-2">
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Study Materials Content Distribution</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.charts.materialsByExam}>
                <XAxis dataKey="examTitle" stroke="var(--text-secondary)" fontSize={12} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} />
                <Tooltip contentStyle={{ background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)' }} />
                <Bar dataKey="count" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Student Platform Mode Usage</h3>
          <div style={{ width: '100%', height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.charts.studentsByPlatform} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label>
                  <Cell fill="var(--color-college)" />
                  <Cell fill="var(--color-competitive)" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

