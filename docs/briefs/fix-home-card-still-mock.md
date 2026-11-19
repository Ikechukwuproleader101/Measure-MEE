# Fix: Home "Your Projects" Card Still Shows the Mock "Wedding Suit"

## Problem

The Home screen's "Your Projects" card still shows **Wedding Suit, "4 Measurements · 3 options", Cutting stage, Step 2 of 4**. This is generic mock data. I have real projects in the database (for example "Ada's Lace"), and the card must show one of those instead.

The previous spec (`home-current-project-spec.md`) was supposed to fix this and it did not work. Do not assume it was implemented correctly. Check everything below, and show me the evidence for each check.

## Hard Rules

1. The Home card must **never** display a project that is not in the database. No fallback, default or placeholder project, in any state (loading, error, empty).
2. If there is no current project, show the empty state ("No projects yet" and a create button). If the request fails, show the error state with Retry. Neither may show a project card.
3. Delete every piece of mock project data used by Home. Do not just hide it.

## Step 1: Diagnose (report findings before changing code)

Answer each question with evidence (file names, line numbers, request and response details):

1. **Where does the mock come from?** Search the whole frontend for `Wedding Suit`, `3 options`, `Cutting stage` and `Step 2 of 4`. List every file and line where they appear.
2. **Is this the real Home component?** The old dev screen switcher may have rendered its own static copy of the Dashboard. Confirm which component actually renders at the Home route, and whether a duplicate static Dashboard or Home component exists. If there are two, tell me which one the app uses.
3. **Does Home call the API at all?** Open Home with the browser Network tab and check for a request to `/api/projects/current`.
   - If there is no request, the card is not wired and the mock is still hard-coded.
   - If there is a request, report its URL, status code and response body.
4. **Is the card falling back to mock?** Look for patterns like `data ?? mockProject`, `data || defaultProject`, a default value in `useState`, or a `catch` that sets mock data. These must be removed.
5. **Is the endpoint reachable?**
   - Does `GET /api/projects/current` exist in the backend, and is it registered **before** `GET /api/projects/:id`? (If it comes after, Express reads "current" as an id and the call fails.)
   - Does the frontend call the right base URL (`VITE_API_BASE_URL`) and send `Authorization: Bearer <token>`?
   - For the hosted setup: has the backend with this endpoint been **redeployed on Render**, and does the Vercel frontend point at it? An old backend returns 404 here.
6. **Does the endpoint return the right data?** For the logged-in user with the project "Ada's Lace" (not archived, not done), the response should be that project, with its garment count. Report the actual response.

## Step 2: Fix

Based on what you found:

- Remove all mock data and every fallback to it (Hard Rules 1 and 3).
- If Home was not calling the API, wire it to `GET /api/projects/current` and fetch on every visit to Home.
- If the route order or base URL was wrong, correct it.
- If a duplicate static Dashboard or Home component exists, make sure the routed Home is the real one, and delete the duplicate if nothing else uses it.

Card content, from the API response:
- Title: `name`
- Subtitle: `{n} garment(s)` (remove "Measurements · options")
- Stage label and step: `pending_review` = "Review stage", Step 1 of 4; `cutting` = "Cutting stage", Step 2 of 4; `fitting` = "Fitting stage", Step 3 of 4
- Progress bar: the `progress` value from the API (25 / 50 / 75)
- Tapping the card opens that project's detail page. "See all" opens the Projects page.

## Acceptance Criteria

1. With "Ada's Lace" as my project, Home shows "Ada's Lace", "0 garments", "Review stage", "Step 1 of 4", 25%. No Wedding Suit anywhere.
2. A new account with no projects sees the empty state, not a project card.
3. With the backend stopped (or the request blocked), Home shows the error state, not a project card.
4. Adding a measurement to a project makes it the one shown on Home.
5. Searching the frontend for `Wedding Suit`, `3 options` and `Cutting stage` returns nothing in Home code.
6. It works on the hosted app (Vercel frontend, Render backend), not only locally.

## Report Back

Give me: what the root cause was, the files you changed, the evidence for each diagnostic question above, and confirmation that each acceptance criterion passed.
