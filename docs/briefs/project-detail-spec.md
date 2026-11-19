# Spec: Project Detail Page Uses Real Data

## Problems to Fix

1. I created a project called **Ada's Lace**. Opening it shows the heading **Wedding Suit**. The detail page is still rendering hard-coded mock data instead of the project I opened.
2. The page shows pre-made garments (Jacket, Trousers, Waistcoat). Garments must NOT come from a template. A project starts with **no garments**, and the user adds each one by tapping **Add measurement**.

## Scope

In scope:
- The project detail page (the one with the project title, step progress bar, garments list and the Add measurement button)
- One new backend endpoint to add a measurement to a project
- Removing every piece of mock data on this page

Out of scope (do not touch):
- The capture flow, camera, A-pose check, preview and analysing screens
- The measurement canvas screen (leave the chevron on each garment card linking to it as it works today)
- The Projects list page (already wired)
- Database schema. The tables already exist.

## Root Cause to Verify First

Open the detail page component and find where "Wedding Suit", "Jacket", "Trousers" and "Waistcoat" are defined. They are almost certainly a hard-coded constant or mock file. Confirm that the page does not use the route parameter (`:id`) to fetch anything. State what you found before fixing it.

## Data Source

Existing endpoint from the previous spec: **GET `/api/projects/:id`**. It returns the project plus its measurements. Fetch it using the `:id` from the URL when the page opens. Return `404` if the project is not the user's.

Relevant fields:
- Project: `id`, `name`, `status`, `progress`, `is_archived`
- Measurements: `id`, `description`, `data` (jsonb), `created_at`

## Page Mapping

**Heading:** the project's `name`. Never a fallback to mock text. While loading, show a skeleton instead of any name.

**Subtitle:** `{n} garment(s)`. Use "1 garment", "0 garments". Remove "measurements ·" from the line.

**Step bar:** driven by `status`:
- `pending_review` = Step 1: Review
- `cutting` = Step 2: Cutting
- `fitting` = Step 3: Fitting
- `done` = Step 4: Done
- Steps up to and including the current one are filled. The right-hand label shows "In progress" for the first three and "Completed" for `done`.

**Garment cards:** one card per row in `measurements`.
- Title: the measurement's `description`
- Point count: the number of keys in `data`, shown as "{n} pts" (0 pts when `data` is empty)
- Chevron keeps linking to the existing canvas screen
- Remove, for now, the per-garment status tag (Cutting / Fitting / Pending) and the comment count. There is no per-garment status or comments table yet. Do not invent fake values.
- Remove the garment thumbnail artwork or replace it with a neutral placeholder icon. I will supply illustrations later.

**Empty state (a brand-new project):** keep the header and step bar. In the garments area show "No garments yet" and a short line: "Tap Add measurement to add your first one." Keep the Add measurement button.

## Add Measurement

### Backend

**POST `/api/projects/:id/measurements`** (behind the existing auth middleware, per-request Supabase client so Row Level Security applies)
- Body: `{ "description": string }`
- Validate: trimmed, required, 1 to 80 characters. Return `400` otherwise.
- Insert with `project_id` from the URL and `data` as an empty object. Accept nothing else from the body.
- Returns the created measurement with `201`. Returns `404` if the project is not the user's.

### Frontend (this step only)

- Tapping **Add measurement** opens a small sheet with one field, "What is this for?", and a Create button (disabled while empty or while the request runs).
- On success, close the sheet and add the new garment card to the list without a full page reload.
- The new card shows its description and "0 pts".
- Do not connect this to the capture flow yet. That is a separate step and spec.

## Acceptance Criteria

1. Opening Ada's Lace shows the heading "Ada's Lace". Opening any other project shows that project's own name.
2. A new project shows "0 garments", the step bar on Step 1: Review, and the empty garments message. No Jacket, Trousers or Waistcoat anywhere.
3. Adding a measurement with the description "Gown" shows a "Gown" card with "0 pts". The row exists in the Supabase `measurements` table with the right `project_id`.
4. Reloading the page keeps the garment.
5. A project set to `cutting` in the database shows Step 2: Cutting after reload.
6. Another user's project id in the URL returns the not-found state, not their data.
7. Search the codebase: no mock project or garment data is left on this page.

## Work Order

Stop after each step so I can test:
1. Fetch the project by id and fix the heading, subtitle and step bar
2. Garments list from real data, with the empty state
3. POST endpoint and the Add measurement sheet
