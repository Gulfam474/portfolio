-- =============================================================================
-- seed_resume_data.sql
-- Idempotent PostgreSQL seed for Gulfam Shaikh portfolio / resume content.
--
-- Prerequisites:
--   1. Schema migrated (alembic upgrade head)
--   2. Run against the portfolio database
--
-- Usage examples:
--   psql "postgresql://postgres:postgres@localhost:5433/engineer_portfolio" \
--     -f backend/scripts/seed_resume_data.sql
--
--   # Docker Compose Postgres (adjust container / db name as needed):
--   docker compose exec -T postgres psql -U postgres -d engineer_portfolio \
--     < backend/scripts/seed_resume_data.sql
--
-- Owner login after seed:
--   email/username: gulfamshaikh474@gmail.com  /  owner
--   password:       ChangeMe123!
--
-- CV PDF: copy the resume PDF into MEDIA_ROOT/cv/ on the server, then either
-- update cv_files below or upload via the app UI / python -m app.seed_resume.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Roles + permissions (safe if already seeded by app startup)
-- ---------------------------------------------------------------------------
INSERT INTO roles (name, description)
VALUES
  ('owner', 'Site owner — full access'),
  ('admin', 'Administrator'),
  ('editor', 'Content editor'),
  ('viewer', 'Authenticated viewer'),
  ('guest', 'Default registered user / public role')
ON CONFLICT (name) DO NOTHING;

-- owner: full access
INSERT INTO permissions (role_id, module, can_view, can_edit, can_delete)
SELECT r.id, m.module, TRUE, TRUE, TRUE
FROM roles r
CROSS JOIN (VALUES ('profile'), ('cv'), ('posts'), ('admin')) AS m(module)
WHERE r.name = 'owner'
ON CONFLICT (role_id, module) DO UPDATE
SET can_view = EXCLUDED.can_view,
    can_edit = EXCLUDED.can_edit,
    can_delete = EXCLUDED.can_delete;

-- admin
INSERT INTO permissions (role_id, module, can_view, can_edit, can_delete)
SELECT r.id, v.module, v.can_view, v.can_edit, v.can_delete
FROM roles r
CROSS JOIN (
  VALUES
    ('profile', TRUE, TRUE, TRUE),
    ('cv', TRUE, TRUE, TRUE),
    ('posts', TRUE, TRUE, TRUE),
    ('admin', TRUE, TRUE, FALSE)
) AS v(module, can_view, can_edit, can_delete)
WHERE r.name = 'admin'
ON CONFLICT (role_id, module) DO UPDATE
SET can_view = EXCLUDED.can_view,
    can_edit = EXCLUDED.can_edit,
    can_delete = EXCLUDED.can_delete;

-- editor
INSERT INTO permissions (role_id, module, can_view, can_edit, can_delete)
SELECT r.id, v.module, v.can_view, v.can_edit, v.can_delete
FROM roles r
CROSS JOIN (
  VALUES
    ('profile', TRUE, TRUE, FALSE),
    ('cv', TRUE, TRUE, FALSE),
    ('posts', TRUE, TRUE, TRUE),
    ('admin', FALSE, FALSE, FALSE)
) AS v(module, can_view, can_edit, can_delete)
WHERE r.name = 'editor'
ON CONFLICT (role_id, module) DO UPDATE
SET can_view = EXCLUDED.can_view,
    can_edit = EXCLUDED.can_edit,
    can_delete = EXCLUDED.can_delete;

-- viewer + guest
INSERT INTO permissions (role_id, module, can_view, can_edit, can_delete)
SELECT r.id, v.module, v.can_view, v.can_edit, v.can_delete
FROM roles r
CROSS JOIN (
  VALUES
    ('profile', TRUE, FALSE, FALSE),
    ('cv', TRUE, FALSE, FALSE),
    ('posts', TRUE, FALSE, FALSE),
    ('admin', FALSE, FALSE, FALSE)
) AS v(module, can_view, can_edit, can_delete)
WHERE r.name IN ('viewer', 'guest')
ON CONFLICT (role_id, module) DO UPDATE
SET can_view = EXCLUDED.can_view,
    can_edit = EXCLUDED.can_edit,
    can_delete = EXCLUDED.can_delete;

