# Cursor Build Command — AI Full-Stack Engineer Portfolio + Social Platform

Paste these prompts into Cursor (Composer / Agent mode) **in order, phase by phase**. Let each phase finish and build/run before moving to the next — this keeps context small and output reliable. Everything lives in **one repo** with `backend/` and `frontend/` folders side by side.

---

## 0. Master Project Brief (paste first, every phase can reference this)

```
You are building a production-grade monorepo called "engineer-portfolio".

STACK
- Backend: Python 3.11, FastAPI, SQLAlchemy 2.0 (async), Alembic, PostgreSQL, Pydantic v2, JWT (access + refresh), Redis (OTP + rate limiting), Celery or FastAPI BackgroundTasks for email, Google OAuth2 (Authlib), boto3/S3-compatible storage (or local /media in dev) for images/CV files, LaTeX (Jinja2 template -> .tex -> pdflatex) for CV export.
- Frontend: React 18 + Vite + TypeScript, TailwindCSS, shadcn/ui, TipTap (rich text editor with bullets/links/bold/italic/headings/images), React Router v6, Zustand or Redux Toolkit for state, React Query (TanStack Query) for API calls, Axios with interceptors, React Hook Form + Zod for forms, Framer Motion for subtle animation.
- Repo root contains: /backend, /frontend, /docs, .env.example (root), README.md, docker-compose.yml (postgres + redis + backend + frontend), .gitignore.

DESIGN DIRECTION
Dark-first "AI/backend engineer" aesthetic: near-black background (#0a0a0f), electric accent (indigo/cyan gradient), monospace accents for code/labels (JetBrains Mono), glassmorphism cards, subtle grid/dot background, terminal-style micro-interactions. Clean, confident, technical — not generic SaaS pastel.

CORE PRINCIPLES
- Modular structure on both ends (feature-based, not type-based dumping).
- Role/permission-based access control (RBAC), enforced on backend AND reflected on frontend UI.
- All secrets in .env files (never hardcoded). Provide .env.example for both backend and frontend.
- Every endpoint has Pydantic schemas for request/response, proper status codes, and OpenAPI docs.
- Write clean, typed, documented code with docstrings and comments.

Acknowledge this brief, then wait for Phase 1 instructions.
```

---

## Phase 1 — Repo Scaffold & Folder Structure

