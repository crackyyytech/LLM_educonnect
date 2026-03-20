import { useState } from 'react';
import Tutor from './Tutor.jsx';

export default function Sidebar({
  sidebarRef,
  sidebarTab, setSidebarTab,
  videos, filteredVideos,
  activeVideo, activeIndex,
  watchedIds, favorites,
  notes, setNotes,
  queue, setQueue,
  recentlyWatched,
  playlistInfo, selectedSubject,
  totalResults, nextPageToken, currentPlId,
  loading,
  sidebarSearch, setSidebarSearch,
  progressPct,
  isUnlocked, trySelectVideo, isFav, toggleFavorite, addToQueue,
  markAllWatched, downloadPlaylist,
  fetchPlaylist,
  exportNotes,
  toast,
  // Tutor props
  tutorMessages, setTutorMessages,
  tutorInput, setTutorInput,
  tutorLoading, setTutorLoading,
  tutorLang, setTutorLang,
  tutorConfigured, setTutorConfigured,
  selectedClass,
}) {
  const [wide, setWide] = useState(false);

  const scrollToCurrent = () => {
    if (!sidebarRef.current || activeIndex < 0) return;
    const items = sidebarRef.current.querySelectorAll('.vitem');
    items[activeIndex]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  return (
    <aside className={`sidebar${wide ? ' sidebar-wide' : ''}`}>
      {/* Tabs */}
      <div className="sidebar-tabs">
        <button className={`stab ${sidebarTab === 'playlist' ? 'active' : ''}`} onClick={() => setSidebarTab('playlist')}>
          📋 {videos.length > 0 && <span className="stab-count">{videos.length}</span>}
        </button>
        <button className={`stab ${sidebarTab === 'favorites' ? 'active' : ''}`} onClick={() => setSidebarTab('favorites')}>
          ⭐ {favorites.length > 0 && <span className="stab-count">{favorites.length}</span>}
        </button>
        <button className={`stab ${sidebarTab === 'notes' ? 'active' : ''}`} onClick={() => setSidebarTab('notes')}>
          📝 {Object.keys(notes).length > 0 && <span className="stab-count">{Object.keys(notes).length}</span>}
        </button>
        <button className={`stab ${sidebarTab === 'queue' ? 'active' : ''}`} onClick={() => setSidebarTab('queue')}>
          🎵 {queue.length > 0 && <span className="stab-count">{queue.length}</span>}
        </button>
        <button className={`stab stab-ai ${sidebarTab === 'tutor' ? 'active' : ''}`} onClick={() => setSidebarTab('tutor')}>
          🤖 AI
        </button>
      </div>

      {/* Playlist tab */}
      {sidebarTab === 'playlist' && (
        <>
          <div className="sidebar-hdr">
            <div className="sidebar-title">{playlistInfo?.title || selectedSubject?.name}</div>
            <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
              <button className="sb-action-btn" onClick={scrollToCurrent} title="Scroll to current">⊙</button>
              <button className="sb-action-btn" onClick={markAllWatched} title="Mark all watched">✓All</button>
              <button className="sb-action-btn" onClick={downloadPlaylist} title="Download">📥</button>
              <button className="sb-action-btn" onClick={() => setWide(w => !w)} title="Toggle width">{wide ? '◂' : '▸'}</button>
              <span className="sidebar-count">{totalResults}</span>
            </div>
          </div>
          {videos.length > 0 && (
            <div className="progress-section">
              <div className="progress-track">
                <div className="progress-fill" style={{ width: progressPct + '%' }} />
              </div>
              <span className="progress-label">{progressPct}% watched</span>
            </div>
          )}
          <div className="sidebar-search">
            <input
              className="sidebar-search-input"
              placeholder="🔍 வீடியோ தேடவும்..."
              value={sidebarSearch}
              onChange={e => setSidebarSearch(e.target.value)}
            />
          </div>
          <ul className="vlist" ref={sidebarRef}>
            {filteredVideos.map((v) => {
              const realIdx = videos.indexOf(v);
              const locked = !isUnlocked(realIdx);
              return (
                <li
                  key={v.videoId + realIdx}
                  className={`vitem ${activeVideo?.videoId === v.videoId ? 'active' : ''} ${locked ? 'vitem-locked' : ''}`}
                  onClick={() => trySelectVideo(v, realIdx)}
                >
                  <span className="vnum">{realIdx + 1}</span>
                  <div className="vthumb-wrap">
                    <img src={v.thumbnail} alt={v.title} className={`vthumb ${locked ? 'vthumb-dim' : ''}`} loading="lazy" />
                    {watchedIds.includes(v.videoId) && <span className="vwatched">✓</span>}
                    {locked && <span className="vlock">🔒</span>}
                  </div>
                  <div className="vmeta">
                    <p className="vtitle">{v.title}</p>
                    <p className="vchan">{locked ? '🔒 Complete previous lesson' : v.channelTitle}</p>
                  </div>
                  <div className="vactions">
                    {activeVideo?.videoId === v.videoId && <span className="vdot">▶</span>}
                    {!locked && (
                      <>
                        <button className={`vfav ${isFav(v.videoId) ? 'on' : ''}`} onClick={e => { e.stopPropagation(); toggleFavorite(v); }}>
                          {isFav(v.videoId) ? '⭐' : '☆'}
                        </button>
                        <button className="vfav" onClick={e => { e.stopPropagation(); addToQueue(v); }} title="Add to queue">+</button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
            {filteredVideos.length === 0 && <li className="vempty">தேடல் முடிவு இல்லை</li>}
          </ul>
          {nextPageToken && (
            <button className="load-more" onClick={() => fetchPlaylist(currentPlId, nextPageToken)} disabled={loading}>
              {loading ? 'ஏற்றுகிறது...' : `+ மேலும் வீடியோக்கள் (${totalResults - videos.length} remaining)`}
            </button>
          )}
        </>
      )}

      {/* Favorites tab */}
      {sidebarTab === 'favorites' && (
        <>
          <div className="sidebar-hdr">
            <div className="sidebar-title">⭐ பிடித்த வீடியோக்கள்</div>
            <span className="sidebar-count">{favorites.length}</span>
          </div>
          <ul className="vlist">
            {favorites.length === 0 && <li className="vempty">இன்னும் எந்த வீடியோவும் சேர்க்கப்படவில்லை</li>}
            {favorites.map((v, i) => (
              <li key={`fav-${v.videoId}`} className={`vitem ${activeVideo?.videoId === v.videoId ? 'active' : ''}`} onClick={() => trySelectVideo(v, videos.indexOf(v))}>
                <span className="vnum">{i + 1}</span>
                <img src={v.thumbnail} alt={v.title} className="vthumb" loading="lazy" />
                <div className="vmeta"><p className="vtitle">{v.title}</p><p className="vchan">{v.channelTitle}</p></div>
                <button className="vfav on" onClick={e => { e.stopPropagation(); toggleFavorite(v); }}>⭐</button>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Notes tab */}
      {sidebarTab === 'notes' && (
        <>
          <div className="sidebar-hdr">
            <div className="sidebar-title">📝 My Notes</div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button className="sb-action-btn" onClick={exportNotes}>📥 Export</button>
              <span className="sidebar-count">{Object.keys(notes).length}</span>
            </div>
          </div>
          <ul className="vlist">
            {Object.keys(notes).length === 0 && <li className="vempty">No notes yet. Watch a video and add notes!</li>}
            {Object.entries(notes).map(([vid, note]) => {
              const v = [...videos, ...favorites, ...recentlyWatched].find(x => x.videoId === vid);
              return (
                <li key={vid} className="note-item" onClick={() => v && trySelectVideo(v, videos.indexOf(v))}>
                  <div className="note-vid-title">{v?.title || vid}</div>
                  <div className="note-text">{note.slice(0, 120)}{note.length > 120 ? '...' : ''}</div>
                  <button className="note-del" onClick={e => {
                    e.stopPropagation();
                    setNotes(prev => { const n = { ...prev }; delete n[vid]; return n; });
                    toast('Note deleted', 'warn');
                  }}>🗑</button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* Queue tab */}
      {sidebarTab === 'queue' && (
        <>
          <div className="sidebar-hdr">
            <div className="sidebar-title">🎵 Up Next Queue</div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {queue.length > 0 && <button className="sb-action-btn" onClick={() => { setQueue([]); toast('Queue cleared', 'info'); }}>Clear</button>}
              <span className="sidebar-count">{queue.length}</span>
            </div>
          </div>
          {queue.length > 0 && (
            <button className="load-more" onClick={() => {
              const next = queue[0];
              setQueue(prev => prev.slice(1));
              trySelectVideo(next, videos.findIndex(v => v.videoId === next.videoId));
              toast('▶ Playing from queue', 'info');
            }}>▶ Play Next</button>
          )}
          <ul className="vlist">
            {queue.length === 0 && <li className="vempty">Queue is empty. Press + on any video to add.</li>}
            {queue.map((v, i) => (
              <li key={`q-${v.videoId}`} className="vitem">
                <span className="vnum">{i + 1}</span>
                <img src={v.thumbnail} alt={v.title} className="vthumb" loading="lazy" />
                <div className="vmeta"><p className="vtitle">{v.title}</p><p className="vchan">{v.channelTitle}</p></div>
                <button className="vfav" onClick={() => setQueue(prev => prev.filter(x => x.videoId !== v.videoId))}>🗑</button>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* AI Tutor tab */}
      {sidebarTab === 'tutor' && (
        <Tutor
          messages={tutorMessages}
          setMessages={setTutorMessages}
          input={tutorInput}
          setInput={setTutorInput}
          loading={tutorLoading}
          setLoading={setTutorLoading}
          lang={tutorLang}
          setLang={setTutorLang}
          configured={tutorConfigured}
          setConfigured={setTutorConfigured}
          selectedSubject={selectedSubject}
          selectedClass={selectedClass}
          activeVideo={activeVideo}
        />
      )}
    </aside>
  );
}
