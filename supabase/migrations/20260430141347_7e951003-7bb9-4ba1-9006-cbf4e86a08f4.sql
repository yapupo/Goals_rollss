-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by owner"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.handle_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- TASKS
create type public.task_priority as enum ('low', 'medium', 'high');

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  is_done boolean not null default false,
  priority public.task_priority not null default 'medium',
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_user_id_idx on public.tasks(user_id);

alter table public.tasks enable row level security;

create policy "Users can view own tasks"
  on public.tasks for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own tasks"
  on public.tasks for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own tasks"
  on public.tasks for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete own tasks"
  on public.tasks for delete
  to authenticated
  using (auth.uid() = user_id);

create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function public.handle_updated_at();