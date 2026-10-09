# Measure Me — Backend API

Node.js (Express) backend service for Measure Me. Uses **Supabase Auth** as the identity provider (email/password and Google OAuth) and Supabase Postgres with strict **Row Level Security (RLS)**.

---

## 🏛 Architecture & Folder Layout

The backend follows a strict layered architecture where each layer has one clear responsibility. Routes contain zero business logic, controllers stay thin, and services are decoupled from HTTP:

```text
backend/
├── src/
│   ├── config/
│   │   ├── env.js                 # Zod-validated environment variables
│   │   └── supabase.js            # Admin client & user-scoped RLS client
│   ├── middleware/
│   │   ├── requireAuth.js         # Verifies Bearer JWT, blocks soft-deleted accounts
│   │   ├── requireRole.js         # Role guard using app_metadata.role
│   │   ├── validate.js            # Zod validation wrapper for body, query, params
│   │   ├── errorHandler.js        # Formats errors into { error: { code, message } }
│   │   └── notFound.js            # 404 handler
│   ├── modules/
│   │   ├── users/                 # Standard 5-file module pattern
│   │   │   ├── users.routes.js        # Route & middleware wiring only
│   │   │   ├── users.controller.js    # Reads req, delegates to service, sends res
│   │   │   ├── users.service.js       # Business logic (HTTP-agnostic)
│   │   │   ├── users.repository.js    # ALL database queries live here
│   │   │   └── users.schemas.js       # Zod request validation schemas
│   │   └── health/
│   │       └── health.routes.js       # Unprotected liveness & health check
│   ├── utils/
│   │   ├── AppError.js            # Custom operational error class
│   │   └── asyncHandler.js        # Catches async promise rejections
│   ├── app.js                     # Express app setup and middleware pipeline
│   └── server.js                  # Starts HTTP listener
├── supabase/
│   └── migrations/
│       └── 20261009120000_create_user_tables_and_rls.sql
├── scripts/
│   └── get-test-token.js          # CLI helper to obtain JWT tokens for testing
├── tests/
│   ├── auth.test.js               # Auth & health tests (Vitest + Supertest)
│   └── users.test.js              # User endpoints, role guards, validation tests
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

### Key Architectural Rules

1. **Only `*.repository.js` files talk to Supabase or the database.**
2. Repositories use `createUserClient(req.accessToken)` by default, ensuring all queries execute as the authenticated user under Postgres Row Level Security.
3. `supabaseAdmin` is restricted to trusted system tasks (token verification, admin queries, audit log recording).
4. `auth.users` is managed entirely by Supabase and is never modified directly.
5. `requireRole` checks `req.user.app_metadata.role`, never `user_metadata` (which is client-writable).

---

## 🔐 Database Schema & RLS

All database migrations live in `supabase/migrations/`:

- **`profiles`**: Linked 1:1 to `auth.users(id)` with `on delete cascade`. Users can read and update only their own row.
- **`user_settings`**: Preferences (locale, timezone, notifications). Users can read and update only their own settings.
- **`roles` & `user_roles`**: Lookup table and user role assignments. Seeded with `user` and `admin`. Signed-in users can inspect their own role. Writing is restricted to the server.
- **`audit_logs`**: Append-only log for sensitive actions (e.g., account soft delete). No client policies (service-role only).
- **Signup Trigger (`handle_new_user`)**: Auto-creates `profiles`, `user_settings`, and assigns the default `user` role whenever an account is created via email/password or Google OAuth.

---

## 📡 API Endpoints

All responses are JSON. Errors follow `{ "error": { "code": string, "message": string } }`.

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | None | `{ status: "ok", uptime }` |
| `GET` | `/api/users/me` | User | Profile, settings, and roles for caller |
| `PATCH` | `/api/users/me` | User | Update `full_name`, `avatar_url`, `phone`, `onboarding_completed` |
| `PATCH` | `/api/users/me/settings` | User | Update `locale`, `timezone`, `notifications` |
| `DELETE` | `/api/users/me` | User | Soft delete (sets `deleted_at`, logs audit entry) |
| `GET` | `/api/admin/users` | Admin | Paginated list (`page`, `limit` max 50) |

*Note: `/api/me` is also mounted as a convenience alias for `/api/users/me`.*

---

## 🚀 Setup & Installation

### 1. Run Supabase Database Migration
Open your Supabase project's **SQL Editor** and run the contents of:
```text
backend/supabase/migrations/20261009120000_create_user_tables_and_rls.sql
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` inside `backend/`:
```bash
cp .env.example .env
```
Fill in the values from your Supabase Dashboard (**Project Settings > API**):
```env
PORT=4000
NODE_ENV=development

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

CORS_ORIGINS=http://localhost:5174,http://localhost:5173,http://localhost:3000
```

### 3. Install Dependencies
```bash
cd backend
npm install
```

### 4. Run Development Server
```bash
npm run dev
```
Check server health at `http://localhost:4000/health`.

### 5. Run Tests
```bash
npm test
```

---

## 🔑 Promoting a First Admin (Manual Setup)

Role checks use `app_metadata.role`. To promote your first admin:
1. In the Supabase Table Editor, insert a row in `public.user_roles`:
   - `user_id`: `<your-user-uuid>`
   - `role_id`: `2` (the `admin` role ID)
2. In the Supabase Dashboard under **Authentication > Users**, select the user, edit user metadata, and add to `app_metadata`:
   ```json
   {
     "role": "admin"
   }
   ```

*Role Sync Note*: In production admin flows, server endpoints that change roles must update both `user_roles` and sync `app_metadata.role` using `supabaseAdmin.auth.admin.updateUserById(userId, { app_metadata: { role } })`.

---

## 🧪 Testing with Test Tokens on Windows

To test authenticated routes locally without the frontend:

### 1. Generate a test token
In your terminal (PowerShell or cmd) from `backend/`:
```bash
npm run token -- your-email@example.com your-password
```

### 2. Call `/api/users/me`

**In Windows PowerShell:**
```powershell
$token = "PASTE_YOUR_ACCESS_TOKEN_HERE"
Invoke-RestMethod -Uri "http://localhost:4000/api/users/me" -Headers @{ Authorization = "Bearer $token" }
```
Or using curl in PowerShell:
```powershell
curl.exe -H "Authorization: Bearer PASTE_YOUR_ACCESS_TOKEN_HERE" http://localhost:4000/api/users/me
```

**In Command Prompt (cmd.exe):**
```cmd
curl -H "Authorization: Bearer PASTE_YOUR_ACCESS_TOKEN_HERE" http://localhost:4000/api/users/me
```

*(Note: Test token generation via script is for email/password users. For Google OAuth users, retrieve the access token from the frontend Supabase session callback).*

---

## 📋 Assumptions & Design Decisions

1. **`app_metadata.role` Source of Truth**: The application strictly trusts `req.user.app_metadata.role` for role checks (defaulting to `'user'`). `user_metadata` is intentionally ignored for authorization since users can modify it directly.
2. **Soft Deletion Policy**: Soft-deleted accounts have `profiles.deleted_at` set. `requireAuth` immediately intercepts requests from soft-deleted users and returns `403` with code `ACCOUNT_DELETED`.
3. **Audit Log Error Isolation**: Failures in writing non-critical audit log rows do not abort successful user-facing soft deletions, ensuring high resilience while still logging errors to stdout.
4. **CORS Configuration**: Supports both the default Vite development port (`5174`) and alternative frontend ports (`5173`, `3000`) without wildcards.

