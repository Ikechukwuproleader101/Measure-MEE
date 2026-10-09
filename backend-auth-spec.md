# Backend Auth Infrastructure Spec (Node + Express + Supabase)

## 1. Goal

Build the **Node.js backend** that sits behind a React frontend and uses **Supabase Auth** as the identity provider.

Users can sign in with **email/password** or **Google**. The sign-in itself happens between the frontend and Supabase. **This backend never handles passwords or the Google handshake.** Its job is to:

1. Receive requests carrying a Supabase access token (JWT).
2. Verify the token and identify the user.
3. Protect routes and expose the authenticated user to route handlers.
4. Provide the base infrastructure (config, security, errors, logging, tests) for the rest of the app.

## 2. Scope

**In scope**
- `backend/` Express server with auth middleware
- Supabase server client setup
- A `profiles` table with RLS and an auto-create trigger (SQL)
- Protected sample routes
- Security middleware (CORS, Helmet, rate limiting)
- Env config validation, error handling, logging
- A test script for obtaining a token and calling the API

**Out of scope (do NOT build now)**
- Frontend / React code
- The Python `cv-service/` (Open3D, MediaPipe). Leave a placeholder folder only
- Payments, email sending, or any other business logic

## 3. Already done (do not redo)

- Google OAuth credentials created in Google Cloud Console
- Google provider enabled in Supabase Auth
- Supabase project exists

## 4. Tech stack

- Node.js 20+ (LTS), Express 4
- `@supabase/supabase-js`
- `dotenv`, `zod` (env + request validation)
- `helmet`, `cors`, `express-rate-limit`, `morgan`
- Dev: `nodemon`, `vitest` + `supertest`
- Plain JavaScript with ES modules (`"type": "module"`)

## 5. Project structure

```
project/
├── frontend/              (leave empty, not part of this task)
├── cv-service/            (placeholder only: add a README.md saying "Python service, coming later")
└── backend/
    ├── src/
    │   ├── config/
    │   │   ├── env.js            # load + validate env vars with zod
    │   │   └── supabase.js       # Supabase clients
    │   ├── middleware/
    │   │   ├── requireAuth.js    # verifies the Bearer token
    │   │   ├── errorHandler.js   # central error handler
    │   │   └── notFound.js
    │   ├── routes/
    │   │   ├── health.routes.js
    │   │   └── me.routes.js
    │   ├── services/
    │   │   └── profiles.service.js
    │   ├── app.js                # builds the Express app (no listen)
    │   └── server.js             # starts the server
    ├── sql/
    │   └── 001_profiles.sql
    ├── scripts/
    │   └── get-test-token.js
    ├── tests/
    │   └── auth.test.js
    ├── .env.example
    ├── .gitignore
    ├── package.json
    └── README.md
```

## 6. Environment variables

`backend/.env.example` (the real `.env` must be git-ignored):

```
PORT=4000
NODE_ENV=development

SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Comma-separated list of allowed frontend origins
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

Rules:
- Validate all vars at startup with zod. If any are missing, exit with a clear error message.
- `SUPABASE_SERVICE_ROLE_KEY` is **server-only**. Never log it, never return it, never expose it to any client.
- Ensure `.env` is listed in `.gitignore`.

## 7. Supabase clients (`src/config/supabase.js`)

Export two things:

- `supabaseAdmin`: created with the **service role key**. Used for trusted server operations. Set `auth: { persistSession: false, autoRefreshToken: false }`.
- `createUserClient(accessToken)`: a function that creates a client with the **anon key** and sets the header `Authorization: Bearer <accessToken>` globally. Queries made with it run **as the user**, so RLS applies.

Default to `createUserClient` for anything that reads or writes user data. Use `supabaseAdmin` only when there is a specific reason.

## 8. Auth middleware (`src/middleware/requireAuth.js`)

Behavior:

1. Read the `Authorization` header. Expect `Bearer <token>`.
2. If missing or malformed, respond `401` with `{ "error": { "code": "UNAUTHORIZED", "message": "Missing or invalid Authorization header" } }`.
3. Verify the token by calling `supabaseAdmin.auth.getUser(token)`. This validates the JWT with Supabase and returns the user.
4. If it errors or returns no user, respond `401` with code `INVALID_TOKEN`.
5. On success, attach to the request:
   - `req.user` = the Supabase user object (id, email, app_metadata, user_metadata)
   - `req.accessToken` = the raw token (so handlers can call `createUserClient(req.accessToken)`)
6. Call `next()`.

Do not decode JWTs manually and do not trust any claims without verification.

## 9. Database (`sql/001_profiles.sql`)

Provide SQL that I can run in the Supabase SQL editor:

```sql
-- profiles table, one row per auth user
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- users can read and update only their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- auto-create a profile when a user signs up (email or Google)
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
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