-- ---------------------------------------------------------------------------
-- 2) Owner user (password = ChangeMe123!)
-- bcrypt hash generated via app.core.security.hash_password
-- ---------------------------------------------------------------------------
INSERT INTO users (
  username, email, hashed_password, is_verified, is_active, role_id
)
SELECT
  'owner',
  'gulfamshaikh474@gmail.com',
  '$2b$12$.bfJ.lkzC0kYICS.qODQsuq0D2.qms7SzrriKhf.A5i01/1pKdj0q',
  TRUE,
  TRUE,
  r.id
FROM roles r
WHERE r.name = 'owner'
ON CONFLICT (username) DO UPDATE
SET
  email = EXCLUDED.email,
  hashed_password = EXCLUDED.hashed_password,
  is_verified = TRUE,
  is_active = TRUE,
  role_id = EXCLUDED.role_id,
  updated_at = NOW();

-- If email exists under a different username, align role/verification
UPDATE users u
SET
  role_id = r.id,
  is_verified = TRUE,
  is_active = TRUE,
  updated_at = NOW()
FROM roles r
WHERE r.name = 'owner'
  AND lower(u.email) = 'gulfamshaikh474@gmail.com';

-- ---------------------------------------------------------------------------
-- 3) Replace profile / resume rows for the owner
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_owner_id INTEGER;
  v_public_fields TEXT :=
    'full_name,title,tagline,bio,location,email_public,phone,website,github,linkedin,twitter,avatar_url';
  v_bio TEXT :=
    'Software Engineer with expertise in Python, FastAPI, PostgreSQL, REST APIs, '
    'Celery, and AI-driven backend systems. Experienced in building scalable, '
    'production-grade applications, asynchronous data pipelines, and third-party '
    'integrations, including Apple Search Ads, App Store Connect, and FoxData. '
    'Passionate about designing high-performance backend solutions, solving complex '
    'problems, and quickly adapting to new technologies.';
