import { useRef, useEffect, useState } from 'react';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export default function VideoPlayer({
  activeVideo, activeIndex, videos,
  watchedIds, favorites, queue,
  notes, noteText, setNoteText, showNotes, setShowNotes,
  autoplay, setAutoplay,
  shuffle, setShuffle,
  repeatMode, cycleRepeat,
  playbackSpeed, setPlaybackSpeed,
  sleepAfter, setSleepAfter, sleepCount, setSleepCount,
  showSleepMenu, setShowSleepMenu,
  showSpeedMenu, setShowSpeedMenu,
  focusMode, setFocusMode,
  swipeHint, onTouchStart, onTouchEnd,
  videoEnded, setVideoEnded,
  selectedSubject, completedSubjects,
  isFav, toggleFavorite, addToQueue, shareVideo,
  saveNote, exportNotes,
  nextVideo, prevVideo,
  handleVideoSelect,
  markSubjectComplete,
  markCurrentWatched,
  loading,
  onVideoEnd,
  toast,
}) {
  const iframeRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const progressPollRef = useRef(null);
  const unlockedRef = useRef(false);
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => { unlockedRef.current = false; setDescExpanded(false); }, [activeVideo?.videoId]);

  // Create YT.Player when activeVideo changes
  useEffect(() => {
    if (!activeVideo) return;
    if (progressPollRef.current) { clearInterval(progressPollRef.current); progressPollRef.current = null; }
    if (ytPlayerRef.current) { try { ytPlayerRef.current.destroy(); } catch {} ytPlayerRef.current = null; }

    const createPlayer = () => {
      if (!iframeRef.current) return;
      try {
        ytPlayerRef.current = new window.YT.Player(iframeRef.current, {
          events: {
            onReady: () => {
              progressPollRef.current = setInterval(() => {
                try {
                  const p = ytPlayerRef.current;
                  if (!p) return;
                  const cur = p.getCurrentTime?.();
                  const dur = p.getDuration?.();
                  if (dur > 0 && cur > 0 && cur / dur >= 0.85) {
                    clearInterval(progressPollRef.current);
                    progressPollRef.current = null;
                    if (!unlockedRef.current) { unlockedRef.current = true; onVideoEnd(); }
                  }
                } catch {}
              }, 2000);
            },
            onStateChange: (e) => {
              if (e.data === 0 && !unlockedRef.current) { unlockedRef.current = true; onVideoEnd(); }
              if (e.data === 1) setVideoEnded(false);
            },
          },
        });
      } catch {}
    };

    if (window.YT?.Player) {
      setTimeout(createPlayer, 300);
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev?.(); setTimeout(createPlayer, 300); };
    }

    return () => {
      if (progressPollRef.current) { clearInterval(progressPollRef.current); progressPollRef.current = null; }
    };
  }, [activeVideo?.videoId]);

  const repeatIcon = repeatMode === 'one' ? '🔂' : repeatMode === 'all' ? '🔁' : '➡️';
  const isSubComplete = completedSubjects.includes(selectedSubject?.name);

  if (!activeVideo) {
    return (
      <div className="player-empty">
        {loading
          ? <><div className="spinner" /><p>வீடியோக்கள் ஏற்றுகிறது...</p></>
          : <p>வீடியோ தேர்ந்தெடுக்கவும்</p>}
      </div>
    );
  }

  return (
    <>
      {/* Video */}
      <div className="video-wrap" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <iframe
          ref={iframeRef}
          id="yt-player-iframe"
          key={activeVideo.videoId + playbackSpeed}
          src={`https://www.youtube.com/embed/${activeVideo.videoId}?autoplay=1&rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&fs=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`}
          title={activeVideo.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        <div className="yt-overlay" />
        <div className="yt-overlay-top" />
        {swipeHint === 'left'  && <div className="swipe-hint swipe-left">⏭ அடுத்த</div>}
        {swipeHint === 'right' && <div className="swipe-hint swipe-right">⏮ முந்தைய</div>}

        {/* End overlay */}
        {videoEnded && activeIndex < videos.length - 1 && (
          <div className="video-end-overlay">
            <div className="veo-icon">✅</div>
            <div className="veo-title">பாடம் முடிந்தது!</div>
            <div className="veo-sub">அடுத்த பாடம் திறக்கப்பட்டது</div>
            <button className="veo-btn" onClick={() => { setVideoEnded(false); handleVideoSelect(videos[activeIndex + 1], activeIndex + 1); }}>
              ▶ அடுத்த பாடம்
            </button>
          </div>
        )}
        {videoEnded && activeIndex === videos.length - 1 && (
          <div className="video-end-overlay">
            <div className="veo-icon">🏆</div>
            <div className="veo-title">அனைத்து பாடங்களும் முடிந்தன!</div>
            <div className="veo-sub">Subject completed</div>
            <button className="veo-btn" onClick={() => { setVideoEnded(false); markSubjectComplete(selectedSubject?.name); }}>
              🏆 Mark Complete
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="player-controls">
        <button className="ctrl-btn" onClick={prevVideo} disabled={activeIndex === 0 && repeatMode === 'none'}>⏮</button>
        <span className="ctrl-pos">{activeIndex + 1} / {videos.length}</span>
        <button className="ctrl-btn" onClick={nextVideo} disabled={!shuffle && activeIndex === videos.length - 1 && repeatMode === 'none' && queue.length === 0}>⏭</button>
        <button className={`ctrl-btn fav-btn ${isFav(activeVideo.videoId) ? 'fav-active' : ''}`} onClick={() => toggleFavorite(activeVideo)}>
          {isFav(activeVideo.videoId) ? '⭐' : '☆'}
        </button>
        <button className={`ctrl-btn ${shuffle ? 'ctrl-active' : ''}`} onClick={() => { setShuffle(s => !s); toast(shuffle ? 'Shuffle off' : '🔀 Shuffle on', 'info'); }}>🔀</button>
        <button className={`ctrl-btn ${repeatMode !== 'none' ? 'ctrl-active' : ''}`} onClick={cycleRepeat}>{repeatIcon}</button>

        {/* Speed */}
        <div className="ctrl-sleep-wrap">
          <button className={`ctrl-btn ${playbackSpeed !== 1 ? 'ctrl-active' : ''}`} onClick={() => setShowSpeedMenu(s => !s)}>⚡{playbackSpeed}x</button>
          {showSpeedMenu && (
            <div className="sleep-menu">
              <div className="sleep-title">Speed:</div>
              {SPEEDS.map(s => (
                <button key={s} className={`sleep-opt ${playbackSpeed === s ? 'active' : ''}`}
                  onClick={() => { setPlaybackSpeed(s); setShowSpeedMenu(false); toast(`⚡ Speed: ${s}x`, 'info'); }}>
                  {s}x{s === 1 ? ' (normal)' : ''}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sleep */}
        <div className="ctrl-sleep-wrap">
          <button className={`ctrl-btn ${sleepAfter > 0 ? 'ctrl-active' : ''}`} onClick={() => setShowSleepMenu(s => !s)}>
            😴{sleepAfter > 0 ? ` ${sleepAfter - sleepCount}` : ''}
          </button>
          {showSleepMenu && (
            <div className="sleep-menu">
              <div className="sleep-title">Stop after:</div>
              {[0, 1, 2, 3, 5, 10].map(n => (
                <button key={n} className={`sleep-opt ${sleepAfter === n ? 'active' : ''}`}
                  onClick={() => { setSleepAfter(n); setSleepCount(0); setShowSleepMenu(false); toast(n === 0 ? 'Sleep timer off' : `Sleep after ${n} videos`, 'info'); }}>
                  {n === 0 ? 'Off' : `${n} videos`}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="ctrl-btn" onClick={shareVideo} title="Share">🔗</button>
        <button className="ctrl-btn" onClick={() => addToQueue(activeVideo)} title="Add to queue">+Q</button>
        <button className={`ctrl-btn ${watchedIds.includes(activeVideo.videoId) ? 'ctrl-active' : ''}`} onClick={markCurrentWatched} title="Mark watched (M)">✓</button>
        <button className={`ctrl-btn ${focusMode ? 'ctrl-active' : ''}`} onClick={() => setFocusMode(s => !s)} title="Focus mode">🎯</button>
        <label className="ctrl-toggle">
          <input type="checkbox" checked={autoplay} onChange={e => setAutoplay(e.target.checked)} />
          <span>Auto</span>
        </label>
        <button className="ctrl-btn" onClick={() => setShowNotes(s => !s)}>
          📝{Object.keys(notes).length > 0 && <span className="note-count">{Object.keys(notes).length}</span>}
        </button>
        <button className="ctrl-btn" onClick={() => iframeRef.current?.requestFullscreen?.()}>⛶</button>
      </div>

      {/* Notes panel */}
      {showNotes && (
        <div className="notes-panel">
          <div className="notes-hdr">📝 {activeVideo.title.slice(0, 50)}</div>
          <textarea
            className="notes-area"
            placeholder="இங்கே குறிப்புகள் எழுதவும்..."
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            rows={4}
            maxLength={2000}
          />
          <div className="notes-actions">
            <button className="notes-save" onClick={saveNote}>💾 Save</button>
            <button className="notes-export" onClick={exportNotes}>📥 Export All</button>
            {notes[activeVideo.videoId] && <span className="notes-saved">✓ Saved</span>}
            <span className="notes-char-count">{noteText.length}/2000</span>
          </div>
        </div>
      )}

      {/* Video info */}
      <div className="video-info">
        <h2 className="v-title">{activeVideo.title}</h2>
        <div className="v-meta-row">
          <span className="v-channel">📺 {activeVideo.channelTitle}</span>
          {activeVideo.publishedAt && (
            <span className="v-date">📅 {new Date(activeVideo.publishedAt).toLocaleDateString('ta-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          )}
          {watchedIds.includes(activeVideo.videoId) && <span className="watched-badge">✓ Watched</span>}
          {isFav(activeVideo.videoId) && <span className="fav-badge">⭐ Favorite</span>}
          {queue.length > 0 && <span className="queue-badge">📋 {queue.length} queued</span>}
        </div>
        {activeVideo.description && (
          <div className="v-desc-wrap">
            <p className="v-desc">
              {descExpanded ? activeVideo.description : activeVideo.description.slice(0, 200)}
              {activeVideo.description.length > 200 && !descExpanded && '...'}
            </p>
            {activeVideo.description.length > 200 && (
              <button className="v-desc-toggle" onClick={() => setDescExpanded(s => !s)}>
                {descExpanded ? '▲ குறைக்கவும்' : '▼ மேலும் படிக்கவும்'}
              </button>
            )}
          </div>
        )}
        {selectedSubject && !isSubComplete && (
          <button className="mark-complete-btn" onClick={() => markSubjectComplete(selectedSubject.name)}>
            🏆 Mark Subject Complete
          </button>
        )}
        {selectedSubject && isSubComplete && (
          <div className="complete-banner">🏆 Subject Completed!</div>
        )}
      </div>
    </>
  );
}
