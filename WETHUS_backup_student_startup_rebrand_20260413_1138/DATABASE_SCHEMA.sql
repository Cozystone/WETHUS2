-- WETHUS MVP PostgreSQL Schema

create table users (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('founder','participant','mentor','operator')),
  name text not null,
  email text unique not null,
  created_at timestamptz not null default now()
);

create table founder_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  title text not null,
  description text not null,
  motivation text not null,
  expected_output text not null,
  first_two_week_plan text not null,
  roles_needed text not null,
  estimated_duration text not null,
  ai_score numeric(5,2),
  ai_flags jsonb,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  founder_application_id uuid references founder_applications(id),
  founder_id uuid not null references users(id),
  title text not null,
  summary text not null,
  category text not null,
  status text not null default 'recruiting' check (status in ('recruiting','active','paused','completed')),
  created_at timestamptz not null default now()
);

create table join_applications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  user_id uuid not null references users(id),
  desired_role text not null,
  weekly_availability text not null,
  motivation text not null,
  first_two_week_contribution text not null,
  status text not null default 'pending' check (status in ('pending','accepted','rejected')),
  created_at timestamptz not null default now()
);

create table team_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  user_id uuid not null references users(id),
  role_in_project text not null,
  joined_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table mentors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  domain_expertise text not null,
  experience text,
  availability text,
  mentoring_scope text,
  verified boolean not null default false
);

create table mentor_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  mentor_id uuid references mentors(id),
  requested_by uuid not null references users(id),
  issue_summary text not null,
  status text not null default 'open' check (status in ('open','assigned','done','cancelled')),
  created_at timestamptz not null default now()
);