No insert policy is needed because the trigger runs as `security definer`.

## 10. Routes

All JSON. Mount under `/api` except health.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | No | Returns `{ "status": "ok", "uptime": <seconds> }` |
| GET | `/api/me` | Yes | Returns `{ "user": { id, email }, "profile": {...} }`. Profile is fetched with `createUserClient(req.accessToken)` |
| PATCH | `/api/me` | Yes | Updates `full_name` and/or `avatar_url` on the caller's own profile. Validate the body with zod. Reject unknown fields |

Implement the profile queries in `src/services/profiles.service.js`, not inside the route files.

## 11. Security and middleware order

In `app.js`, apply in this order:

1. `helmet()`
2. `cors({ origin: <parsed CORS_ORIGINS list>, credentials: true })`. Do not use `*`.
3. `express.json({ limit: "1mb" })`
4. `morgan` (`dev` format in development, `combined` in production)
5. Rate limiter: 100 requests per 15 minutes per IP on `/api`
6. Routes
7. `notFound` then `errorHandler`

## 12. Error handling

- One consistent shape: `{ "error": { "code": string, "message": string } }`
- Validation errors return `400` with code `VALIDATION_ERROR`
- Unexpected errors return `500` with a generic message. Log the real error server-side and never leak stack traces in production

## 13. Test token script (`scripts/get-test-token.js`)

A small script so I can test protected routes without a frontend:

- Reads `SUPABASE_URL` and `SUPABASE_ANON_KEY` from `.env`
- Takes an email and password from CLI args
- Calls `signInWithPassword` using the anon key
- Prints the `access_token`

Document in the README that this works for **email/password users only**. To test Google sign-in, a token has to come from a real frontend login later, and the backend code needs no changes for that, since both provider types produce the same kind of Supabase token.

## 14. Tests (`tests/auth.test.js`)

Using vitest and supertest, cover:

- `GET /health` returns 200
- `GET /api/me` with no header returns 401
- `GET /api/me` with a malformed header returns 401
- `GET /api/me` with an invalid token returns 401

Mock the Supabase client for these tests so no network is needed.

## 15. npm scripts

```
"dev": "nodemon src/server.js",
"start": "node src/server.js",
"test": "vitest run",
"token": "node scripts/get-test-token.js"
```

## 16. Manual setup steps (document these in the README, do not automate)

1. In the Supabase dashboard, run `sql/001_profiles.sql` in the SQL editor.
2. Copy the project URL, anon key and service role key into `backend/.env`.
3. In Google Cloud Console, confirm the authorized redirect URI is `https://<project-ref>.supabase.co/auth/v1/callback`.
4. In Supabase, under Authentication, then URL Configuration, set the Site URL and redirect URLs once the frontend exists.
5. Run `npm install` and `npm run dev`, then check `GET http://localhost:4000/health`.

## 17. Acceptance criteria

- [ ] Server starts and fails fast with a clear message if env vars are missing
- [ ] `/health` works without auth
- [ ] `/api/me` returns 401 without a valid token and 200 with a valid one
- [ ] A new signup (email or Google) automatically gets a `profiles` row
- [ ] A user cannot read or update another user's profile (verified by RLS)
- [ ] The service role key never appears in logs or responses
- [ ] `npm test` passes
- [ ] README explains setup and how to get a test token

## 18. Rules for the implementer

- Keep it simple. Do not add libraries or features not listed here.
- Do not touch `frontend/` or build `cv-service/`.
- Comment non-obvious decisions briefly in code.
- If something in this spec is ambiguous, pick the simplest option and note the choice in the README.