```
Create the monorepo skeleton exactly as follows (empty files where noted, don't implement logic yet):

engineer-portfolio/
├── .env.example
├── docker-compose.yml
├── README.md
├── backend/
│   ├── .env.example
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   └── app/
│       ├── main.py
│       ├── core/
│       │   ├── config.py          # Pydantic Settings, reads .env
│       │   ├── security.py        # JWT, password hashing, OTP generation
│       │   ├── db.py               # async engine/session
│       │   ├── redis_client.py
│       │   └── permissions.py      # RBAC decorators/dependencies
│       ├── models/
│       │   ├── user.py
│       │   ├── profile.py          # personal info, education, work exp, skills, projects
│       │   ├── cv.py                # uploaded CV files
│       │   ├── post.py              # social posts
│       │   ├── role.py              # roles + module permissions
│       │   └── otp.py
│       ├── schemas/                 # one file per domain, mirrors models/
│       ├── api/
│       │   └── v1/
│       │       ├── router.py        # aggregates all routers
│       │       ├── auth.py          # register, login, google oauth, otp
│       │       ├── users.py
│       │       ├── profile.py       # personal/education/experience/skills/projects CRUD
│       │       ├── cv.py            # upload, preview, latex export/download
│       │       ├── posts.py         # create/list/like/comment/upload image
│       │       └── admin.py         # role & permission management
│       ├── services/
│       │   ├── email_service.py     # OTP + notification emails
│       │   ├── oauth_service.py     # Google OAuth flow
│       │   ├── storage_service.py   # image/file upload abstraction
│       │   └── latex_service.py     # renders Jinja2 -> .tex -> pdf
│       ├── templates/
│       │   ├── email/otp_email.html
│       │   └── latex/cv_template.tex.jinja
│       └── utils/
│           ├── validators.py
│           └── exceptions.py
└── frontend/
    ├── .env.example
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── routes/
        │   └── AppRoutes.tsx
        ├── api/
        │   ├── axiosClient.ts
        │   ├── authApi.ts
        │   ├── profileApi.ts
        │   ├── cvApi.ts
        │   └── postApi.ts
        ├── features/
        │   ├── auth/            # LoginForm, RegisterForm, OtpVerifyForm, GoogleLoginButton
        │   ├── profile-overview/ # public landing overview (CV-style)
        │   ├── profile-edit/     # gated edit forms per section
        │   ├── cv/                # upload, preview, latex download
        │   ├── posts/             # PostEditor (TipTap), PostFeed, PostCard
        │   └── admin-access/      # role/permission management UI
        ├── components/
        │   ├── ui/               # shadcn primitives
        │   └── layout/           # Navbar, Sidebar, ProtectedRoute, PermissionGate
        ├── context/
        │   └── AuthContext.tsx
        ├── store/
        │   └── useAuthStore.ts
        ├── hooks/
        │   ├── usePermission.ts
        │   └── useAuth.ts
        ├── lib/
        │   └── constants.ts
        └── styles/
            └── globals.css

Also generate backend/requirements.txt with pinned latest-stable versions of: fastapi, uvicorn[standard], sqlalchemy[asyncio], asyncpg, alembic, pydantic, pydantic-settings, python-jose[cryptography], passlib[bcrypt], authlib, httpx, redis, jinja2, python-multipart, pillow, boto3, celery (optional), python-dotenv.

Generate frontend package.json with latest stable: react, react-dom, react-router-dom, @tanstack/react-query, axios, zustand, react-hook-form, zod, @hookform/resolvers, @tiptap/react, @tiptap/starter-kit, @tiptap/extension-link, @tiptap/extension-image, framer-motion, tailwindcss, lucide-react.

Do not implement business logic yet — just scaffold files, imports, and empty function/class stubs with docstrings describing intent.
```

---

## Phase 2 — Environment Files

```
Create root .env.example, backend/.env.example, frontend/.env.example with these keys (values as placeholders):

ROOT .env.example
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/engineer_portfolio
REDIS_URL=redis://localhost:6379/0

BACKEND .env.example
ENV=development
SECRET_KEY=change_me_super_secret
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/engineer_portfolio
REDIS_URL=redis://localhost:6379/0
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=noreply@example.com
OTP_EXPIRE_MINUTES=10
STORAGE_BACKEND=local     # local | s3
MEDIA_ROOT=./media
S3_BUCKET_NAME=
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_REGION=
FRONTEND_URL=http://localhost:5173
LATEX_OUTPUT_DIR=./generated_cv

FRONTEND .env.example
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_GOOGLE_CLIENT_ID=

Wire backend/app/core/config.py to load these via pydantic-settings BaseSettings, and frontend axiosClient.ts to read VITE_API_BASE_URL. Add .env to .gitignore at root, backend, and frontend.
```

---

## Phase 3 — Auth: Register, Login, Google OAuth, Email OTP, RBAC

