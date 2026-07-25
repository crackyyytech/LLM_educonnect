# LLM EduConnect

LLM EduConnect is a full-stack educational video learning platform for Tamil Nadu Samacheer Kalvi students. It combines YouTube lesson playback, progress tracking, teacher/admin workflows, and an AI tutor for guided learning.

## Product Summary

Students can browse class-wise lessons, watch YouTube videos, track progress, save notes, and ask an AI tutor for help. Teachers can monitor assigned students. Admins can manage users, platform settings, and announcements.

## Core Features

### Student

- Class and subject-based video learning
- Sequential unlocks and watched-video tracking
- Favorites, queue, notes export, recent history, and streak tracking
- AI tutor with Tamil/English support
- Playback controls including speed, repeat, shuffle, sleep timer, and focus mode
- Dark and light theme support

### Teacher

- Student progress overview
- Watched-video and completed-subject monitoring
- Subject playlist management

### Admin

- User create/edit/delete and bulk actions
- Role and account-status management
- Platform statistics and CSV export
- Announcements and platform settings

## Tech Stack

| Area | Tools |
| --- | --- |
| Frontend | React 18, Vite |
| Backend | Node.js, Express |
| Database | MongoDB Atlas, JSON fallback |
| Auth | JWT, bcryptjs |
| AI | Google Gemini API |
| Video | YouTube Data API v3, YouTube IFrame API |

## Architecture

```text
React client
  -> AuthContext + local learning state
  -> Vite proxy to Express API
  -> JWT-protected auth/user routes
  -> YouTube playlist/video routes
  -> Gemini tutor route
  -> MongoDB Atlas or JSON fallback store
```

## Project Structure

```text
client/    React frontend, components, data, hooks, and app shell
server/    Express API, auth middleware, routes, models, and local DB fallback
```

## Local Setup

### Server

```bash
git clone https://github.com/crackyyytech/LLM_educonnect.git
cd LLM_educonnect/server
cp .env.example .env
npm install
npm run dev
```

### Client

```bash
cd ../client
npm install
npm run dev
```

The client runs at `http://localhost:3000` and proxies API requests to `http://localhost:5000`.

## Environment Variables

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/kalvi-app
JWT_SECRET=replace-with-a-long-random-secret
YOUTUBE_API_KEY=your_youtube_api_key
GEMINI_API_KEY=your_gemini_api_key
```

## Demo Accounts

These are fallback development accounts for local review.

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@kalvi.com | admin123 |
| Teacher | teacher@kalvi.com | teach123 |
| Student | student@kalvi.com | study123 |

## Recruiter Review Checklist

This project is strongest as a full-stack AI education case study. To make it even easier to review, add screenshots, a demo video, deployment URL, and automated smoke tests for auth and tutor routes.

## Roadmap

- Add screenshots for student, teacher, admin, and tutor flows
- Add API tests for auth, progress sync, and tutor endpoint
- Add CI for install/build checks
- Add content moderation and safety boundaries for tutor responses

## License

MIT
