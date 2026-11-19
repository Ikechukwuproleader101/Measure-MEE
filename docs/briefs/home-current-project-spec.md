# Spec: Home Screen "Your Projects" Card Shows the Current Project

## Goal

The "Your Projects" section on the Home screen currently shows a hard-coded mock card ("Wedding Suit, 4 Measurements · 3 options"). Replace it with a preview of the user's **real current project**: the one they are working on, not a full list. "See all" leads to the Projects page for everything else.

## Scope

In scope:
- The "Your Projects" section on the Home screen
- One new backend endpoint to fetch the current project
- A small backend change so that adding a measurement counts as working on a project

Out of scope (do not touch):
- Everything else on Home (the other cards above this section, the banner, notifications, profile chip)
- The Projects list page and the project detail page
- Database schema. No new tables or columns.

## What "Current Project" Means

The user's single project that is:
- owned by them (`client_id` is the logged-in user)
- not archived (`is_archived = false`)
- not finished (`status` is not `done`)
- the **most recently updated** (`updated_at` descending, first result)

So whichever project the user touched last is the one on Home.

## Backend

### New endpoint

**GET `/api/projects/current`** behind the existing auth middleware, using the per-request Supabase client so Row Level Security applies.

- Query `projects` with the three filters above, ordered by `updated_at` descending, limit 1.
- Include the garment count: `select('*, measurements(count)')`.
- Returns the project object, or `null` with status `200` when the user has no matching project. A user with no projects must get `null`, never an error or a 404.
- IMPORTANT: register this route **before** `GET /api/projects/:id`, otherwise Express treats "current" as an id.

### Keep "last touched" accurate

`updated_at` updates automatically when the project row changes, but adding a measurement only inserts into `measurements`. In `POST /api/projects/:id/measurements`, after a successful insert, also update the parent project with `{ updated_at: new Date().toISOString() }`. This makes the project jump to the top of Home when a garment is added. Do not change any other project field.

## Frontend (Home)

### Data

- Fetch `/api/projects/current` when Home opens, and again whenever the user returns to Home (so it reflects changes made elsewhere).
- Delete the mock "Wedding Suit" card from Home. No fallback mock data.

### States

1. **Loading:** a skeleton of the card, no mock text.
2. **Has a current project:** the card, described below.
3. **No current project (new user, or everything archived or done):** no card. Show a short "No projects yet" message with a button to create one. Reuse the existing create-project sheet from the Projects page. Hide the "See all" link in this state.
4. **Error:** a short message with a Retry button.

### Card mapping

Keep the existing card design.
- Title: the project's `name`
- Subtitle: `{n} garment(s)` using the count from `measurements[0].count` ("1 garment", "0 garments"). Remove "Measurements · options".
- Stage label (top left of the progress area) and step number (top right), from `status`:
  - `pending_review` = "Review stage", "Step 1 of 4"
  - `cutting` = "Cutting stage", "Step 2 of 4"
  - `fitting` = "Fitting stage", "Step 3 of 4"
- Progress bar fill: use `progress` from the API (25 / 50 / 75). Never compute it on the frontend.
- Step labels under the bar (Review, Cutting, Fitting, Done): highlight the current one, as the mock does today.
- Tapping the card or its chevron opens that project's detail page.
- "See all" opens the Projects page.

## Acceptance Criteria

1. A new account sees no mock card on Home, only the empty message and a create button.
2. Creating "Ada's Lace" makes it appear on Home with "0 garments", "Review stage", "Step 1 of 4" and a 25% bar.
3. With two active projects, the one touched most recently is shown. Adding a measurement to the other one makes Home switch to it.
4. Archiving the shown project, or setting it to `done`, makes Home show the next most recent one, or the empty state if none is left.
5. Tapping the card opens the correct project detail page. "See all" opens the Projects page.
6. Another user's projects never appear.
7. Search the codebase: no mock project data is left on Home.

## Work Order

Stop after each step so I can test:
1. `GET /api/projects/current` returning the right project, or `null`
2. Home card wired to it, with loading and empty states
3. The `updated_at` touch when a measurement is added