```
Implement full authentication in backend/app/api/v1/auth.py and supporting services:

1. POST /auth/register — accepts username, email, password. Hash password (bcrypt via passlib). Create user with is_verified=False. Generate 6-digit OTP, store in Redis with TTL=OTP_EXPIRE_MINUTES keyed by email, send OTP via email_service (Jinja2 HTML template).
2. POST /auth/verify-otp — accepts email + otp. Validate against Redis, mark user is_verified=True, delete OTP key, return JWT access+refresh tokens.
3. POST /auth/resend-otp — regenerate + resend, rate-limited (e.g. 1 per 60s via Redis).
4. POST /auth/login — username OR email + password. Reject if not verified. Return JWT access+refresh tokens (httpOnly cookie for refresh, bearer for access).
5. GET /auth/google/login — redirect to Google OAuth consent (Authlib).
6. GET /auth/google/callback — exchange code, fetch userinfo, create-or-get user (auto-verified since Google confirms email), issue JWT.
7. POST /auth/refresh — rotate access token from refresh token.
8. POST /auth/logout — invalidate refresh token (Redis blacklist).
9. GET /auth/me — current user profile + role + module permissions.

RBAC:
- Create Role model (e.g. owner/admin/editor/viewer/guest) and a Permission model with fields: module (profile, cv, posts, admin), can_view, can_edit, can_delete — assigned per role.
- Seed a default "owner" role (full access, assigned to site owner account) and "guest"/"public" role (read-only, no edit).
- Add a FastAPI dependency `require_permission(module: str, action: str)` in core/permissions.py that reads current_user's role, checks the permission table, raises 403 if not allowed. Apply this dependency to all edit/delete endpoints across profile, cv, posts, admin routers.
- Add GET /auth/my-access — returns a map of module -> {can_view, can_edit, can_delete} for the frontend to build the access-based UI.

Frontend (features/auth):
- RegisterForm (username, email, password, confirm password) -> on submit navigate to OtpVerifyForm.
- OtpVerifyForm — 6-digit input, resend timer.
- LoginForm — username-or-email + password, "Continue with Google" button (redirects to backend google/login).
- AuthContext + useAuthStore (zustand) persist access token in memory + refresh via httpOnly cookie; expose `permissions` map fetched from /auth/my-access.
- ProtectedRoute component (redirect to /login if not authenticated) and PermissionGate component (hide/disable UI by module+action using the permissions map).
- Axios interceptor: attach Bearer token, auto-refresh on 401 once, redirect to /login on refresh failure.
```

---

## Phase 4 — Public Landing Page = Profile Overview (CV-style)

```
Build the landing page at "/" as a PUBLIC read-only overview of the site owner's profile (no login required to view basics). Sections:

1. Hero: name, title/tagline, avatar, short bio, social links.
2. Personal Info summary (location, contact — respect a "public_visible" flag per field).
3. Education list (institution, degree, year, grade).
4. Work Experience timeline (company, role, duration, description with rich text rendering).
5. Skills (grouped/tagged, e.g. with proficiency bars).
6. Projects grid (title, description, tech stack tags, links, thumbnail).
7. CV preview widget: embedded PDF preview (react-pdf or <iframe>) of the currently uploaded CV, with a "Download CV (PDF)" and "Download CV (LaTeX-generated PDF)" button.
8. A sticky "Login to see more / Edit" CTA — clicking anything requiring auth (full contact details, edit icons, admin sections) redirects to /login, then back to the same page after auth (return-to redirect).

Backend: GET /profile/overview (public, filters out fields where public_visible=False and omits admin-only sections) and GET /profile/overview/full (auth required, returns everything, used when owner is logged in on their own dashboard).

Frontend: features/profile-overview/OverviewPage.tsx composed of small section components (HeroSection, EducationSection, ExperienceSection, SkillsSection, ProjectsSection, CvPreviewCard). Use PermissionGate to show pencil/edit icons only when can_edit is true for the "profile" module — clicking an edit icon opens features/profile-edit forms in a modal/drawer.
```

---

## Phase 5 — Profile Edit (Personal / Education / Experience / Skills / Projects) + CV Upload & LaTeX Export

```
Backend CRUD (all behind require_permission("profile", "edit") except GET):
- /profile/personal-info  [GET, PUT]
- /profile/education      [GET, POST, PUT, DELETE] (list of entries)
- /profile/experience     [GET, POST, PUT, DELETE]
- /profile/skills         [GET, POST, PUT, DELETE]
- /profile/projects       [GET, POST, PUT, DELETE] (supports thumbnail image upload via storage_service)

CV upload & LaTeX export:
- POST /cv/upload — accepts PDF, stores via storage_service, saves record (filename, url, uploaded_at) linked to user.
- GET /cv/preview — returns the current CV file URL/stream for inline preview.
- GET /cv/download — download the uploaded PDF as-is.
- GET /cv/generate-latex — services/latex_service.py: pulls all profile sections, renders templates/latex/cv_template.tex.jinja (a clean, ATS-style LaTeX CV template) into a .tex file, compiles with pdflatex/tectonic in a subprocess, returns generated PDF as a download (Content-Disposition attachment). Cache/regenerate on demand; clean up temp files after.

Frontend (features/profile-edit):
- One form per section using React Hook Form + Zod validation, each opened as a modal/drawer from the overview page.
- RichText fields (experience description, project description) use the same TipTap editor component used in Posts (shared component features/posts/RichTextEditor.tsx reused here) supporting bold/italic/headings/bullets/numbered lists/links.
- CV section: drag-drop upload (PDF only, size limit), inline preview panel, "Download as PDF" and "Download as LaTeX CV" buttons calling /cv/download and /cv/generate-latex.
```

