create extension if not exists pgcrypto;

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  faculty_id uuid not null,
  title text not null,
  subject text not null default 'General Lecture',
  status text not null default 'active' check (status in ('active', 'ended')),
  started_at timestamptz not null default now(),
  ended_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sessions_faculty_id on public.sessions (faculty_id);
create index if not exists idx_sessions_status on public.sessions (status);

create table if not exists public.transcript_entries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  text text not null,
  timestamp timestamptz not null default now(),
  is_final boolean not null default false,
  is_important boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_transcript_entries_session_id on public.transcript_entries (session_id);
create index if not exists idx_transcript_entries_is_final on public.transcript_entries (is_final);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'sessions'
    ) then
      alter publication supabase_realtime add table public.sessions;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'transcript_entries'
    ) then
      alter publication supabase_realtime add table public.transcript_entries;
    end if;
  end if;
end;
$$;

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.sessions (id) on delete cascade,
  summary text not null default '',
  structured_notes jsonb not null default '[]'::jsonb,
  important_points jsonb not null default '[]'::jsonb,
  teacher_highlights jsonb not null default '[]'::jsonb,
  key_concepts jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_notes_session_id on public.notes (session_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger if not exists trg_sessions_set_updated_at
before update on public.sessions
for each row
execute function public.set_updated_at();

create trigger if not exists trg_notes_set_updated_at
before update on public.notes
for each row
execute function public.set_updated_at();