BEGIN
  SELECT id INTO v_owner_id
  FROM users
  WHERE username = 'owner' OR lower(email) = 'gulfamshaikh474@gmail.com'
  ORDER BY CASE WHEN username = 'owner' THEN 0 ELSE 1 END
  LIMIT 1;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Owner user not found after insert';
  END IF;

  -- Wipe existing resume-linked rows (idempotent re-seed)
  DELETE FROM education WHERE user_id = v_owner_id;
  DELETE FROM experience WHERE user_id = v_owner_id;
  DELETE FROM skills WHERE user_id = v_owner_id;
  DELETE FROM projects WHERE user_id = v_owner_id;
  DELETE FROM certificates WHERE user_id = v_owner_id;
  -- Keep cv_files unless you want a full wipe; uncomment to clear:
  -- DELETE FROM cv_files WHERE user_id = v_owner_id;

  -- Personal info upsert
  INSERT INTO personal_info (
    user_id, full_name, title, tagline, bio, location,
    email_public, phone, website, github, linkedin, twitter,
    avatar_url, public_fields, updated_at
  )
  VALUES (
    v_owner_id,
    'Gulfam Shaikh',
    'Software Developer',
    'Python · FastAPI · PostgreSQL · Celery · AI-driven backend systems',
    v_bio,
    'India',
    'gulfamshaikh474@gmail.com',
    '7768866875',
    '',
    '',
    '',
    '',
    NULL,
    v_public_fields,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    title = EXCLUDED.title,
    tagline = EXCLUDED.tagline,
    bio = EXCLUDED.bio,
    location = EXCLUDED.location,
    email_public = EXCLUDED.email_public,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    github = EXCLUDED.github,
    linkedin = EXCLUDED.linkedin,
    twitter = EXCLUDED.twitter,
    public_fields = EXCLUDED.public_fields,
    updated_at = NOW();

  -- Education
  INSERT INTO education (
    user_id, institution, degree, field_of_study, start_year, end_year,
    grade, description, sort_order, public_visible
  ) VALUES
    (
      v_owner_id,
      'SCSMCOE, Nepti, Ahmednagar',
      'Bachelor of Engineering (BE) in Computer Engineering',
      'Computer Engineering',
      2020, 2024,
      'CGPA: 8.32',
      'Ahmednagar, MH',
      0, TRUE
    ),
    (
      v_owner_id,
      'Shri Chhatrapati Shivaji Mahavidyalaya',
      'Higher Secondary Certificate (HSC)',
      '',
      2019, 2020,
      '',
      'Shrigonda, MH',
      1, TRUE
    );

  -- Experience
  INSERT INTO experience (
    user_id, company, role, location, start_date, end_date,
    is_current, description, sort_order, public_visible
  ) VALUES
    (
      v_owner_id,
      'Quantumquake',
      'Software Developer',
      'Noida',
      '04/2026',
      '',
      TRUE,
      $html$<ul><li>Built ML-powered ASA/ASO platform backend automating bid optimization, keyword intelligence, and campaign management for mobile app marketers.</li><li>Designed Celery ingestion pipelines syncing ASA, App Store Connect, and FoxData feeds across multi-tenant accounts with ops-triggered dispatch.</li><li>Implemented human-in-the-loop AI agents with guardrails, approval flows, and validated execution payloads for Apple API actions.</li><li>Architected 118-table Postgres schema with audit trails, idempotency, and dead-letter queue for production-grade MarTech automation.</li></ul>$html$,
      0, TRUE
    ),
    (
      v_owner_id,
      'Askmeidentity',
      'Software Developer Engineer',
      'Bangalore',
      '01/2026',
      '03/2026',
      FALSE,
      $html$<ul><li>Backend developer for an LMS project — designing and shipping REST APIs.</li><li>Handled complex database queries and query optimization.</li><li>Leveraged Django ORM for migrations, complex querysets, and secure data handling on the LMS platform.</li></ul>$html$,
      1, TRUE
    ),
    (
      v_owner_id,
      'Digital Think Technology LLP',
      'Software Developer',
      'Bangalore',
      '02/2025',
      '01/2026',
      FALSE,
      $html$<ul><li>Designed and developed scalable RESTful APIs for an enterprise ERP platform, improving data flow between frontend and backend.</li><li>Optimized complex SQL queries and database schemas, reducing API response latency.</li><li>Collaborated closely with BD and frontend teams to deliver product features.</li></ul>$html$,
      2, TRUE
    ),
    (
      v_owner_id,
      'ROBOWAVES',
      'Data Analyst Intern',
      'Pune',
      '02/2024',
      '01/2025',
      FALSE,
      $html$<ul><li>Worked with Python, data analysis, transformation, visualization, Excel, Power BI, and Tableau.</li><li>Cleaned datasets, transformed data, and built dashboards in Power BI, Tableau, Excel, and Python.</li></ul>$html$,
      3, TRUE
    );

  -- Skills
  INSERT INTO skills (user_id, name, "group", proficiency, sort_order, public_visible)
  VALUES
    (v_owner_id, 'Python', 'Programming & Scripting', 95, 0, TRUE),
    (v_owner_id, 'OOP', 'Programming & Scripting', 90, 1, TRUE),
    (v_owner_id, 'Data Structures', 'Programming & Scripting', 88, 2, TRUE),
    (v_owner_id, 'System Design', 'Programming & Scripting', 80, 3, TRUE),
    (v_owner_id, 'FastAPI', 'Frameworks & APIs', 92, 4, TRUE),
    (v_owner_id, 'Django', 'Frameworks & APIs', 88, 5, TRUE),
    (v_owner_id, 'Flask', 'Frameworks & APIs', 75, 6, TRUE),
    (v_owner_id, 'REST API', 'Frameworks & APIs', 92, 7, TRUE),
    (v_owner_id, 'PostgreSQL', 'Database & SQL', 90, 8, TRUE),
    (v_owner_id, 'MySQL', 'Database & SQL', 85, 9, TRUE),
    (v_owner_id, 'Oracle DB', 'Database & SQL', 70, 10, TRUE),
    (v_owner_id, 'SQL Optimization', 'Database & SQL', 85, 11, TRUE),
    (v_owner_id, 'PL/SQL', 'Database & SQL', 75, 12, TRUE),
    (v_owner_id, 'Agentic AI', 'AI & Automation', 85, 13, TRUE),
    (v_owner_id, 'Chatbots', 'AI & Automation', 80, 14, TRUE),
    (v_owner_id, 'Prompt Engineering', 'AI & Automation', 85, 15, TRUE),
    (v_owner_id, 'Pandas', 'Data Analysis & Visualization', 85, 16, TRUE),
    (v_owner_id, 'NumPy', 'Data Analysis & Visualization', 80, 17, TRUE),
    (v_owner_id, 'Matplotlib', 'Data Analysis & Visualization', 75, 18, TRUE),
    (v_owner_id, 'Seaborn', 'Data Analysis & Visualization', 75, 19, TRUE),
    (v_owner_id, 'Power BI', 'Data Analysis & Visualization', 80, 20, TRUE),
    (v_owner_id, 'Tableau', 'Data Analysis & Visualization', 75, 21, TRUE),
    (v_owner_id, 'Excel', 'Data Analysis & Visualization', 85, 22, TRUE),
    (v_owner_id, 'Git', 'Tools', 90, 23, TRUE),
    (v_owner_id, 'Docker', 'Tools', 85, 24, TRUE),
    (v_owner_id, 'Redis', 'Tools', 85, 25, TRUE),
    (v_owner_id, 'Celery', 'Tools', 90, 26, TRUE),
    (v_owner_id, 'VS Code', 'Tools', 90, 27, TRUE),
    (v_owner_id, 'Cursor', 'Tools', 88, 28, TRUE),
    (v_owner_id, 'Ubuntu', 'Tools', 80, 29, TRUE),
    (v_owner_id, 'Adaptability', 'Soft Skills', 90, 30, TRUE),
    (v_owner_id, 'Teamwork', 'Soft Skills', 90, 31, TRUE),
    (v_owner_id, 'Leadership', 'Soft Skills', 80, 32, TRUE),
    (v_owner_id, 'Critical Thinking', 'Soft Skills', 85, 33, TRUE);

  -- Projects
  INSERT INTO projects (
    user_id, title, description, tech_stack, project_url, repo_url,
    thumbnail_url, sort_order, public_visible
  ) VALUES
    (
      v_owner_id,
      'ML-powered ASA/ASO Marketing Automation Platform',
      $html$<p>AI-Powered Apple Search Ads &amp; App Store Optimization Platform.</p><ul><li>Built scalable FastAPI backends for ASA/ASO automation.</li><li>Celery pipelines syncing Apple Search Ads, App Store Connect, and FoxData across multi-tenant accounts.</li><li>AI agent workflows with human-in-the-loop approval, guardrails, and audit logging.</li><li>118+ table PostgreSQL schema with idempotency, DLQ, retries, and monitoring.</li></ul>$html$,
      'Python, FastAPI, PostgreSQL, Celery, Redis, SQLAlchemy, Apple Search Ads API, App Store Connect API, FoxData API, Docker',
      '', '', NULL, 0, TRUE
    ),
    (
      v_owner_id,
      'Enterprise ERP Platform',
      $html$<p>Co-developed a comprehensive ERP application with modular Django REST APIs to automate core business workflows.</p>$html$,
      'Python, MySQL, Django, Django REST Framework',
      '', '', NULL, 1, TRUE
    ),
    (
      v_owner_id,
      'Virtual Mouse',
      $html$<p>Computer-vision console application using hand-gesture recognition to execute virtual mouse actions (clicking, scrolling, zooming) touch-free.</p>$html$,
      'Python, OpenCV, Computer Vision',
      '', '', NULL, 2, TRUE
    );

  -- Certificates
  INSERT INTO certificates (
    user_id, name, issuer, year, credential_url, description, sort_order, public_visible
  ) VALUES
    (v_owner_id, 'Data Analysis', '', NULL, '', '', 0, TRUE),
    (v_owner_id, 'Python', '', NULL, '', '', 1, TRUE),
    (v_owner_id, 'Data Science', '', NULL, '', '', 2, TRUE),
    (v_owner_id, 'SQL', '', NULL, '', '', 3, TRUE),
    (v_owner_id, 'Data Visualization', '', NULL, '', '', 4, TRUE);

  RAISE NOTICE 'Resume seed complete for owner_id=%', v_owner_id;
END $$;

COMMIT;

-- Quick verification
SELECT 'users' AS entity, count(*) FROM users WHERE username = 'owner'
UNION ALL
SELECT 'personal_info', count(*) FROM personal_info pi
  JOIN users u ON u.id = pi.user_id WHERE u.username = 'owner'
UNION ALL
SELECT 'education', count(*) FROM education e
  JOIN users u ON u.id = e.user_id WHERE u.username = 'owner'
UNION ALL
SELECT 'experience', count(*) FROM experience x
  JOIN users u ON u.id = x.user_id WHERE u.username = 'owner'
UNION ALL
SELECT 'skills', count(*) FROM skills s
  JOIN users u ON u.id = s.user_id WHERE u.username = 'owner'
UNION ALL
SELECT 'projects', count(*) FROM projects p
  JOIN users u ON u.id = p.user_id WHERE u.username = 'owner'
UNION ALL
SELECT 'certificates', count(*) FROM certificates c
  JOIN users u ON u.id = c.user_id WHERE u.username = 'owner';
