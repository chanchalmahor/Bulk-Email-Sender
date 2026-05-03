# MailBlast v2.0 — Bulk Email Sender

A full-stack email campaign tool with AI email generation, scheduling, analytics, and a beautiful React UI.

## Tech Stack
- **Backend**: FastAPI + SQLite (via SQLAlchemy)
- **Frontend**: React + Vite + Recharts
- **AI**: Claude API (Anthropic)
- **Deploy**: Docker + Docker Compose

---

## Run Locally (Without Docker)

### 1. Backend
```bash
cd mailblast

# Install Python deps
pip install -r requirements.txt

# Set your API key (for AI feature)
export ANTHROPIC_API_KEY=your_key_here

# Start the API server
uvicorn backend.main:app --reload --port 8000
```

API runs at: http://localhost:8000
Docs at: http://localhost:8000/docs

### 2. Frontend
```bash
cd frontend

# Install Node deps
npm install

# Start dev server
npm run dev
```

UI runs at: http://localhost:3000

---

## Run with Docker

```bash
# Set your key
export GEMINI_API_KEY=your_key_here

# Build and start both services
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000

---

## Gmail App Password Setup
1. Go to myaccount.google.com/security
2. Enable 2-Step Verification
3. Search "App Passwords" → create one
4. Paste the 16-character password in the app Setup tab

---

## Features
- Send bulk emails with CSV upload
- AI-generated email bodies (Claude API)
- Template library with tags
- Campaign scheduling
- Analytics dashboard with charts
- Dry run mode for testing
- Full email logs with status tracking
