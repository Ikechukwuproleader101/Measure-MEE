# Fix: Project Detail Page Still Shows Mock Garments

## Problem

The project detail page for **Ada's lace** now shows the correct heading, "0 garments" and the correct step bar. But the Garments list still shows three mock cards: **Jacket** (Cutting, 6 pts, 2 comments), **Trousers** (Fitting, 4 pts, 1 comments) and **Waistcoat** (Pending, 5 pts).

The project has 0 garments in the database, so the list must be empty. A garment may only appear after the user taps **Add measurement** and creates it.

This continues `project-detail-spec.md` (its steps 2 and 3). If those steps were not done, do them as described there, with the extra rules below.

## Hard Rules

1. The garments list renders **only** rows returned by `GET /api/projects/:id` in `measurements`. Nothing else.
2. No mock, default, sample or template garments anywhere, in any state (loading, empty, error).
3. Opening a project must never create a measurement. A row is created only when the user submits the Add measurement sheet.
4. Delete the mock garment data. Do not just hide it.

## Step 1: Diagnose (report before changing code)

1. Search the frontend for `Jacket`, `Trousers`, `Waistcoat` and the strings `6 pts` or `pts`. List every file and line.
2. Find the component that renders the Garments list. Tell me where its array comes from: a hard-coded constant, a mock file, a default `useState` value, or a fallback such as `measurements ?? mockGarments`.
3. The heading and subtitle already come from the API, so the garments should come from the same response. Show how the list differs from them.
4. Check the backend and the seed or setup scripts: does anything insert default garments when a project is created? There must not be. Check the Supabase `measurements` table for rows belonging to Ada's lace and report what is there.

## Step 2: Fix

- Remove the mock data and every fallback to it.
- Render one card per row in `measurements`:
  - Title: the measurement's `description`
  - Point count: number of keys in `data`, shown as "{n} pts" ("0 pts" when empty)
  - Chevron keeps linking to the existing canvas screen
- Remove the per-garment status tag (Cutting / Fitting / Pending) and the comment count for now. There is no per-garment status or comments table yet, so no fake values.
- **Empty state:** when `measurements` is empty, show "No garments yet" and the line "Tap Add measurement to add your first one." Keep the Add measurement button.

## Step 3: Add Measurement

As in `project-detail-spec.md`:
- **POST `/api/projects/:id/measurements`** with body `{ "description": string }` (trimmed, 1 to 80 characters), behind the auth middleware, `data` stored as an empty object, 404 if the project is not the user's.
- The Add measurement button opens a small sheet with one field ("What is this for?") and a Create button. On success the new card appears without a full page reload.
- After inserting, also update the parent project's `updated_at` so it becomes the current project on Home.

## Acceptance Criteria

1. Opening Ada's lace shows "0 garments" and the empty garments message. No Jacket, Trousers or Waistcoat.
2. Adding "Gown" shows exactly one card, "Gown · 0 pts". The row exists in Supabase `measurements` with the right `project_id`.
3. Reloading keeps that card and nothing else.
4. Opening another project shows only its own garments.
5. Searching the codebase for `Jacket`, `Trousers` and `Waistcoat` finds nothing in this page's code.

## Report Back

The root cause, the files changed, evidence for each diagnostic question, and confirmation of each acceptance criterion.
