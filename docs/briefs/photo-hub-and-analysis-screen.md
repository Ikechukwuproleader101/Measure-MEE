# Task: Make the Capture Flow Visible, Add the Photo Hub Screen, Revamp the Analysing Screen

## Problem
1. The previous task (`capture-flow-build.md`) was given to the agent, but **the owner sees no difference in the app**. The height screen does not appear. First find out why, and fix it.
2. The owner wants a **photo hub screen** showing two photo slots (front and side). Each slot can be filled from the camera **or** by uploading a photo from the device.
3. The existing **measurement analysing screen** should be revamped. It is shown before the measurements are available.

Where this file conflicts with `capture-flow-build.md`, **this file wins**. Keep what already exists and adapt it. Do not start over.

## Hard rules
- Work only inside `frontend/`. Do not touch `backend/` or the root `services/` folder.
- No uploading to any server. Everything stays on the device. ("Upload" here means picking a file from the device.)
- Match the app's existing look (colors, fonts, spacing, button styles, dark theme). Reuse existing components. Do not introduce a new design style or a new UI library.
- No fake progress. Nothing on the analysing screen may pretend work is happening. Every stage tick must come from real work finishing.
- You cannot open a browser here. Verify with static tracing, unit tests, build, and lint, then hand the visual check to the owner.

## Part 0: Find out why nothing changed (do this first)
Report every finding. Fix what is clearly broken.

1. **Which app is the owner actually running?** Read `start-dev.bat` in the project root and report exactly what it starts (folder, command, port). Confirm it starts `frontend/`. Search for any other app folder (for example inside `external/`) with its own `package.json`, `index.html`, or Vite config, and report whether it could be the one being viewed.
2. **Do the files from the last task exist?** Check for `captureSession.js`, `validateSidePose.js`, `captureFrame.js`, and the height screen. If `git` is available, run `git status` and `git log --oneline -10` (read only) and report what changed. List anything from `capture-flow-build.md` that was not created.
3. **Are the new screens reachable?** Trace the path in code: `main` entry file -> `App` -> routes or screen switching -> the screen shown after login -> the button that opens the camera. Write the chain down. Report whether the height screen and the flow container are imported and rendered anywhere on that chain. If the new flow exists but nothing renders it, wire it in.
4. **Entry point.** The button that currently opens the camera screen must start the flow at the `height` step. Fix it if it does not. Report the file and button.
5. **Stale app check.** Search for a service worker, a PWA plugin in `vite.config`, or a manifest. If one exists, it may be serving an old cached version of the app. Report it. In development, make sure it does not cache the app (disable or skip registering it when running the dev server), and tell the owner how to clear the old cache (see the human check).
6. Confirm `vite.config` fixes the dev port (`server: { port: 5174, strictPort: true }`) so the app cannot silently move to another port.

Write the result of Part 0 at the top of your report before doing the rest.

## Part 1: New flow shape
Replace the separate review screens with one **hub** screen. New step order:

`height` -> `prep` -> `hub` -> `camera` (for one view) -> back to `hub` -> `analyzing` -> `done`

Update the session reducer in `captureSession.js`:

```js
{ step, heightCm, front, side, cameraView }  // cameraView: "front" | "side" | null
```
Steps: `"height"`, `"prep"`, `"hub"`, `"camera"`, `"analyzing"`, `"done"`.

Actions:
- `setHeight(cm)`
- `goTo(step)`
- `startCamera(view)`: sets `cameraView` and `step: "camera"`.
- `setCapture(view, result)`: stores the result, clears `cameraView`, `step: "hub"`.
- `cancelCamera()`: back to `hub` with nothing changed.
- `clearCapture(view)`: clears that slot and revokes its preview URL.
- `startAnalysis()`: allowed only when `heightCm`, `front`, and `side` all exist; sets `step: "analyzing"`.
- `reset()`.

Rules: front and side can be filled in **either order**. `analyzing` is unreachable unless all three exist. Nothing is stored outside memory.

Add `source: "camera" | "upload"` to `CaptureResult`.

