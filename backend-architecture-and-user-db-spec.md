# Backend Architecture + User Database Spec

This spec extends `backend-auth-spec.md`. If both are given, follow that one for the auth middleware, env validation and security middleware, and follow this one for the overall folder structure and the user database design. If they conflict, this file wins.

## 1. Context

- Frontend: React (not part of this task)
- Backend: Node.js + Express, in `backend/`
- Identity: **Supabase Auth** (email/password and Google, with Google configured through Google Cloud Console). Supabase owns credentials, sessions and the OAuth handshake.
- Database: Supabase Postgres
- Later: a Python service (`cv-service/`) for Open3D and heavy processing. Out of scope now, but the structure must make it easy to add.

**Core principle:** `auth.users` is managed by Supabase and is never modified directly. All app-owned user data lives in our own tables in the `public` schema, linked to `auth.users(id)`.

## 2. Backend structure (layered)

Each layer has one job. Routes must not contain business logic, and services must not know about HTTP.

```
backend/
├── src/
│   ├── config/
│   │   ├── env.js                 # zod-validated env vars
│   │   └── supabase.js            # supabaseAdmin + createUserClient(token)
│   ├── middleware/
│   │   ├── requireAuth.js         # verify Bearer token, set req.user + req.accessToken
│   │   ├── requireRole.js         # role-based guard, e.g. requireRole("admin")
│   │   ├── validate.js            # zod validation wrapper for body/query/params
│   │   ├── errorHandler.js
│   │   └── notFound.js
│   ├── modules/                   # one folder per feature
│   │   ├── users/
│   │   │   ├── users.routes.js        # URL + middleware wiring only
│   │   │   ├── users.controller.js    # reads req, calls service, sends res
│   │   │   ├── users.service.js       # business logic
│   │   │   ├── users.repository.js    # ALL database queries live here
│   │   │   └── users.schemas.js       # zod schemas
│   │   └── health/
│   │       └── health.routes.js
│   ├── utils/
│   │   ├── AppError.js            # custom error class (status, code, message)
│   │   └── asyncHandler.js        # wraps async handlers so errors reach errorHandler
│   ├── app.js                     # builds the Express app (no listen)
│   └── server.js                  # starts the server
├── supabase/
│   └── migrations/                # versioned SQL files (see section 4)
├── scripts/
│   └── get-test-token.js
├── tests/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

Rules:
- New features get a new folder under `modules/` with the same five-file pattern.
- Only `*.repository.js` files talk to Supabase or the database.
- Controllers stay thin. Services hold the logic.
- Use `asyncHandler` on every async route and throw `AppError` for expected failures.

## 3. Auth flow in the backend

1. The frontend signs the user in with Supabase and gets an access token.
2. Every API call sends `Authorization: Bearer <token>`.
3. `requireAuth` verifies the token with `supabaseAdmin.auth.getUser(token)`. It never decodes JWTs manually. It sets `req.user` and `req.accessToken`.
4. Repositories use `createUserClient(req.accessToken)` by default, so queries run as the user and RLS applies. Use `supabaseAdmin` only for trusted operations (for example admin actions or account deletion), and say why in a code comment.
5. `requireRole` reads the user's role from `app_metadata.role` (set only by the server or admin). It must never trust `user_metadata`, because users can edit that themselves.

## 4. Database design for users

### 4.1 Principles

- One migration file per change in `supabase/migrations/`, named like `20261009120000_create_profiles.sql`. Never edit old migrations. Add new ones.
- Primary keys are `uuid`. User-linked tables reference `auth.users(id)` with `on delete cascade`.
- Every table has `created_at` and `updated_at`, with an `updated_at` trigger.
- **Row Level Security is enabled on every table in `public`.** No table is left open.
- Add indexes on foreign keys and on columns used in filters.
- Keep identity data (auth) separate from profile data, preferences and roles.

### 4.2 Tables

**`profiles`** is the main user record, one row per auth user.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | references `auth.users(id)` on delete cascade |
| email | text | copied from auth at signup |
| full_name | text | |
| avatar_url | text | |
| phone | text | optional |
| onboarding_completed | boolean | default false |
| deleted_at | timestamptz | null unless the account is soft-deleted |
| created_at / updated_at | timestamptz | default now() |

**`user_settings`** holds preferences, one row per user.

| Column | Type | Notes |
|---|---|---|
| user_id | uuid PK | references `profiles(id)` on delete cascade |
| locale | text | default 'en' |
| timezone | text | default 'UTC' |
| notifications | jsonb | default '{}' |
| created_at / updated_at | timestamptz | |

**`roles`** is a lookup table, and **`user_roles`** assigns them.

| Table | Columns |
|---|---|
| roles | `id` smallint PK, `name` text unique (seed: `user`, `admin`) |
| user_roles | `user_id` uuid, `role_id` smallint, primary key `(user_id, role_id)` |

Every new user gets the `user` role automatically through the signup trigger. Role changes are done only by the server with `supabaseAdmin`. No client policy may allow writing to `user_roles`.

**`audit_logs`** is an optional but recommended append-only table for sensitive events.

| Column | Type | Notes |
|---|---|---|
| id | bigint identity PK | |
| user_id | uuid | nullable, references `auth.users(id)` on delete set null |
| action | text | for example `profile.updated`, `role.changed` |
| metadata | jsonb | |
| ip_address | inet | nullable |
| created_at | timestamptz | |

Written by the server only. RLS: no client access.

### 4.3 What NOT to create

- Do not create your own users, passwords, sessions or tokens tables. Supabase Auth owns those.
- Do not store the Google OAuth tokens or password hashes anywhere.
- Do not add columns to `auth.users`.

### 4.4 Required SQL

Put this in migrations, split into sensible files:

```sql
-- reusable updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- profiles
create table public.profiles (
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
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- user_settings
create table public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  locale text not null default 'en',
  timezone text not null default 'UTC',
  notifications jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger user_settings_updated_at before update on public.user_settings
  for each row execute function public.set_updated_at();

-- roles
create table public.roles (
  id smallint primary key generated always as identity,
  name text not null unique
);
insert into public.roles (name) values ('user'), ('admin');

create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id smallint not null references public.roles(id),
  primary key (user_id, role_id)
);
create index user_roles_role_id_idx on public.user_roles(role_id);

