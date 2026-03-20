import { useState } from 'react';
import { useAuth } from '../context/useAuth.js';

const ROLES = [
  { id: 'student', label: 'மாணவர்', labelEn: 'Student', icon: '🎓', desc: 'Watch lessons, track progress, use AI tutor' },
  { id: 'teacher', label: 'ஆசிரியர்', labelEn: 'Teacher', icon: '👨‍🏫', desc: 'Manage playlists, monitor student progress' },
  { id: 'admin',   label: 'நிர்வாகி', labelEn: 'Admin',   icon: '🛡️', desc: 'Full access — users, content, settings' },
];

export default function LoginPage() {
  const { login, register } = useAuth();

  const [mode, setMode]         = useState('role');   // 'role' | 'login' | 'register'
  const [role, setRole]         = useState(null);
  const [error, setError]       = useState('');
  const [busy, setBusy]         = useState(false);

  // form fields
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [subject, setSubject]   = useState('');
  const [classNum, setClassNum] = useState('');

  const selectRole = (r) => { setRole(r); setMode('login'); setError(''); setDbDown(false); };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally { setBusy(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    setError(''); setBusy(true);
    try {
      await register({ name, email, password, role: role.id, subject, classNum: classNum ? Number(classNum) : null });
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally { setBusy(false); }
  };

  return (
    <div className="login-page">
      <div className="login-bg" />

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <span className="login-logo-icon">📚</span>
          <div>
            <div className="login-logo-title">EduConnect</div>
            <div className="login-logo-sub">Suct EduConnect · Class 1–12</div>
          </div>
        </div>

        {/* ── ROLE SELECTION ── */}
        {mode === 'role' && (
          <div className="login-section">
            <div className="login-heading">நீங்கள் யார்? / Who are you?</div>
            <div className="role-grid">
              {ROLES.map(r => (
                <button key={r.id} className="role-card" onClick={() => selectRole(r)}>
                  <span className="role-icon">{r.icon}</span>
                  <div className="role-label">{r.label}</div>
                  <div className="role-label-en">{r.labelEn}</div>
                  <div className="role-desc">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── LOGIN ── */}
        {mode === 'login' && role && (
          <div className="login-section">
            <button className="login-back" onClick={() => { setMode('role'); setError(''); }}>← Back</button>
            <div className="login-role-badge">
              {role.icon} {role.labelEn}
            </div>
            <div className="login-heading">உள்நுழைக / Sign In</div>
            <form className="login-form" onSubmit={handleLogin}>
              <div className="login-field">
                <label>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com" required autoFocus />
              </div>
              <div className="login-field">
                <label>Password</label>
                <div className="pw-wrap">
                  <input type={showPw ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                  <button type="button" className="pw-toggle" onClick={() => setShowPw(s => !s)}>
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              {error && <div className="login-error">{error}</div>}
              <button type="submit" className="login-btn" disabled={busy}>
                {busy ? <span className="login-spin" /> : '🔓 Sign In'}
              </button>
            </form>
            <div className="login-switch">
              Don't have an account?{' '}
              <button onClick={() => { setMode('register'); setError(''); }}>Register</button>
            </div>
          </div>
        )}

        {/* ── REGISTER ── */}
        {mode === 'register' && role && (
          <div className="login-section">
            <button className="login-back" onClick={() => { setMode('login'); setError(''); }}>← Back</button>
            <div className="login-role-badge">{role.icon} {role.labelEn}</div>
            <div className="login-heading">பதிவு செய்க / Register</div>
            <form className="login-form" onSubmit={handleRegister}>
              <div className="login-field">
                <label>Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Your name" required autoFocus />
              </div>
              <div className="login-field">
                <label>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com" required />
              </div>
              <div className="login-field">
                <label>Password</label>
                <div className="pw-wrap">
                  <input type={showPw ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" required minLength={6} />
                  <button type="button" className="pw-toggle" onClick={() => setShowPw(s => !s)}>
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              {role.id === 'teacher' && (
                <div className="login-field">
                  <label>Subject (optional)</label>
                  <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
                    placeholder="e.g. கணிதம், Physics" />
                </div>
              )}
              {role.id === 'student' && (
                <div className="login-field">
                  <label>Class (optional)</label>
                  <input type="number" value={classNum} onChange={e => setClassNum(e.target.value)}
                    placeholder="e.g. 10" min={1} max={12} />
                </div>
              )}
              {error && <div className="login-error">{error}</div>}
              <button type="submit" className="login-btn" disabled={busy}>
                {busy ? <span className="login-spin" /> : '✅ Create Account'}
              </button>
            </form>
            <div className="login-switch">
              Already have an account?{' '}
              <button onClick={() => { setMode('login'); setError(''); }}>Sign In</button>
            </div>
          </div>
        )}

        <div className="login-footer">
          EduConnect © 2026 — Suct EduConnect Educational Platform
        </div>
      </div>
    </div>
  );
}
