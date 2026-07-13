# Architecture overview

```
frontend (Vite/React)  --HTTP-->  backend (FastAPI)
                                      |
                         +------------+------------+
                         |            |            |
                     PostgreSQL     Redis      /media + LaTeX
```

## RBAC modules

- `profile` — personal info, education, experience, skills, projects
- `cv` — upload / download / LaTeX generate
- `posts` — create / edit / delete posts
- `admin` — role & permission management

Default roles: `owner`, `admin`, `editor`, `viewer`, `guest`.
