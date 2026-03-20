export default function Modals({
  showShortcuts, showStats, showHistory, showGlobalSearch, showQueue,
  closeModals,
  globalSearch, setGlobalSearch, globalSearchRef, globalResults,
  CLASSES, setSelectedClass, openSubject,
  watchStats, favorites, notes, streak, completedSubjects, streakDays,
  watchedIds, setWatchedIds, setWatchStats, setStreakDays, setCompletedSubjects,
  recentlyWatched, clearHistory,
  queue, setQueue,
  setActiveVideo, setView,
  exportNotes,
  setTheme, theme,
  toast,
}) {
  if (!showShortcuts && !showStats && !showHistory && !showGlobalSearch && !showQueue) return null;

  return (
    <>
      {/* Global Search */}
      {showGlobalSearch && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr">
              <span>🔍 Global Search</span>
              <button onClick={closeModals}>✕</button>
            </div>
            <input
              ref={globalSearchRef}
              className="global-search-input"
              placeholder="Search class or subject... e.g. 10, கணிதம்"
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
              autoFocus
            />
            <div className="global-results">
              {globalSearch.trim().length < 2 && <p className="gs-hint">Type at least 2 characters to search</p>}
              {globalResults.length === 0 && globalSearch.trim().length >= 2 && <p className="gs-hint">No results found</p>}
              {globalResults.map((item, i) => (
                <button key={i} className="gs-item" onClick={() => {
                  closeModals(); setGlobalSearch('');
                  const cls = CLASSES.find(c => c.class === item.classNum);
                  if (cls) { setSelectedClass(cls); openSubject({ name: item.name, icon: item.icon, id: item.id }); }
                }}>
                  <span className="gs-icon">{item.icon}</span>
                  <div>
                    <div className="gs-name">{item.name}</div>
                    <div className="gs-class">{item.classLabel}</div>
                  </div>
                  <span className="gs-arrow">›</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Shortcuts */}
      {showShortcuts && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr"><span>⌨️ Keyboard Shortcuts</span><button onClick={closeModals}>✕</button></div>
            <div className="shortcut-list">
              {[
                ['→ / N', 'Next video'], ['← / P', 'Previous video'],
                ['F', 'Favorite'], ['M', 'Mark watched'],
                ['Z', 'Focus mode'], ['Q', 'Toggle queue'],
                ['/', 'Global search'], ['?', 'Shortcuts'], ['Esc', 'Close'],
              ].map(([k, v]) => (
                <div key={k} className="shortcut-row"><kbd>{k}</kbd><span>{v}</span></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      {showStats && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr"><span>📊 Learning Stats</span><button onClick={closeModals}>✕</button></div>
            <div className="stats-grid">
              {[
                [watchStats.totalWatched, 'Videos Watched'],
                [favorites.length, 'Favorites'],
                [Object.keys(notes).length, 'Notes Saved'],
                [watchStats.subjectsCovered.length, 'Subjects Covered'],
                [`${streak > 0 ? '🔥' : ''}${streak}`, 'Day Streak'],
                [completedSubjects.length, 'Completed Subjects'],
              ].map(([num, label]) => (
                <div key={label} className="stat-card">
                  <div className="stat-num">{num}</div>
                  <div className="stat-label">{label}</div>
                </div>
              ))}
            </div>
            {watchStats.subjectsCovered.length > 0 && (
              <div className="stats-subjects">
                <div className="stats-sub-title">Subjects Covered:</div>
                <div className="stats-chips">
                  {watchStats.subjectsCovered.map(s => <span key={s} className="stats-chip">{s}</span>)}
                </div>
              </div>
            )}
            {completedSubjects.length > 0 && (
              <div className="stats-subjects">
                <div className="stats-sub-title">🏆 Completed:</div>
                <div className="stats-chips">
                  {completedSubjects.map(s => <span key={s} className="stats-chip stats-chip-gold">{s}</span>)}
                </div>
              </div>
            )}
            <div className="stats-actions">
              <button className="stats-export-btn" onClick={exportNotes}>📥 Export Notes</button>
              <button className="stats-reset-btn" onClick={() => {
                setWatchStats({ totalWatched: 0, subjectsCovered: [] });
                setWatchedIds([]); setStreakDays([]); setCompletedSubjects([]);
                toast('Stats reset', 'info'); closeModals();
              }}>🗑 Reset</button>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {showHistory && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr">
              <span>🕐 Recently Watched ({recentlyWatched.length})</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="hist-clear" onClick={clearHistory}>Clear</button>
                <button onClick={closeModals}>✕</button>
              </div>
            </div>
            {recentlyWatched.length === 0 && <p className="gs-hint">No history yet</p>}
            <div className="history-list">
              {recentlyWatched.map((v, i) => (
                <button key={i} className="hist-item" onClick={() => { setActiveVideo(v); setView('player'); closeModals(); }}>
                  <img src={v.thumbnail} alt={v.title} className="hist-thumb" />
                  <div className="hist-meta">
                    <div className="hist-title">{v.title}</div>
                    <div className="hist-sub">{v.plTitle} · {new Date(v.watchedAt).toLocaleDateString()}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Queue modal */}
      {showQueue && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr">
              <span>📋 Queue ({queue.length})</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {queue.length > 0 && <button className="hist-clear" onClick={() => { setQueue([]); toast('Queue cleared', 'info'); }}>Clear</button>}
                <button onClick={closeModals}>✕</button>
              </div>
            </div>
            {queue.length === 0 && <p className="gs-hint">Queue is empty. Add videos with the + button in the playlist.</p>}
            <div className="history-list">
              {queue.map((v, i) => (
                <div key={v.videoId} className="hist-item">
                  <span className="vnum" style={{ padding: '0 6px' }}>{i + 1}</span>
                  <img src={v.thumbnail} alt={v.title} className="hist-thumb" />
                  <div className="hist-meta">
                    <div className="hist-title">{v.title}</div>
                    <div className="hist-sub">{v.channelTitle}</div>
                  </div>
                  <button className="note-del" onClick={() => setQueue(prev => prev.filter(x => x.videoId !== v.videoId))}>🗑</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
