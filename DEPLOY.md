# Free-tier deployment (₹0)

Deploy this monorepo with **no paid plan** (stay within free quotas):

| Piece | Platform | Free URL example |
|-------|----------|------------------|
| Source | GitHub | `https://github.com/<you>/portfolio` |
| Database | [Neon](https://neon.tech) PostgreSQL | connection string only |
| Cache / OTP | [Upstash](https://upstash.com) Redis | needed by this app (still free) |
| Backend | Google Cloud Run | `https://<service>-xxxxxx.<region>.run.app` |
| Frontend | Vercel | `https://<project>.vercel.app` |

> Cloud Run + Neon alone are not enough: this backend stores OTPs and refresh-token blacklist in **Redis**. Upstash’s free Redis tier keeps the stack at ₹0.

---

## 0. Push code to GitHub

```bash
cd /path/to/portfolio
git init   # if not already a repo
git add .
git commit -m "Ready for free-tier deploy"
# Create empty repo on GitHub, then:
git remote add origin https://github.com/<you>/portfolio.git
git branch -M main
git push -u origin main
```

Do **not** commit `.env` files (they are gitignored). Secrets go into Neon / Cloud Run / Vercel dashboards.

---

## 1. Neon PostgreSQL (database)

1. Sign up at [https://console.neon.tech](https://console.neon.tech) (GitHub login is fine).
2. **Create project** → note the region (pick one close to you / to Cloud Run).
3. Open **Dashboard → Connection details**.
4. Copy the connection string. Convert driver for this app:

```text
# Neon UI often shows:
postgresql://USER:PASSWORD@HOST/neondb?sslmode=require

# Use this in Cloud Run (async SQLAlchemy):
postgresql+asyncpg://USER:PASSWORD@HOST/neondb?ssl=require
```

5. (Optional but recommended) In Neon SQL Editor, after the API has run migrations once, seed resume data:

```bash
# From your laptop (replace URI with Neon’s *psycopg* URI, not +asyncpg):
psql "postgresql://USER:PASSWORD@HOST/neondb?sslmode=require" \
  -f backend/scripts/seed_resume_data.sql
```

Or paste the SQL file contents into Neon’s **SQL Editor** and run.

---

## 2. Upstash Redis (OTP + auth blacklist)

1. Sign up at [https://console.upstash.com](https://console.upstash.com).
2. **Create database** → Redis → Free tier → same region family if possible.
3. Copy the **Redis URL** (`rediss://default:...@....upstash.io:6379`).

Use this as `REDIS_URL` on Cloud Run.

---

## 3. Backend on Google Cloud Run

### 3.1 One-time Google Cloud setup

1. Create / select a GCP project: [https://console.cloud.google.com](https://console.cloud.google.com)
2. Enable billing is often required to activate Cloud Run, but the **Cloud Run free tier** covers low traffic (₹0 if you stay under quotas).
3. Enable APIs:
   - Cloud Run
   - Artifact Registry (or Container Registry)
   - Cloud Build (if you deploy from source/GitHub)
4. Install [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) and log in:

```bash
gcloud auth login
gcloud config set project YOUR_GCP_PROJECT_ID
gcloud config set run/region asia-south1   # or us-central1, etc.
```

### 3.2 Build & deploy the container

From the repo root:

```bash
# Build image from backend/ Dockerfile and deploy
gcloud run deploy portfolio-api \
  --source ./backend \
  --region asia-south1 \
  --allow-unauthenticated \
  --port 8000 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 2 \
  --set-env-vars "^@^ENV=production@SECRET_KEY=REPLACE_WITH_LONG_RANDOM@DATABASE_URL=postgresql+asyncpg://USER:PASSWORD@HOST/neondb?ssl=require@REDIS_URL=rediss://default:PASS@HOST:6379@FRONTEND_URL=https://YOUR_VERCEL_APP.vercel.app@OWNER_EMAIL=you@example.com@STORAGE_BACKEND=local@MEDIA_ROOT=/tmp/media@LATEX_OUTPUT_DIR=/tmp/generated_cv@ACCESS_TOKEN_EXPIRE_MINUTES=30@REFRESH_TOKEN_EXPIRE_DAYS=7"
```

Notes:

- `--source ./backend` builds using `backend/Dockerfile` (runs Alembic on start via `scripts/cloudrun_entrypoint.sh`).
- `SECRET_KEY`: generate with `openssl rand -hex 32`.
- `FRONTEND_URL`: set **after** you know the Vercel URL (you can update env later).
- `MEDIA_ROOT=/tmp/media`: Cloud Run disk is **ephemeral** — uploads (avatar, CV, post images) are lost on new revisions. Fine for demo; for permanence add GCS later.
- After first deploy, copy the service URL, e.g.  
  `https://portfolio-api-xxxxxxxx-as.a.run.app`

### 3.3 Update env after Vercel URL is known

```bash
gcloud run services update portfolio-api \
  --region asia-south1 \
  --update-env-vars "FRONTEND_URL=https://your-app.vercel.app,GOOGLE_REDIRECT_URI=https://portfolio-api-xxxxxxxx-as.a.run.app/api/v1/auth/google/callback"
```

### 3.4 Smoke-test API

```bash
curl -s https://portfolio-api-xxxxxxxx-as.a.run.app/docs | head
# or open /docs in the browser
```

Owner account is created on startup from `OWNER_EMAIL` (password default `ChangeMe123!` until you change it). Then run `seed_resume_data.sql` on Neon if you want full resume content.

---

## 4. Frontend on Vercel

1. Sign up at [https://vercel.com](https://vercel.com) with GitHub.
2. **Add New Project** → Import your `portfolio` repo.
3. Configure:

| Setting | Value |
|---------|--------|
| Framework Preset | Vite |
| Root Directory | `frontend` |
| Build Command | `npm run build` (default) |
| Output Directory | `dist` |
| Install Command | `npm install` |

4. **Environment Variables** (Production):

| Name | Value |
|------|--------|
| `VITE_API_BASE_URL` | `https://portfolio-api-xxxxxxxx-as.a.run.app/api/v1` |
| `VITE_API_ORIGIN` | `https://portfolio-api-xxxxxxxx-as.a.run.app` |
| `VITE_GOOGLE_CLIENT_ID` | (optional) Google OAuth web client id |

5. Deploy. You get: `https://your-project.vercel.app`
6. Re-run the Cloud Run env update so `FRONTEND_URL` matches that URL (CORS + OAuth redirects).

`frontend/vercel.json` already rewrites all routes to `index.html` for React Router.

---

## 5. Wire the free URLs together

Final checklist:

1. Neon DB reachable from Cloud Run (`DATABASE_URL` with `ssl=require`).
2. Upstash `REDIS_URL` set on Cloud Run.
3. Vercel `VITE_API_BASE_URL` / `VITE_API_ORIGIN` point at Cloud Run.
4. Cloud Run `FRONTEND_URL` points at Vercel.
5. Migrations ran (automatic on container start).
6. Resume SQL seeded (optional).
7. Login as owner → change password.

```text
Browser  →  https://your-project.vercel.app     (Vercel)
                │
                ▼  /api/v1/*  (absolute URL from VITE_*)
         https://portfolio-api-….run.app         (Cloud Run)
                │
        ┌───────┴────────┐
        ▼                ▼
      Neon PG         Upstash Redis
```

---

## 6. Google OAuth (optional, still free)

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → OAuth client (Web).
2. Authorized JavaScript origins:
   - `https://your-project.vercel.app`
3. Authorized redirect URIs:
   - `https://portfolio-api-….run.app/api/v1/auth/google/callback`
4. Set on Cloud Run:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI` (exact callback URL above)
5. Set on Vercel: `VITE_GOOGLE_CLIENT_ID` (same client id).

---

## 7. Custom domain later (optional, not free)

- Vercel: Project → Domains → add your domain.
- Cloud Run: map a custom domain (requires domain verification).
- Update `FRONTEND_URL`, `VITE_*`, and Google OAuth URLs.

Until then, use:

- `https://your-project.vercel.app`
- `https://your-service-xxxxx.region.run.app`

---

## 8. Free-tier caveats (read this)

| Topic | Reality on free tier |
|-------|----------------------|
| Cold starts | Cloud Run may sleep (`min-instances=0`); first request can take a few seconds |
| File uploads | `/tmp` media is lost when the instance recycles |
| Redis | Required; use Upstash free tier |
| Email OTP | Without SMTP, OTP prints in Cloud Run logs (`[DEV OTP]`) — use Logs Explorer |
| Quotas | Stay under Neon / Upstash / Cloud Run / Vercel free limits or you may be asked to upgrade |
| Secrets | Prefer Secret Manager / Vercel encrypted env; never commit `.env` |

---

## 9. Useful commands

```bash
# Tail Cloud Run logs
gcloud run services logs read portfolio-api --region asia-south1 --limit 50

# Redeploy backend after code change
gcloud run deploy portfolio-api --source ./backend --region asia-south1

# Redeploy frontend: push to main (if Vercel Git integration is on)
git push origin main
```

---

## 10. Local verify before deploy

```bash
# Backend image behaves like Cloud Run
cd backend
docker build -t portfolio-api .
docker run --rm -p 8000:8000 \
  -e DATABASE_URL='postgresql+asyncpg://…' \
  -e REDIS_URL='rediss://…' \
  -e SECRET_KEY='dev' \
  -e FRONTEND_URL='http://localhost:5173' \
  portfolio-api

# Frontend production build
cd frontend
VITE_API_BASE_URL=https://your-api.run.app/api/v1 \
VITE_API_ORIGIN=https://your-api.run.app \
npm run build && npm run preview
```
