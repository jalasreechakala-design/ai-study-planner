import React, { useState, useEffect } from 'react';
import { collegeAPI } from '../../services/api';
import { Clock, Play, Pause, RotateCcw, Coffee, Sparkles } from 'lucide-react';

export default function PomodoroPage() {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('pomodoro'); // pomodoro (25m), short_break (5m), long_break (15m)
  const [subjectName, setSubjectName] = useState('Computer Networks');
  const [sessionCompleted, setSessionCompleted] = useState(false);

  useEffect(() => {
    let interval = null;

    if (isActive) {
      interval = setInterval(() => {
        if (seconds > 0) {
          setSeconds(seconds - 1);
        } else if (minutes > 0) {
          setMinutes(minutes - 1);
          setSeconds(59);
        } else {
          clearInterval(interval);
          setIsActive(false);
          setSessionCompleted(true);
          logSession();
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isActive, minutes, seconds]);

  const logSession = async () => {
    try {
      let dur = 25;
      if (mode === 'short_break') dur = 5;
      else if (mode === 'long_break') dur = 15;

      await collegeAPI.logSession({
        duration_minutes: dur,
        session_type: mode,
        subject_name: subjectName
      });
    } catch (err) {
      console.error('Failed to log session');
    }
  };

  const handleModeChange = (newMode, initialMins) => {
    setMode(newMode);
    setMinutes(initialMins);
    setSeconds(0);
    setIsActive(false);
    setSessionCompleted(false);
  };

  const resetTimer = () => {
    setIsActive(false);
    setSeconds(0);
    if (mode === 'pomodoro') setMinutes(25);
    else if (mode === 'short_break') setMinutes(5);
    else if (mode === 'long_break') setMinutes(15);
    setSessionCompleted(false);
  };

  return (
    <div className="page-wrapper">
      <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>Pomodoro Study Timer ⏱️</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Eliminate distractions, build daily study streaks & record focus time in database.
        </p>

        {/* Timer Presets */}
        <div style={{
          display: 'inline-flex',
          gap: '0.5rem',
          background: 'var(--bg-secondary)',
          padding: '6px',
          borderRadius: '14px',
          marginBottom: '2.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <button
            onClick={() => handleModeChange('pomodoro', 25)}
            className={`btn btn-sm ${mode === 'pomodoro' ? 'btn-primary' : 'btn-secondary'}`}
          >
            🎯 25m Focus Timer
          </button>
          <button
            onClick={() => handleModeChange('short_break', 5)}
            className={`btn btn-sm ${mode === 'short_break' ? 'btn-primary' : 'btn-secondary'}`}
          >
            ☕ 5m Short Break
          </button>
          <button
            onClick={() => handleModeChange('long_break', 15)}
            className={`btn btn-sm ${mode === 'long_break' ? 'btn-primary' : 'btn-secondary'}`}
          >
            🌴 15m Long Break
          </button>
        </div>

        {/* Focus Subject Input */}
        <div className="form-group" style={{ maxWidth: '350px', margin: '0 auto 2rem auto' }}>
          <label style={{ fontSize: '0.85rem' }}>Target Subject</label>
          <input
            type="text"
            className="form-control"
            style={{ textAlign: 'center', fontWeight: 600 }}
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
          />
        </div>

        {/* Timer Clock View */}
        <div className="glass-card" style={{
          padding: '4rem 2rem',
          borderRadius: '30px',
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
          border: '2px solid rgba(99, 102, 241, 0.4)'
        }}>
          <div style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: '6rem',
            fontWeight: 800,
            letterSpacing: '2px',
            color: isActive ? '#818cf8' : 'var(--text-primary)'
          }}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>

          <div style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '0.5rem' }}>
            {isActive ? `🔥 Session Active: ${subjectName}` : (sessionCompleted ? '🎉 Session Completed & Saved to MySQL!' : 'Ready to Start Focus Session')}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', marginTop: '2.5rem' }}>
            <button
              onClick={() => setIsActive(!isActive)}
              className="btn btn-primary"
              style={{ padding: '0.85rem 2.5rem', fontSize: '1.2rem' }}
            >
              {isActive ? <><Pause size={22} /> Pause</> : <><Play size={22} /> Start Timer</>}
            </button>

            <button
              onClick={resetTimer}
              className="btn btn-secondary"
              style={{ padding: '0.85rem 1.5rem' }}
            >
              <RotateCcw size={20} /> Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