## Part 2: The hub screen (`PhotoHub`)
Layout, using the app's existing styles:

- Title: "Your photos".
- A small height line at the top: "Height: 170 cm" with an "Edit" link that returns to the `height` step. Do not lose the photos when height is edited.
- **Two photo cards**, side by side on wide screens and stacked on narrow screens: **Front** and **Side**.
- A primary button at the bottom: **"Analyze my measurements"**, disabled until both photos are filled and valid.

Each card has two states:

**Empty**
- A dashed placeholder box, tall (portrait, about 3:4).
- A one-line pose hint inside it:
  - Front: "Face the camera, arms out slightly like an A."
  - Side: "Turn to your side, arms relaxed."
- Two buttons: **"Take photo"** (starts the camera for this view) and **"Upload"** (opens the device file picker).

**Filled**
- The photo, shown whole (`object-fit: contain`, not cropped), in the same portrait box.
- A status chip: green "Looks good", or red with the first reason (for example "Straighten your arms") when the photo is not valid.
- Two buttons: **"Retake"** (starts the camera) and **"Replace"** (opens the file picker).
- A small label showing the source: "Camera" or "Uploaded".

An invalid photo can still be shown, but it keeps the "Analyze" button disabled until the owner replaces it.

Also show one line under the cards: "Use fitted clothes and a photo where your whole body is visible."

## Part 3: Camera step
Reuse the existing camera screen and the existing checkers.
- Front uses `validateAPose`; side uses `validateSidePose`.
- Keep the green/red skeleton, the hint, the locked shutter, and the 3-2-1 hands-free countdown.
- Add a visible **Cancel** (back arrow) that calls `cancelCamera()` and returns to the hub.
- On a successful capture, call `setCapture` and return to the hub. There is no separate review screen anymore.
- Stop the camera stream when leaving the camera step.

## Part 4: Upload path
Refactor so both camera and upload use one analysis function:

```js
analyzeCanvas({ canvas, view, validator, source }) -> Promise<CaptureResult | { error: string }>
```
It does what `captureFrame` did after drawing the frame: runs the capture-time landmarker on the canvas, re-checks the pose with the validator, builds the 0/1 mask, and creates the JPEG blob and preview URL. `captureFrame` (camera) draws the video frame and calls it. Add:

```js
processUploadedImage({ file, view, validator }) -> Promise<CaptureResult | { error: string }>
```
Steps:
1. Accept JPG, PNG, and WebP only. Anything else returns `{ error: "Please choose a JPG or PNG photo." }`.
2. Reject files over 15 MB with `{ error: "That photo is too large. Choose one under 15 MB." }`.
3. Decode with `createImageBitmap(file, { imageOrientation: "from-image" })` so phone photos are not rotated wrongly.
4. Scale down so the longest side is at most 1920 pixels (keep the aspect ratio), draw to a canvas (not mirrored), and call `analyzeCanvas` with `source: "upload"`.
5. Close the bitmap afterwards.

If the pose check fails on an uploaded photo, still store it so the owner sees it, but mark it invalid with the first reason. Show a short error under the card for decode problems and do not store anything.

## Part 5: The analysing screen (revamp)
Find the existing measurement analysing screen and keep its place in the app. Rework its content:

- Top: the two photo thumbnails (front and side), small, side by side.
- A vertical **stage list**. Each row has a state: waiting, active (with a subtle animated indicator), done (check), or failed (cross with the reason).
- A thin progress bar that moves only when a stage finishes.
- A **subtle scan line** animation over the thumbnails while a stage is active. It is decoration only. Animate with `transform` and `opacity` only, and wrap it in `@media (prefers-reduced-motion: no-preference)`.
- A "Back to photos" button, always available, which cancels the analysis and returns to the hub.
- On failure: show which stage failed and why in plain words, with "Back to photos".

Stages (real work only). Create `frontend/src/features/capture/analysis/runAnalysis.js`:

