import { useRef, useEffect } from 'react';

const QUICK_QUESTIONS = {
  'தமிழ்':          ['இந்த பாடத்தின் சுருக்கம் என்ன?', 'முக்கிய கவிஞர்கள் யார்?', 'இலக்கண விதிகள் விளக்கு'],
  'English':         ['Summarize this lesson', 'Explain the grammar rule', 'Key vocabulary words?'],
  'கணிதம்':         ['Explain this concept step by step', 'Give me a practice problem', 'What is the formula?'],
  'அறிவியல்':       ['Explain this experiment', 'What are the key concepts?', 'Real-life applications?'],
  'இயற்பியல்':      ['Explain this law/theorem', 'Derivation steps?', 'Numerical example?'],
  'வேதியியல்':      ['Explain this reaction', 'Balancing equation help?', 'Key properties?'],
  'தாவரவியல்':      ['Explain this process', 'Diagram description?', 'Classification?'],
  'விலங்கியல்':     ['Explain this system', 'Key differences?', 'Life cycle?'],
  'சமூக அறிவியல்': ['Key historical events?', 'Map-based question help', 'Important dates?'],
  'கணினி அறிவியல்':['Explain this algorithm', 'Code example?', 'Key concepts?'],
  default:           ['Explain this topic', 'Give me a summary', 'Practice question?'],
};

export default function Tutor({
  messages, setMessages,
  input, setInput,
  loading, setLoading,
  lang, setLang,
  configured, setConfigured,
  selectedSubject, selectedClass, activeVideo,
}) {
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const quickQs = QUICK_QUESTIONS[selectedSubject?.name] || QUICK_QUESTIONS.default;

  const ask = async (questionOverride) => {
    const q = (questionOverride || input).trim();
    if (!q || loading) return;
    setInput('');

    const userMsg = { role: 'user', text: q, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    const history = messages.slice(-12).map(m => ({ role: m.role === 'user' ? 'user' : 'ai', text: m.text }));

    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          subject: selectedSubject?.name || 'General',
          classNum: selectedClass?.class,
          classLabel: selectedClass?.label,
          videoTitle: activeVideo?.title,
          videoDescription: activeVideo?.description,
          history,
          lang,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        if (res.status === 503) setConfigured(false);
        setMessages(prev => [...prev, { role: 'ai', text: '⚠️ ' + (err.error || 'Error'), ts: Date.now(), isError: true }]);
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let aiText = '';
      const aiMsgId = Date.now();
      setMessages(prev => [...prev, { role: 'ai', text: '', ts: aiMsgId, streaming: true }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const { text, error } = JSON.parse(data);
            if (error) { aiText += '\n⚠️ ' + error; break; }
            if (text) {
              aiText += text;
              setMessages(prev => prev.map(m => m.ts === aiMsgId ? { ...m, text: aiText } : m));
            }
          } catch {}
        }
      }
      setMessages(prev => prev.map(m => m.ts === aiMsgId ? { ...m, streaming: false } : m));
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: '⚠️ Network error. Check server.', ts: Date.now(), isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tutor-panel">
      {/* Header */}
      <div className="tutor-hdr">
        <div className="tutor-hdr-left">
          <span className="tutor-avatar">🤖</span>
          <div>
            <div className="tutor-name">AI Tutor</div>
            <div className="tutor-subject">{selectedSubject?.name || 'General'} · {selectedClass?.label || ''}</div>
          </div>
        </div>
        <div className="tutor-hdr-right">
          <button
            className={`tutor-lang-btn ${lang === 'ta' ? 'active' : ''}`}
            onClick={() => setLang(l => l === 'en' ? 'ta' : 'en')}
          >
            {lang === 'ta' ? 'தமிழ்' : 'EN'}
          </button>
          {messages.length > 0 && (
            <button className="tutor-clear-btn" onClick={() => setMessages([])} title="Clear chat">🗑</button>
          )}
        </div>
      </div>

      {/* Setup warning */}
      {!configured && (
        <div className="tutor-setup">
          <div className="tutor-setup-icon">🔑</div>
          <div className="tutor-setup-title">Setup Required</div>
          <div className="tutor-setup-text">
            Add your Gemini API key to <code>server/.env</code>:<br />
            <code>GEMINI_API_KEY=your_key</code><br />
            Get a free key at <a href="https://aistudio.google.com" target="_blank" rel="noreferrer">aistudio.google.com</a>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="tutor-messages">
        {messages.length === 0 && (
          <div className="tutor-welcome">
            <div className="tutor-welcome-icon">🎓</div>
            <div className="tutor-welcome-title">
              {lang === 'ta' ? 'வணக்கம்! நான் உங்கள் AI ஆசிரியர்.' : "Hello! I'm your AI Tutor."}
            </div>
            <div className="tutor-welcome-sub">
              {lang === 'ta'
                ? `${selectedSubject?.name || 'இந்த பாடம்'} பற்றி எந்த கேள்வியும் கேளுங்கள்.`
                : `Ask me anything about ${selectedSubject?.name || 'this subject'}.`}
            </div>
            <div className="tutor-quick">
              {quickQs.map((q, i) => (
                <button key={i} className="tutor-quick-btn" onClick={() => ask(q)}>{q}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`tutor-msg tutor-msg-${msg.role}${msg.isError ? ' tutor-msg-error' : ''}`}>
            {msg.role === 'ai' && <span className="tutor-msg-avatar">🤖</span>}
            <div className="tutor-msg-bubble">
              <div className="tutor-msg-text">
                {msg.text}{msg.streaming && <span className="tutor-cursor">▋</span>}
              </div>
            </div>
            {msg.role === 'user' && <span className="tutor-msg-avatar tutor-msg-user-avatar">👤</span>}
          </div>
        ))}

        {loading && messages[messages.length - 1]?.role !== 'ai' && (
          <div className="tutor-msg tutor-msg-ai">
            <span className="tutor-msg-avatar">🤖</span>
            <div className="tutor-msg-bubble">
              <div className="tutor-typing"><span /><span /><span /></div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="tutor-input-wrap">
        {messages.length > 0 && messages[messages.length - 1]?.role === 'ai' && !loading && (
          <div className="tutor-quick tutor-quick-inline">
            {quickQs.slice(0, 2).map((q, i) => (
              <button key={i} className="tutor-quick-btn" onClick={() => ask(q)}>{q}</button>
            ))}
          </div>
        )}
        <div className="tutor-input-row">
          <textarea
            ref={inputRef}
            className="tutor-input"
            placeholder={lang === 'ta' ? 'கேள்வி கேளுங்கள்...' : 'Ask a question...'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(); } }}
            rows={2}
            disabled={loading}
          />
          <button className="tutor-send" onClick={() => ask()} disabled={loading || !input.trim()}>
            {loading ? <span className="tutor-spin" /> : '➤'}
          </button>
        </div>
      </div>
    </div>
  );
}
