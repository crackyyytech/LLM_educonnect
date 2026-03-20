import { useState } from 'react';

const ROLE_ICONS = { admin: '🛡️', teacher: '👨‍🏫', student: '🎓' };

export default function Header({
  theme, setTheme,
  selectedClass, selectedSubject,
  view, goHome, goSubjects,
  streak, isOnline,
  onSearch, onStats, onHistory, onExportNotes, onShortcuts,
  queue,
  onCustomPlaylist,
  onManage,
  onTeacherPanel,
  user,
  onLogout,
  onAdminUsers,
}) {
  const [plInput, setPlInput]     = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handlePlSubmit = (e) => {
    e.preventDefault();
    const id = plInput.trim();
    if (!id) return;
    onCustomPlaylist(id);
    setPlInput('');
  };

  const isStudent = user?.role === 'student';

  return (
    <header className="header">
      <button className="logo-btn" onClick={goHome}>
        <span className="logo-icon">📚</span>
        <div>
          <div className="logo-text">EduConnect</div>
          <div className="logo-sub">Suct EduConnect • Class 1–12</div>
        </div>
      </button>

      <nav className="breadcrumb">
        <button className="bc-btn" onClick={goHome}>முகப்பு</button>
        {selectedClass && (
          <>
            <span className="bc-sep">›</span>
            <button className="bc-btn" onClick={goSubjects}>{selectedClass.label}</button>
          </>
        )}
        {view === 'player' && selectedSubject && (
          <>
            <span className="bc-sep">›</span>
            <span className="bc-cur">{selectedSubject.name}</span>
          </>
        )}
      </nav>

      {/* Custom playlist input — hidden for students */}
      {!isStudent && (
        <form className="hdr-pl-form" onSubmit={handlePlSubmit}>
          <input
            className="hdr-pl-input"
            placeholder="Playlist ID..."
            value={plInput}
            onChange={e => setPlInput(e.target.value)}
          />
          <button type="submit" className="hdr-pl-btn" disabled={!plInput.trim()}>▶</button>
        </form>
      )}

      <div className="hdr-actions">
        {streak > 0 && <span className="streak-badge" title="Learning streak">🔥 {streak}d</span>}
        {/* Role badge for students */}
        {isStudent && user?.classNum && (
          <span className="role-badge student-badge" title="Your class">🎓 Class {user.classNum}</span>
        )}
        {user?.role === 'teacher' && user?.subject && (
          <span className="role-badge teacher-badge" title="Your subject">👨‍🏫 {user.subject}</span>
        )}
        {!isOnline && <span className="offline-dot" title="Offline">📵</span>}
        {queue.length > 0 && <span className="queue-dot" title={`${queue.length} in queue`}>📋{queue.length}</span>}
        <button className="icon-btn" onClick={onSearch} title="Search (/)">🔍</button>
        <button className="icon-btn" onClick={onStats} title="Stats">📊</button>
        <button className="icon-btn" onClick={onHistory} title="History">🕐</button>
        <button className="icon-btn" onClick={onExportNotes} title="Export notes">📥</button>
        <button className="icon-btn" onClick={onShortcuts} title="Shortcuts (?)">⌨️</button>
        {user?.role === 'teacher' && (
          <button className="icon-btn" onClick={onTeacherPanel} title="My Students">👩‍🎓</button>
        )}
        {(user?.role === 'admin' || user?.role === 'teacher') && (
          <button className="icon-btn" onClick={onManage} title="Manage subjects">⚙️</button>
        )}
        {user?.role === 'admin' && (
          <button className="icon-btn" onClick={onAdminUsers} title="Manage users">👥</button>
        )}
        <button className="icon-btn" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* User menu */}
        {user && (
          <div className="user-menu-wrap">
            <button className="user-avatar-btn" onClick={() => setShowUserMenu(s => !s)}>
              <span className="user-avatar-icon">{ROLE_ICONS[user.role]}</span>
              <span className="user-avatar-name">{user.name.split(' ')[0]}</span>
            </button>
            {showUserMenu && (
              <div className="user-menu" onClick={() => setShowUserMenu(false)}>
                <div className="user-menu-info">
                  <div className="user-menu-name">{user.name}</div>
                  <div className="user-menu-email">{user.email}</div>
                  <div className="user-menu-role">{ROLE_ICONS[user.role]} {user.role}</div>
                  {isStudent && user.classNum && <div className="user-menu-class">Class {user.classNum}</div>}
                  {user.role === 'teacher' && user.subject && <div className="user-menu-class">{user.subject}</div>}
                </div>
                <div className="user-menu-divider" />
                <button className="user-menu-item" onClick={onLogout}>🚪 Sign Out</button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
