-- Migration: 20261009120000_create_user_tables_and_rls.sql
-- Description: Core user schema, triggers, roles, audit logs, and Row Level Security policies.

-- 1. Reusable updated_at timestamp trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2. profiles table (one row per auth.users record)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  phone text,
  onboarding_completed boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at 
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 3. user_settings table (preferences, one row per user)
create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  locale text not null default 'en',
  timezone text not null default 'UTC',
  notifications jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists user_settings_updated_at on public.user_settings;
create trigger user_settings_updated_at 
  before update on public.user_settings
  for each row execute function public.set_updated_at();

-- 4. roles and user_roles lookup tables
create table if not exists public.roles (
  id smallint primary key generated always as identity,
  name text not null unique
);

-- Seed basic application roles
insert into public.roles (name) 
values ('user'), ('admin')
on conflict (name) do nothing;

create table if not exists public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id smallint not null references public.roles(id),
  primary key (user_id, role_id)
);

create index if not exists user_roles_role_id_idx on public.user_roles(role_id);

-- 5. audit_logs table (server-only append-only log)
create table if not exists public.audit_logs (
  id bigint primary key generated always as identity,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_user_id_idx on public.audit_logs(user_id);
create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at);

-- 6. Enable Row Level Security on all tables
alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.roles enable row level security;
alter table public.user_roles enable row level security;
alter table public.audit_logs enable row level security;

-- 7. Row Level Security Policies

-- profiles policies: users can read and update only their own profile
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- user_settings policies: users can read and update only their own settings
drop policy if exists "settings_select_own" on public.user_settings;
create policy "settings_select_own" on public.user_settings
  for select using (auth.uid() = user_id);

drop policy if exists "settings_update_own" on public.user_settings;
create policy "settings_update_own" on public.user_settings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- roles policies: readable by any signed-in user, writable by no client
drop policy if exists "roles_select_authenticated" on public.roles;
create policy "roles_select_authenticated" on public.roles
  for select to authenticated using (true);

-- user_roles policies: users can inspect their own role assignments, writable by no client
drop policy if exists "user_roles_select_own" on public.user_roles;
create policy "user_roles_select_own" on public.user_roles
  for select using (auth.uid() = user_id);

-- audit_logs policies: no client access policies defined, server-only via service_role

-- 8. Signup trigger (auto-creates profile, settings, and 'user' role for email & Google signups)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  -- Create profile record
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );

  -- Create default user settings
  insert into public.user_settings (user_id) 
  values (new.id);

  -- Assign default 'user' role
  insert into public.user_roles (user_id, role_id)
  select new.id, id from public.roles where name = 'user';

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
