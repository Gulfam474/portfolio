# Engineer Portfolio

Production-oriented monorepo: FastAPI backend + React/Vite frontend for an AI/backend engineer portfolio with auth, RBAC, CV tools, and a social posts feed.

## Stack

- **Backend:** Python 3.11, FastAPI, SQLAlchemy 2 (async), Alembic, PostgreSQL, Redis, JWT, Google OAuth, LaTeX CV export
- **Frontend:** React 18, Vite, TypeScript, TailwindCSS, TipTap, TanStack Query, Zustand, Framer Motion

## Quick start (Docker)

> Host ports: Postgres `5433`, Redis `6380` (containers still use internal 5432/6379). Change these in `docker-compose.yml` if needed.

```bash
# 1. Copy env files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 2. Edit backend/.env — set SECRET_KEY, OWNER_EMAIL, and optionally
#    GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / SMTP_* for OAuth + email OTP

# 3. Start everything
docker compose up --build

# 4. Open the app
# Frontend: http://localhost:5173
# API docs:  http://localhost:8000/docs
```

Alembic migrations run automatically on backend container start. Roles and a default owner account are seeded on startup:

| Field | Value |
|-------|-------|
| Email | value of `OWNER_EMAIL` (default `owner@example.com`) |
| Username | `owner` |
| Password | `ChangeMe123!` |

## Seed resume / profile data (deploy)

After migrations, load the full resume (personal info, education, experience, skills, projects, certificates) with one SQL script:

```bash
psql "postgresql://postgres:postgres@localhost:5433/engineer_portfolio" \
  -f backend/scripts/seed_resume_data.sql
```

The script is idempotent (safe to re-run). It creates/updates the `owner` user and replaces profile rows. Upload the CV PDF via the UI or `python -m app.seed_resume` if you also need the file on disk.

## Local development (without Docker for app code)

```bash
# Infra
docker compose up postgres redis -d

# Backend (use Python 3.11)
cd backend
/opt/homebrew/bin/python3.11 -m venv .venv   # or: python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Features

- Public CV-style landing page (`/`)
- Register / OTP verify / login / Google OAuth / refresh cookies
- RBAC (`owner`, `admin`, `editor`, `viewer`, `guest`) enforced on API + UI
- Profile CRUD (personal, education, experience, skills, projects)
- CV PDF upload, preview, download, LaTeX-generated export
- Social posts with TipTap rich text, likes, comments
- Admin access matrix for roles and user role assignment

## Notes

- Without SMTP configured, OTP codes are printed to the backend console (`[DEV OTP]`).
- LaTeX export needs `tectonic` or `pdflatex` in the backend environment (included in the backend Dockerfile when available).
- Change the default owner password immediately after first login.

## Free deploy (₹0)

Step-by-step guide for **Vercel + Google Cloud Run + Neon (+ Upstash Redis)** with free `*.vercel.app` / `*.run.app` URLs:

→ See **[DEPLOY.md](./DEPLOY.md)**