-- audit_logs
create table public.audit_logs (
  id bigint primary key generated always as identity,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);
create index audit_logs_user_id_idx on public.audit_logs(user_id);
create index audit_logs_created_at_idx on public.audit_logs(created_at);

-- RLS on everything
alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.roles enable row level security;
alter table public.user_roles enable row level security;
alter table public.audit_logs enable row level security;

-- profiles: own row only
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- user_settings: own row only
create policy "settings_select_own" on public.user_settings
  for select using (auth.uid() = user_id);
create policy "settings_update_own" on public.user_settings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- roles: readable by any signed-in user, writable by no client
create policy "roles_select_authenticated" on public.roles
  for select to authenticated using (true);

-- user_roles: users can see their own roles, cannot write
create policy "user_roles_select_own" on public.user_roles
  for select using (auth.uid() = user_id);

-- audit_logs: no client policies = no client access

-- signup trigger: works for email AND Google signups
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );

  insert into public.user_settings (user_id) values (new.id);

  insert into public.user_roles (user_id, role_id)
  select new.id, id from public.roles where name = 'user';

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

**Role claim sync (note for the implementer):** the backend reads `app_metadata.role`. When an admin changes a user's role, the server must update both `user_roles` and the user's `app_metadata` through `supabaseAdmin.auth.admin.updateUserById`. Document this in the README. Do not build an admin UI.

## 5. Endpoints to build

All JSON. Errors use `{ "error": { "code", "message" } }`.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | none | `{ status: "ok", uptime }` |
| GET | `/api/users/me` | user | profile + settings + roles for the caller |
| PATCH | `/api/users/me` | user | update `full_name`, `avatar_url`, `phone`, `onboarding_completed`. Validate with zod and reject unknown fields |
| PATCH | `/api/users/me/settings` | user | update `locale`, `timezone`, `notifications` |
| DELETE | `/api/users/me` | user | soft delete: set `profiles.deleted_at`, write an audit log row. Do not hard delete yet |
| GET | `/api/admin/users` | admin | paginated list (`page`, `limit`, max 50) using `supabaseAdmin`. Protected by `requireRole("admin")` |

Never allow a client to set `id`, `email`, `deleted_at`, or role fields through these endpoints.

## 6. Security, errors, config

Follow `backend-auth-spec.md` for env validation, middleware order (helmet, cors, json limit, morgan, rate limit), and error shape. Additional rules:

- The service role key stays server-only and is never logged or returned.
- Treat soft-deleted users (`deleted_at` not null) as unauthorized in `requireAuth`, returning `403` with code `ACCOUNT_DELETED`.
- Pagination must be capped server-side.

## 7. Tests

With vitest and supertest, mocking the Supabase layer:

- `requireAuth`: missing header, malformed header, invalid token, valid token
- `requireRole`: user blocked from admin route, admin allowed
- `PATCH /api/users/me`: rejects unknown fields and rejects attempts to change `email`
- Soft-deleted user gets 403

## 8. Manual setup steps (document in README, do not automate)

1. Run the migration files in order in the Supabase SQL editor (or with the Supabase CLI).
2. Fill `backend/.env` from `.env.example`.
3. Promote a first admin manually: insert an `admin` row into `user_roles` and set `app_metadata.role = "admin"` for that user in the Supabase dashboard.
4. `npm install`, `npm run dev`, check `/health`.

## 9. Acceptance criteria

- [ ] Signing up with email or Google creates `profiles`, `user_settings` and a `user` role row automatically
- [ ] Every `public` table has RLS enabled
- [ ] A user can read and update only their own data
- [ ] No client can write to `roles` or `user_roles`
- [ ] Role checks use `app_metadata`, never `user_metadata`
- [ ] All DB queries live in `*.repository.js` files
- [ ] Soft-deleted accounts are blocked
- [ ] `npm test` passes and the README covers setup

## 10. Rules for the implementer

- Keep it simple and stick to this spec. Do not add libraries or features not listed.
- Do not touch `frontend/`. Create `cv-service/` with only a placeholder README.
- Note any assumption you make in the README.
