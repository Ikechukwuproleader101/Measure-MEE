# Spec: Add Measurements From the Camera

## Goal

Tapping **Add measurement** on a project's detail page starts the camera capture flow. When the scan finishes, the user saves the result into **that project** as a new garment. Measurements come only from the app's own capture system (no typed-in numbers).

This replaces the earlier description-only sheet from `project-detail-spec.md`, which created a garment with empty data. A garment must now exist only if it holds real scan results.

## Scope

In scope:
- Connecting the Add measurement button to the existing capture flow, carrying the project with it
- The save step at the end (description, then save to the database)
- Extending the measurements endpoint to accept scan results
- Updating the garment card to reflect saved data

Out of scope (do not touch):
- Pose validation rules, red/green highlighting, countdown, tilt sensing, sound cues
- How the scan computes its numbers (use whatever the current processing step returns)
- Comment pins, tailor links, notifications
- Database schema (the `measurements.data` jsonb column already exists)

## Flow

1. Project detail page: user taps **Add measurement**.
2. The capture flow opens **with the project id attached** (route param or flow state). Existing screens are reused in their current order: measurement guide, height, camera with A-pose check, front and side photo preview, processing animation, results.
3. On the results screen, the primary action becomes **"Save to {project name}"**.
4. Tapping it opens a small sheet: **"What is this for?"** (required, trimmed, 1 to 80 characters).
5. The app checks for an internet connection. If offline, block saving and show a message. Keep the results in memory so the user does not have to scan again.
6. The app saves the measurement, then returns to the project detail page, where the new garment card appears.

Cancelling or backing out at any point before step 6 creates **nothing**. A garment row is created only by a successful save.

## Photos Never Leave the Device

Only the numbers are sent to the backend. Never upload, store or log the photos. Discard the image data after processing and saving.

## Backend

Extend **POST `/api/projects/:id/measurements`** (behind the existing auth middleware, per-request Supabase client so Row Level Security applies).

Body:
```json
{
  "description": "Gown",
  "data": {
    "measurements": { "chest": 92.4, "waist": 76.1 },
    "meta": { "height_cm": 168, "scale_method": "height" }
  }
}
```

Validation:
- `description`: trimmed, required, 1 to 80 characters
- `data.measurements`: required object; keys are non-empty strings (max 60 keys); values are finite numbers greater than 0 and at most 400 (centimeters)
- `data.meta`: optional object. Allow only `height_cm` (number) and `scale_method` (string). Ignore any other field.
- Return `400` with a clear message on any failure. Do not accept `project_id` or any other field from the body.

Behavior:
- Insert into `measurements` with `project_id` from the URL and `data` as sent (after validation).
- Then update the parent project's `updated_at` so it becomes the current project on Home.
- Return the created measurement with `201`. Return `404` if the project is not the user's.

The measurement names inside `data.measurements` are whatever the current scan returns. Do not hard-code a fixed list or invent names.

## Frontend

### Capture flow context
- The flow must know which project it is for. If it is opened without a project (for example from somewhere else in the app), saving is not offered, or the user is asked to pick a project first. Report how it behaves today.
- Make sure the results screen shows the **real scan output**, not mock numbers. If it still shows mock values, say so and wire it to the real output.

### Save step
- Description sheet as above. Disable Save while the description is empty or the request is running.
- On failure, show a short error with Retry. The results stay in memory so nothing is lost.
- On success, navigate back to the project detail page and refetch, so the new card appears.

### Garment card (project detail page)
- Title: `description`
- Point count: the number of keys in `data.measurements`, shown as "{n} pts"
- Still no per-garment status tag or comment count (there is no data for them yet)

### The old description-only sheet
- Remove it. If you believe it should stay for any reason, keep it out of the main flow and tell me why instead of leaving it in silently.

## Acceptance Criteria

1. Tapping Add measurement on "Ada's lace" opens the capture flow.
2. Completing a scan and saving with the description "Gown" returns to the project, which now shows exactly one card, "Gown", with a point count equal to the number of saved measurements.
3. In the Supabase `measurements` table, that row has the right `project_id`, the description, and `data.measurements` holding numbers only. No image data anywhere.
4. Backing out of the flow at any stage leaves the project with no new garment.
5. Saving while offline is blocked, and the results are still there when the connection returns.
6. After saving, that project is the one shown on the Home card.
7. A request with invalid `data` (a text value, a negative number, extra fields) returns `400` and creates nothing.
8. Another user cannot save into this project (`404`).
9. Works on the hosted app (Vercel frontend, Render backend), with the backend redeployed.

## Work Order

Stop after each step so I can test:
1. Backend: extend the POST endpoint with validation
2. Pass the project id into the capture flow, and confirm the results screen shows real data
3. Save step: description sheet and the POST call
4. Garment card point count, and removal of the old description-only sheet
5. Hosted check
