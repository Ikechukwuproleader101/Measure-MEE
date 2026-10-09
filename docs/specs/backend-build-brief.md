# Backend Build Brief (for Antigravity)

## 1. Task

Build the Node.js + Express backend inside `backend/`, following the existing specs. This brief tells you **what to do, in what order, and how to prove it works**. It does not repeat the specs.

**Read these first, in full, before writing any code:**
1. `docs/specs/backend-architecture-and-user-db-spec.md` (folder structure, layers, database design, endpoints). Where the two specs conflict, this one wins.
2. `docs/specs/backend-auth-spec.md` (env validation, token verification middleware, security middleware order, error shape, test token script)

## 2. Current state (already done, do not redo)

- The repo is already restructured into `frontend/`, `backend/`, `services/`, `external/` and `docs/`
- Supabase project exists, with Google and Email sign-in enabled
- The database schema has **already been run** in Supabase (`profiles`, `user_settings`, `roles`, `user_roles`, `audit_logs`, RLS policies, and the signup trigger)
- `backend/.env` already exists with real Supabase values

## 3. Hard rules

- **Do not touch `frontend/`, `services/` or `external/`.**
- **Do not read out, print, log or commit secret values** from `.env`. Never paste them into code, comments, test files, README or terminal output. Read them only through the validated config module.
- **Do not run or change anything in the live Supabase project.** Only write code. If a migration file in `backend/supabase/migrations/` is missing or differs from the spec, report it. Do not try to apply it.
- Do not add libraries or features beyond the specs. Use plain JavaScript with ES modules.
- The `.env` variable names are fixed: `PORT`, `NODE_ENV`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ORIGINS`. The anon key slot holds the project's public/publishable key, and the service role slot holds its secret key.
- The frontend dev server runs on **http://localhost:5174**. Make sure it is included in `CORS_ORIGINS` in `backend/.env.example`. Do not overwrite the existing `backend/.env`. If `CORS_ORIGINS` there lacks 5174, tell me and I will edit it.

## 4. Build in phases

Finish and verify each phase before starting the next. At the end of each phase, stop and give a short report (what was built, what was verified, any assumptions).

### Phase 1: Foundation
- `package.json` (ES modules, scripts from the auth spec: `dev`, `start`, `test`, `token`), dependencies installed
- `src/config/env.js`: zod-validated env, fails fast with a clear message and never prints secret values
- `src/config/supabase.js`: `supabaseAdmin` and `createUserClient(accessToken)`
- `src/utils/AppError.js`, `src/utils/asyncHandler.js`
- `src/app.js` and `src/server.js` with the middleware order from the auth spec (helmet, cors, json limit, morgan, rate limit, routes, notFound, errorHandler)
- `GET /health`

**Check:** `npm run dev` starts, and `GET http://localhost:4000/health` returns `{ "status": "ok", "uptime": ... }`.

### Phase 2: Auth middleware
- `src/middleware/requireAuth.js`: verify the Bearer token with `supabaseAdmin.auth.getUser(token)`, set `req.user` and `req.accessToken`, return the error shapes from the spec
- Block soft-deleted accounts with `403 ACCOUNT_DELETED`
- `src/middleware/requireRole.js`: reads the role from `app_metadata.role` only, never `user_metadata`
- `src/middleware/validate.js`, `errorHandler.js`, `notFound.js`

**Check:** a temporary or test-only protected route returns 401 with no token, and 401 with a bad token.

### Phase 3: Users module
Create `src/modules/users/` with the five-file pattern (`routes`, `controller`, `service`, `repository`, `schemas`). All database queries go only in the repository, using `createUserClient(req.accessToken)` so RLS applies.

Endpoints:
- `GET /api/users/me`
- `PATCH /api/users/me` (reject unknown fields, never allow changing `id`, `email`, `deleted_at` or role fields)
- `PATCH /api/users/me/settings`
- `DELETE /api/users/me` (soft delete plus an audit log row)
- `GET /api/admin/users` (admin only, paginated, max 50 per page)

**Check:** all routes are mounted and respond with the correct error when called without a token.

### Phase 4: Tests and token script
- `scripts/get-test-token.js` as described in the auth spec
- Tests with vitest and supertest covering the cases listed in both specs, with the Supabase layer mocked so tests need no network and no real keys

**Check:** `npm test` passes.

### Phase 5: README
`backend/README.md` covering: what the backend does, folder layout, how to run it, how to get a test token, how to call `/api/users/me`, and how role changes must update both `user_roles` and `app_metadata`. List every assumption you made.

## 5. Final verification

Report the result of each item:

- [ ] Server starts, and fails with a clear message when an env var is removed (test this with a temporary copy, never edit the real `.env`)
- [ ] `GET /health` returns 200 without auth
- [ ] `GET /api/users/me` returns 401 with no token or a bad token
- [ ] `npm test` passes
- [ ] No secret values appear in code, logs, tests, README or terminal output
- [ ] `frontend/`, `services/` and `external/` are unchanged (`git status` shows no changes there)
- [ ] All database queries live in `*.repository.js` files

## 6. What the owner will test after you finish

The owner will create a test user in Supabase, run `npm run token -- <email> <password>`, and call `/api/users/me` with the token to confirm a real 200 response and a profile row. Make sure the README explains exactly how to do this on Windows (give the command for both PowerShell and cmd).

## 7. If something is unclear

Pick the simplest option, write the choice in the README, and keep going. If something would require touching live data, secrets, or any folder outside `backend/`, stop and ask instead.
