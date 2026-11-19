# Spec: Connect the Projects Page to Supabase

## Goal

Replace the mock data on the client-facing **Projects** page with real data from the Supabase `projects` table, served through our Node + Express backend.

A brand-new user must see an **empty Projects page**. Nothing appears until they create a project themselves.

## Scope

In scope:
- Backend endpoints to list, create, update (rename/archive) and read a user's projects
- Frontend Projects page wired to those endpoints, with loading, empty and error states
- Removing the mock projects from this page only

Out of scope (do not touch):
- Measurement capture, camera, pose validation, preview screens
- The tailor dashboard (separate codebase)
- Comment pins, tailor links, notifications
- Any change to the database schema. The tables already exist (see below).

## Existing Database (already created, do not recreate)

`public.projects`
- `id` uuid, `client_id` uuid, `tailor_id` uuid (nullable), `name` text
- `status` text: one of `pending_review`, `cutting`, `fitting`, `done` (default `pending_review`)
- `progress` integer, generated from status (25 / 50 / 75 / 100). Never write to it.
- `is_archived` boolean (default false), `created_at`, `updated_at`

`public.measurements`
- `id`, `project_id` (FK to projects), `description`, `data` jsonb, timestamps

Row Level Security is enabled. Users can only see rows where they are the `client_id` or `tailor_id`.

## Backend

### Authentication

- The frontend sends the user's Supabase access token as `Authorization: Bearer <token>` on every request.
- Add an auth middleware that verifies the token with `supabase.auth.getUser(token)` and rejects with `401` if invalid.
- Create the Supabase client **per request using the user's token** (anon key plus the Authorization header), so Row Level Security applies automatically. Do not use the service role key for these routes.
- Required env vars in `backend/.env`: `SUPABASE_URL`, `SUPABASE_ANON_KEY`. If the anon key is not there yet, add it and tell me.

### Endpoints

All under `/api/projects`, all behind the auth middleware.

**GET `/api/projects?archived=false`**
- Returns the current user's projects where `client_id` equals the user's id and `is_archived` matches the query (default `false`).
- Include the measurement count per project: `select('*, measurements(count)')`.
- Order by `created_at` descending.
- Response: an array. For a new user this MUST be `[]`, not an error.

**POST `/api/projects`**
- Body: `{ "name": string }`
- Validate: trimmed name is required, 1 to 80 characters. Return `400` otherwise.
- Insert with `client_id` set to the authenticated user's id. Never accept `client_id`, `status`, `progress` or `tailor_id` from the request body.
- Returns the created project with `201`.

**PATCH `/api/projects/:id`**
- Body may contain only `name` and/or `is_archived`. Ignore or reject everything else (especially `status`).
- Returns the updated project. Returns `404` if the project is not found or not the user's.

**GET `/api/projects/:id`**
- Returns one project with its measurements. `404` if not found.

### Rules

- Handle Supabase errors explicitly and return clear JSON errors: `{ "error": "message" }`.
- Add the new router to the existing Express app and keep the existing CORS setup working for the Vercel frontend.

## Frontend (Projects page)

### Data

- Add a small API helper that attaches the Supabase session token to requests, using the existing API base URL variable (`VITE_API_BASE_URL`).
- Fetch on page load. Refetch when the Active/Archived tab changes.
- **Delete the mock projects** (Wedding Suit, Casual Fit, Traditional Attire) from this page. Do not leave fallback mock data.

### States

1. **Loading:** a simple skeleton or spinner while fetching.
2. **Empty (new user):** keep the "Your Projects" header, tabs and the purple + button. In the body, show a friendly empty message such as "No projects yet" with a short line telling the user to tap + to create one. Match the existing black and purple styling. (I will provide an illustration later, so leave a clean spot for it. Do not generate one.)
3. **Error:** a short message with a Retry button.
4. **Populated:** the existing card design, driven by real data.

### Card mapping

- Title: `name`
- Subtitle: `{count} Measurement(s)`, where the count comes from `measurements[0].count`. Use singular for 1, and show "0 Measurements" when none.
- Status label: `pending_review` = "Pending review", `cutting` = "Cutting", `fitting` = "Fitting", `done` = "Done".
- Progress bar and percentage: use `progress` from the API.
- Active tab shows `is_archived = false`, Archived tab shows `is_archived = true`.

### Creating a project

- The + button opens a small modal or bottom sheet with a single name field and a Create button.
- Disable Create while the name is empty or the request is running. Show an inline error if it fails.
- On success, close the modal and show the new project in the list without a full page reload.

## Acceptance Criteria

1. A newly registered account opens the Projects page and sees the empty state. No cards.
2. Creating a project named "Wedding Suit" adds a card showing 0 Measurements, "Pending review" and 25%.
3. In the Supabase Table Editor, that row exists with `client_id` equal to that user's id and `tailor_id` empty.
4. Reloading the page keeps the project (it comes from the database, not local state).
5. A second account does not see the first account's projects.
6. Archiving a project moves it from the Active tab to the Archived tab.
7. A request with no token or a bad token returns `401`.
8. The hosted setup works: Vercel frontend calling the Render backend, with `SUPABASE_URL` and `SUPABASE_ANON_KEY` added to Render's environment variables.

## Work Order

Build in this order and stop after each step so I can test:
1. Auth middleware and `GET /api/projects` returning `[]`
2. Frontend empty state wired to that endpoint (mock data removed)
3. `POST /api/projects` and the + button modal
4. Archive and rename (`PATCH`)
5. Measurement count and single-project endpoint
