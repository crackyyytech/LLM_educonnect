require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { seed: seedLocalDb } = require('./localDb');

const app = express();
const PORT = process.env.PORT || 5000;
const YT_API_KEY = process.env.YOUTUBE_API_KEY;
const YT_BASE = 'https://www.googleapis.com/youtube/v3';
const MONGO_URI = process.env.MONGO_URI;

// ── MongoDB with local fallback ──
let usingLocalDb = false;

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 30000,
})
  .then(() => console.log('✅ MongoDB Atlas connected'))
  .catch(err => {
    console.warn('⚠️  MongoDB Atlas unreachable:', err.message);
    console.log('📁 Falling back to local JSON database...');
    usingLocalDb = true;
    seedLocalDb();
  });

// ── Gemini AI ──
const genAI = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// ── In-memory cache (TTL: 30 min) ──
const cache = new Map();
const CACHE_TTL = 30 * 60 * 1000;

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { cache.delete(key); return null; }
  return entry.data;
}
function cacheSet(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

app.use(cors());
app.use(express.json());

// ── Auth routes ──
const authRouter = require('./routes/auth');
app.use('/api/auth', (req, res, next) => {
  if (mongoose.connection.readyState !== 1 && !usingLocalDb) {
    return res.status(503).json({ error: 'Database not connected. Ensure MongoDB is running.' });
  }
  next();
});
app.use('/api/auth', (req, res, next) => { req.usingLocalDb = usingLocalDb; next(); });
app.use('/api/auth', authRouter);

// GET /api/playlist/:playlistId
app.get('/api/playlist/:playlistId', async (req, res) => {
  const { playlistId } = req.params;
  const { pageToken = '' } = req.query;
  const cacheKey = `playlist:${playlistId}:${pageToken}`;

  const cached = cacheGet(cacheKey);
  if (cached) return res.json({ ...cached, fromCache: true });

  try {
    const [playlistRes, itemsRes] = await Promise.all([
      axios.get(`${YT_BASE}/playlists`, {
        params: { part: 'snippet', id: playlistId, key: YT_API_KEY },
      }),
      axios.get(`${YT_BASE}/playlistItems`, {
        params: {
          part: 'snippet,contentDetails',
          playlistId,
          maxResults: 20,
          pageToken,
          key: YT_API_KEY,
        },
      }),
    ]);

    const playlistInfo = playlistRes.data.items?.[0]?.snippet || null;
    const videos = itemsRes.data.items
      .filter(item => item.snippet.title !== 'Deleted video' && item.snippet.title !== 'Private video')
      .map(item => ({
        videoId: item.contentDetails.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
        publishedAt: item.snippet.publishedAt,
        channelTitle: item.snippet.channelTitle,
      }));

    const result = {
      playlistInfo,
      videos,
      nextPageToken: itemsRes.data.nextPageToken || null,
      totalResults: itemsRes.data.pageInfo?.totalResults || 0,
    };

    cacheSet(cacheKey, result);
    res.json(result);
  } catch (err) {
    const status = err.response?.status || 500;
    const message = err.response?.data?.error?.message || 'Server error';
    res.status(status).json({ error: message });
  }
});

// GET /api/channel/:channelId/playlists
app.get('/api/channel/:channelId/playlists', async (req, res) => {
  const { channelId } = req.params;
  const { pageToken = '' } = req.query;
  const cacheKey = `channel:${channelId}:${pageToken}`;

  const cached = cacheGet(cacheKey);
  if (cached) return res.json({ ...cached, fromCache: true });

  try {
    const response = await axios.get(`${YT_BASE}/playlists`, {
      params: { part: 'snippet,contentDetails', channelId, maxResults: 50, pageToken, key: YT_API_KEY },
    });
    const result = {
      playlists: response.data.items.map(item => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        itemCount: item.contentDetails.itemCount,
        thumbnail: item.snippet.thumbnails?.medium?.url,
      })),
      nextPageToken: response.data.nextPageToken || null,
      totalResults: response.data.pageInfo?.totalResults || 0,
    };
    cacheSet(cacheKey, result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.response?.data?.error?.message || 'Failed' });
  }
});

// GET /api/video/:videoId
app.get('/api/video/:videoId', async (req, res) => {
  const { videoId } = req.params;
  const cacheKey = `video:${videoId}`;
  const cached = cacheGet(cacheKey);
  if (cached) return res.json({ ...cached, fromCache: true });

  try {
    const response = await axios.get(`${YT_BASE}/videos`, {
      params: { part: 'snippet,statistics', id: videoId, key: YT_API_KEY },
    });
    const video = response.data.items?.[0];
    if (!video) return res.status(404).json({ error: 'Video not found' });
    cacheSet(cacheKey, video);
    res.json(video);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch video details' });
  }
});

// GET /api/cache/stats
app.get('/api/cache/stats', (_req, res) => {
  res.json({ entries: cache.size, keys: [...cache.keys()] });
});

// POST /api/tutor — AI Tutor (Gemini)
app.post('/api/tutor', async (req, res) => {
  if (!genAI) {
    return res.status(503).json({ error: 'AI Tutor not configured. Add GEMINI_API_KEY to server/.env' });
  }

  const { question, subject, classNum, classLabel, videoTitle, videoDescription, history, lang } = req.body;
  if (!question?.trim()) return res.status(400).json({ error: 'Question is required' });

  const isTamil = lang === 'ta';

  const systemPrompt = `You are an expert AI tutor for Tamil Nadu Samacheer Kalvi curriculum (KalviTV).
You are currently helping a student with: ${classLabel || `Class ${classNum}`} — ${subject}.
${videoTitle ? `The student is watching: "${videoTitle}".` : ''}
${videoDescription ? `Video context: ${videoDescription.slice(0, 300)}` : ''}

Rules:
- Answer ONLY questions related to this subject and Samacheer Kalvi syllabus.
- If asked about unrelated topics, politely redirect to the subject.
- Be encouraging, clear, and student-friendly.
- Use simple language appropriate for the class level.
- ${isTamil ? 'Respond in Tamil (தமிழில் பதில் அளிக்கவும்). Use Tamil script.' : 'Respond in English.'}
- For math/science, show step-by-step solutions.
- Keep answers concise but complete (max 300 words).
- Use bullet points or numbered steps when helpful.`;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: { parts: [{ text: systemPrompt }] },
    });

    // Build chat history for context
    const chatHistory = (history || []).slice(-6).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

    const chat = model.startChat({ history: chatHistory });

    // Stream the response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const result = await chat.sendMessageStream(question);
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Tutor error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'AI Tutor error' });
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
});

app.listen(PORT, () => {
  console.log(`Tamil App Server running on http://localhost:${PORT}`);
});
