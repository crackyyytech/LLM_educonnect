import { useState, useEffect } from 'react';
import axios from 'axios';

export default function TeacherPanel({ onClose, user, classesData, toast }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [sortBy, setSortBy]     = useState('name'); // name | watched | streak

  useEffect(() => {
    axios.get('/api/auth/my-students')
      .then(res => setStudents(res.data.students))
      .catch(() => toast('Failed to load students', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = students
    .filter(s =>
      !search.trim() ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'watched') return (b.watchedIds?.length || 0) - (a.watchedIds?.length || 0);
      if (sortBy === 'streak')  return (b.streakDays?.length || 0) - (a.streakDays?.length || 0);
      return a.name.localeCompare(b.name);
    });

  const totalWatched = students.reduce((s, u) => s + (u.watchedIds?.length || 0), 0);
  const avgWatched   = students.length ? Math.round(totalWatched / students.length) : 0;
  const activeCount  = students.filter(s => s.streakDays?.length > 0).length;

  return (
    <div className="manage-overlay" onClick={onClose}>
      <div className="manage-panel teacher-panel" onClick={e => e.stopPropagation()}>
        <div className="manage-hdr">
          <div>
            <div className="manage-title">👩‍🎓 My Students</div>
            <div className="manage-sub">
              {user.subject ? `Subject: ${user.subject}` : 'All assigned students'}
              {user.classNum ? ` · Class ${user.classNum}` : ''}
            </div>
          </div>
          <button className="manage-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Stats row */}
        <div className="tp-stats-row">
          <div className="tp-stat">
            <div className="tp-stat-val">{students.length}</div>
            <div className="tp-stat-lbl">Total Students</div>
          </div>
          <div className="tp-stat">
            <div className="tp-stat-val">{avgWatched}</div>
            <div className="tp-stat-lbl">Avg Videos Watched</div>
          </div>
          <div className="tp-stat">
            <div className="tp-stat-val">{activeCount}</div>
            <div className="tp-stat-lbl">Active Learners</div>
          </div>
          <div className="tp-stat">
            <div className="tp-stat-val">{totalWatched}</div>
            <div className="tp-stat-lbl">Total Videos Watched</div>
          </div>
        </div>

        {/* Controls */}
        <div className="tp-controls">
          <input
            className="manage-input"
            placeholder="🔍 Search students..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          <select
            className="manage-input"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="name">Sort: Name</option>
            <option value="watched">Sort: Most Watched</option>
            <option value="streak">Sort: Streak Days</option>
          </select>
        </div>

        {/* Student list */}
        {loading ? (
          <div className="tp-loading">Loading students...</div>
        ) : filtered.length === 0 ? (
          <div className="manage-empty">
            {students.length === 0
              ? 'No students assigned to you yet.'
              : 'No students match your search.'}
          </div>
        ) : (
          <div className="tp-student-list">
            {filtered.map(s => {
              const watched  = s.watchedIds?.length || 0;
              const streak   = s.streakDays?.length || 0;
              const completed = s.completedSubjects?.length || 0;
              const isActive = s.isActive;
              return (
                <div key={s._id} className={`tp-student-row${!isActive ? ' tp-inactive' : ''}`}>
                  <div className="tp-student-avatar">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="tp-student-info">
                    <div className="tp-student-name">
                      {s.name}
                      {!isActive && <span className="tp-disabled-badge">Disabled</span>}
                    </div>
                    <div className="tp-student-email">{s.email}</div>
                    {s.classNum && <div className="tp-student-class">Class {s.classNum}</div>}
                  </div>
                  <div className="tp-student-stats">
                    <div className="tp-mini-stat" title="Videos watched">
                      <span className="tp-mini-icon">▶</span>
                      <span>{watched}</span>
                    </div>
                    <div className="tp-mini-stat" title="Streak days">
                      <span className="tp-mini-icon">🔥</span>
                      <span>{streak}d</span>
                    </div>
                    <div className="tp-mini-stat" title="Subjects completed">
                      <span className="tp-mini-icon">🏆</span>
                      <span>{completed}</span>
                    </div>
                  </div>
                  <div className="tp-progress-wrap">
                    <div className="tp-progress-bar">
                      <div
                        className="tp-progress-fill"
                        style={{ width: Math.min(watched * 5, 100) + '%' }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
