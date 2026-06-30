create table college_registration_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  is_used boolean not null default false,
  used_by_college_id uuid references colleges(id) on delete set null,
  created_at timestamptz not null default now(),
  used_at timestamptz
);

alter table college_registration_codes enable row level security;

-- No client-side access; server actions use service role which bypasses RLS
create policy "no public access"
  on college_registration_codes
  using (false)
  with check (false);