---

## Phase 6 — Social Posts Module

```
Backend (backend/app/api/v1/posts.py), behind require_permission("posts", action):
- POST /posts — multipart form: title (str), content (rich HTML/JSON from TipTap, sanitize with a bleach/nh3-based sanitizer allowing bold/italic/headings/lists/links/images), image (optional file upload via storage_service).
- GET /posts — paginated feed, newest first, includes author, like_count, comment_count.
- GET /posts/{id} — single post detail.
- PUT /posts/{id} / DELETE /posts/{id} — owner or admin only.
- POST /posts/{id}/like, DELETE /posts/{id}/like.
- POST /posts/{id}/comments, GET /posts/{id}/comments.
- Sanitize all rich text server-side before storing (prevent XSS) even though TipTap output is structured.

Frontend (features/posts):
- PostEditor.tsx — TipTap toolbar with Bold, Italic, Underline, Heading levels, Bullet list, Numbered list, Link, Image upload (drag/drop or button), character-safe autosave draft to localStorage-free in-memory state.
- PostFeed.tsx — infinite scroll / paginated list of PostCard components rendering sanitized rich HTML safely (dangerouslySetInnerHTML with sanitized content only, or TipTap's read-only renderer).
- PostCard.tsx — title, rendered content, image, like/comment actions, author + timestamp.
- Only show "Create Post" button if permissions.posts.can_edit (or a dedicated can_create) is true.
```

---

## Phase 7 — Admin / Access Management UI

```
Backend: /admin/roles [GET, POST, PUT, DELETE], /admin/roles/{id}/permissions [GET, PUT], /admin/users/{id}/role [PUT] — all behind require_permission("admin", "edit"), restricted to owner/admin roles only.

Frontend (features/admin-access): a table of modules (profile, cv, posts, admin) x roles with toggle switches for can_view/can_edit/can_delete, and a user list where the owner can assign roles to other registered users. Gate the entire route behind PermissionGate(module="admin").
```

---

## Phase 8 — Styling Pass & Polish

```
Apply the dark "AI engineer" theme site-wide via tailwind.config.ts (custom color tokens: background, surface, accent-indigo, accent-cyan, border-subtle) and globals.css (grid/dot background pattern, glass card utility class, JetBrains Mono for code/labels, Inter for body text). Add subtle Framer Motion page transitions and hover states. Ensure responsive layout (mobile nav, stacked sections). Add loading skeletons and empty states for feed/profile sections. Add a favicon and OpenGraph meta tags reflecting the owner's name/title.
```

---

## Phase 9 — Docker & Run

```
Write docker-compose.yml with services: postgres, redis, backend (uvicorn --reload, mounts ./backend), frontend (vite dev server, mounts ./frontend). Write README.md with setup steps: clone, copy .env.example files to .env in root/backend/frontend and fill in values (esp. GOOGLE_CLIENT_ID/SECRET, SMTP creds), docker-compose up --build, run alembic upgrade head, then visit http://localhost:5173.
```

---

### Notes before you start
- Get real values for `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` from Google Cloud Console (OAuth consent screen + credentials) and SMTP credentials (e.g. Gmail app password, SendGrid, or Mailgun) before Phase 3 will actually send OTP emails.
- LaTeX export (Phase 5) needs a LaTeX engine installed in the backend environment/container — install `texlive` (or use the lighter `tectonic` binary) in the backend Dockerfile.
- Run phases in order; each assumes the previous phase's files exist so Cursor has real context to extend rather than guess.
