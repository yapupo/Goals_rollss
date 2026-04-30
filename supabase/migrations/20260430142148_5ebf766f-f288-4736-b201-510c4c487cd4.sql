-- Add fields to profiles
alter table public.profiles
  add column if not exists has_onboarded boolean not null default false,
  add column if not exists cinnamon_outfit text not null default 'classic';

-- Add category to tasks
create type public.task_category as enum ('work', 'study', 'personal', 'other');

alter table public.tasks
  add column if not exists category public.task_category not null default 'personal';

-- Achievements table
create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  title text not null,
  description text,
  icon text,
  unlocked_at timestamptz not null default now(),
  unique (user_id, code)
);

create index achievements_user_id_idx on public.achievements(user_id);

alter table public.achievements enable row level security;

create policy "Users view own achievements"
  on public.achievements for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users insert own achievements"
  on public.achievements for insert
  to authenticated
  with check (auth.uid() = user_id);