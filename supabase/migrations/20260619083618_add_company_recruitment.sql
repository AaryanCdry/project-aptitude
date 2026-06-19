alter type public.user_role add value if not exists 'COMPANY';

create table if not exists public.company_profiles (
  id uuid primary key references public.users(id) on delete cascade,
  company_name text not null,
  industry text,
  website text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.job_postings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company_profiles(id) on delete cascade,
  title text not null,
  description text not null,
  requirements text,
  degree_types text[],
  min_aptitude_score integer check (
    min_aptitude_score is null
    or min_aptitude_score between 0 and 100
  ),
  package_ctc text,
  location text,
  job_type text not null default 'Full Time' check (
    job_type in ('Full Time', 'Internship', 'Contract')
  ),
  application_deadline date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.job_postings(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'applied' check (
    status in ('applied', 'shortlisted', 'rejected')
  ),
  student_snapshot jsonb,
  applied_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, student_id)
);

create index if not exists job_postings_company_id_idx
  on public.job_postings(company_id);

create index if not exists job_postings_active_created_at_idx
  on public.job_postings(is_active, created_at desc);

create index if not exists job_applications_job_id_idx
  on public.job_applications(job_id);

create index if not exists job_applications_student_id_idx
  on public.job_applications(student_id);

alter table public.company_profiles enable row level security;
alter table public.job_postings enable row level security;
alter table public.job_applications enable row level security;