```js
runAnalysis({ heightCm, front, side }, onStage) -> Promise<{ ok: boolean, ... }>
```
`onStage(id, state, detail)` is called as each stage starts, finishes, or fails. Stages:

1. `photos`: "Checking your photos". Both photos exist and have landmarks.
2. `outline`: "Reading your body outline". Each mask exists, and the body covers between 5% and 80% of the frame. Otherwise fail with "We couldn't read your outline clearly. Try a plainer background."
3. `scale`: "Matching your height". For each photo, find the top-most and bottom-most rows that contain body pixels in the mask, and compute `pixelHeight`. Fail if `pixelHeight` is under 40% of the image height. Compute `cmPerPixel = heightCm / pixelHeight` for each photo and keep both. (Each photo gets its own scale.)
4. `measure`: "Calculating measurements". **Not built yet.** Call a pluggable function `computeMeasurements(...)` that currently returns `{ implemented: false }`. In that case, the screen finishes with a clear plain message: "Your photos are ready. Measurement calculation is the next step to be added." Mark it with `// NEXT: measurement engine goes here`. Do not invent numbers.

The `done` step shows what was really computed (for example both scales as small text: "Front scale: 0.21 cm per pixel") and the message above. Keep it simple and honest.

Put the pixel-height and scale math in small pure functions so they can be unit tested.

## Part 6: Unit tests (no browser needed)
Use the existing test runner (Vitest if installed; otherwise try `npm install -D vitest` in `frontend/`; otherwise Node's `node --test`, and say so). Update or add tests for:
1. **Reducer:** front and side can be set in either order; `startAnalysis` fails unless height, front, and side all exist; `setCapture` returns to `hub`; `cancelCamera` changes nothing else; `clearCapture` clears only that slot; `reset` clears everything; editing height keeps the photos.
2. **Pixel height from a mask:** a hand-made mask with a known top row and bottom row returns the right pixel height; an empty mask returns 0.
3. **Scale:** `cmPerPixel = heightCm / pixelHeight` is correct (for example 170 cm and 800 px gives 0.2125), and a pixel height under 40% of the image height fails.
4. **Outline coverage check:** 4% and 85% fail, 20% passes.
5. **Upload validation:** wrong file type and oversized files are rejected before decoding (test the check function on its own, without decoding).
6. **`runAnalysis`:** with simple fake captures, stages are reported in order, and a failing stage stops the later ones.

Then run the tests, `npm run build`, and lint if configured.

## Part 7: Human visual check (for the owner, not for you)
1. Stop the dev server. In the browser, press F12, open **Application**, then **Service Workers** and click Unregister if anything is listed, and under **Storage** click **Clear site data**. Start the dev server again with the batch file or `npm run dev` in `frontend/`, and open `http://localhost:5174`. Hard refresh (Ctrl+Shift+R).
2. Log in, press the button that used to open the camera. The **height** screen must appear. Check bad values are blocked.
3. Continue to the tips screen, then the **hub** with two empty cards.
4. Tap **Take photo** on Front: the camera opens, goes green on a good A-pose, counts down, captures, and returns to the hub with the photo in the Front card.
5. Tap **Upload** on Side and pick a full-body side photo. It should appear with a green or red status chip.
6. With both photos good, "Analyze my measurements" turns on. Tap it and watch the stages tick.
7. Try a bad upload (a face close-up, or a PNG screenshot). The card should show a red reason and keep "Analyze" locked.

## Out of scope
- Computing any actual measurement (chest, waist, and so on).
- Uploading photos to a server, accounts, or saving results.
- Consent or legal text.

## Report format
```
Part 0 findings:         (start-dev.bat target, files present/missing, render chain, entry point, service worker, port)
Why nothing changed:     (your conclusion, and what you fixed)
Files created:           (list)
Files changed:           (list, one line each)
Entry point:             (button and file that now starts the flow)
Unit tests:              pass / fail (counts, runner used)
Build:                   pass / fail
Lint:                    pass / fail / not configured
Needs human check:       yes (Part 7)
Anything unclear:        (questions for the owner)
```
