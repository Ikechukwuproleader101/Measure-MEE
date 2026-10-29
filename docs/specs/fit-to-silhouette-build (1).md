# Task: Pass the Pose by Fitting the On-Screen Silhouette

## Goal
The person passes when their body is **within range of the silhouette shown on the camera screen**. They do not have to match it exactly. What the user sees on screen is what decides the result.

- MediaPipe keeps finding the body joints on every frame. The skeleton stays hidden.
- Each joint is compared with its own target spot on the silhouette. A joint passes if it lands inside a forgiving zone around that spot.
- The silhouette turns **green** as soon as the person fits, and **red** when a person is detected but does not fit.
- The capture button is **always available**. Pressing it starts the existing 3-second countdown. At the end, the photo is taken only if the person fits the silhouette; otherwise a short "try again" message appears.

## Why this replaces the old rule
The old checker measured angles and distances behind the scenes. A person could match the picture and still stay red, because it measured something different from what they see. This task makes the silhouette itself the standard.

Where this file conflicts with `silhouette-guide-build.md`, `capture-flow-build.md`, or `photo-hub-and-analysis-screen.md`, **this file wins**. Keep everything those files built that this file does not change.

## Hard rules
- Work only inside `frontend/`. Do not touch `backend/` or the root `services/` folder.
- Do not change the hint pill's look, the "Screens" button, the outer frame border colors, the upload path, the photo hub, or the analysing screen.
- Keep `validateAPose.js` and its tests (they are no longer used by the live camera; mark them `// not used by the live camera`).
- Detection still runs on every frame. The skeleton is drawn only in debug mode.
- You cannot open a browser here. Verify with unit tests, build, and lint, then hand the visual check to the owner.

## Step 1: Find what exists (report before changing)
1. The camera screen and the hook that runs detection (names may be `BodyCamera.jsx`, `useMediaPipePose`, or `usePoseValidation`).
2. The silhouette that is currently displayed. Check git history for the **owner's original dashed silhouette** that was replaced earlier (for example `git log --all --stat` on the camera screen and the silhouette artwork, and `git show <commit>:<path>`), and look for a kept copy of the old artwork file.
3. `poseGuide.js` and `placeGuide` if they exist from the last task.
4. How the video is displayed (`object-fit`, mirroring by CSS) and what size box shows it.
5. How the countdown, the capture button, and `captureFrame` currently work.

## Step 2: Restore the owner's original silhouette
The owner prefers the original dashed silhouette from before the last change.
1. If the original artwork can be recovered (from git history or a kept file), restore it as the live silhouette. If it is an image file, view it. If it is an SVG, read its shapes.
2. If it cannot be recovered, keep the current built-in silhouette and say so in the report.
3. Make the silhouette data-driven with one definition object per artwork, so geometry is not scattered in the code:

```js
export const GUIDE = {
  viewBox: { w, h },                 // the artwork's own coordinate system
  bounds: { top, bottom, left, right }, // where the figure sits inside the viewBox
  joints: {                          // target spots, in the artwork's coordinates
    nose: [x, y],
    leftShoulder: [x, y],  rightShoulder: [x, y],
    leftElbow: [x, y],     rightElbow: [x, y],
    leftWrist: [x, y],     rightWrist: [x, y],
    leftHip: [x, y],       rightHip: [x, y],
    leftKnee: [x, y],      rightKnee: [x, y],
    leftAnkle: [x, y],     rightAnkle: [x, y],
  },
};
```
4. Fill `joints` as well as you can by reading the artwork (for example: head center for `nose`, shoulder points at the top of the arms, wrists at the end of the arms, ankles at the bottom of the legs). These first values are **estimates**. Step 8 lets the owner record exact values by standing in the silhouette.
5. If the built-in silhouette is used as a fallback, its values (in the viewBox `0 0 400 600`) are:
   nose [200,95]; shoulders [150,150] and [250,150]; elbows [102,220] and [298,220]; wrists [54,290] and [346,290]; hips [165,300] and [235,300]; knees [160,420] and [240,420]; ankles [155,535] and [245,535]; bounds top 58, bottom 560, left 46, right 354.
6. Keep the silhouette's look: dashed outline, same stroke width and opacity as the owner's original, `pointer-events: none`, `vector-effect: non-scaling-stroke`. Colors: white when idle, `COLORS.invalid` when a person is visible but not fitting, `COLORS.valid` and a solid stroke when fitting. Use a 200 ms color transition inside `@media (prefers-reduced-motion: no-preference)`.

## Step 3: Place the silhouette on the visible camera area
Update `placeGuide` (or create it) to work with any artwork definition:

```
cs     = fit === "cover" ? max(boxW/videoW, boxH/videoH) : min(boxW/videoW, boxH/videoH)
margin = 0.03 * min(boxW, boxH)
figH   = GUIDE.bounds.bottom - GUIDE.bounds.top
figW   = GUIDE.bounds.right  - GUIDE.bounds.left
k      = min(0.88 * boxH / figH, (boxW - 2*margin) / figW)     // box pixels per artwork unit
cx     = (GUIDE.bounds.left + GUIDE.bounds.right) / 2
cy     = (GUIDE.bounds.top  + GUIDE.bounds.bottom) / 2
tx     = boxW/2 - cx*k
ty     = boxH/2 - cy*k
```
Return `{ k, tx, ty, cs }`. An artwork point `(x, y)` lands at box pixels `(tx + x*k, ty + y*k)`. Recompute on resize, rotation, and when the video size is known (`ResizeObserver` and `loadedmetadata`). No hardcoded pixel sizes. (The old "nose-to-ankle fraction of the video" rule is gone; the checker no longer uses it.)

## Step 4: The fit rule (`fitToGuide.js`, pure function)
Config in one object (`FIT_CONFIG`) in `poseConstants.js`, so it is easy to tune:

```js
export const FIT_CONFIG = {
  // zone radius as a fraction of the silhouette's height (figH * k in pixels)
  radius: {
    nose: 0.07, leftShoulder: 0.06, rightShoulder: 0.06,
    leftHip: 0.07, rightHip: 0.07,
    leftElbow: 0.07, rightElbow: 0.07,
    leftKnee: 0.07, rightKnee: 0.07,
    leftWrist: 0.09, rightWrist: 0.09,
    leftAnkle: 0.08, rightAnkle: 0.08,
  },
  coreJoints: ["nose","leftShoulder","rightShoulder","leftHip","rightHip",
               "leftWrist","rightWrist","leftAnkle","rightAnkle"], // must all fit
  allowedMisses: 1,          // among the non-core joints (elbows, knees)
  minVisibilityCore: 0.4,
  smoothingAlpha: 0.5,       // joint smoothing; 1 = no smoothing
  passHoldMs: 300,           // fit must hold this long before turning green
  failHoldMs: 250,           // must fail this long before leaving green
  captureRadiusScale: 1.3,   // extra room for the final check at capture time
  captureGraceMs: 500,       // green within this time counts at capture
  countdownSeconds: 3,
};
```

MediaPipe landmark indexes: nose 0; shoulders 11, 12; elbows 13, 14; wrists 15, 16; hips 23, 24; knees 25, 26; ankles 27, 28.

Signature:
```js
fitToGuide({ landmarks, placement, videoW, videoH, boxW, boxH, fit, mirrored, radiusScale = 1 })
  -> { pass, hint, joints: [{ name, x, y, tx, ty, radius, dist, ok }], size: { ratio, dx, dy } }
```
Steps:
1. **Person joints to box pixels.** For each of the 13 joints, from normalized `(u, v)` in the raw video frame: `bx = boxW/2 + (u - 0.5)*videoW*cs`, `by = boxH/2 + (v - 0.5)*videoH*cs`. If the preview is mirrored by CSS, use `bx = boxW - bx`. Use the displayed positions, since the user sees them.
2. **Smoothing.** Apply `smoothingAlpha` exponential smoothing per joint across frames (keep the previous smoothed values in the hook, not in this pure function; pass the smoothed joints in, or do it in a small separate `smoothJoints` helper).
3. **Target spots to box pixels:** `(tx + x*k, ty + y*k)` for each artwork joint.
4. **Left/right pairing is mirror-agnostic.** For each left/right pair (shoulders, elbows, wrists, hips, knees, ankles), sort the two person points by displayed `bx`, sort the two target spots by `gx`, and match them in order. This way mirroring never swaps the arms.
5. **Zone radius in pixels:** `radius[name] * (figH * k) * radiusScale`.
6. **Per joint:** `dist` is the pixel distance to its target; `ok` is `dist <= radius`.
7. **Visibility:** core joints with `visibility < minVisibilityCore` count as failed and set the hint "Make sure your whole body is visible".
8. **Pass:** all core joints are `ok`, and at most `allowedMisses` non-core joints are not `ok`.
9. **Size and position for hints:** `ratio` = person height (nose to the mean of the ankles, in pixels) divided by the guide's nose-to-ankle height. `dx` and `dy` = person's center minus the guide's center.
10. **Hint** (first match wins, empty when pass):
    - Core joint not visible: "Make sure your whole body is visible"
    - `ratio < 0.8`: "Move a little closer"
    - `ratio > 1.25`: "Step back a little"
    - `dx` more than 10% of the guide width to the right: "Move a little to the left"; to the left: "Move a little to the right" (directions are as the user sees the screen)
    - Wrists or elbows outside: "Match your arms to the outline"
    - Ankles or knees outside: "Match your feet to the outline"
    - Anything else outside: "Line up your body with the outline"
    - No person detected: "Step into the camera view"
    - Pass: "Perfect, hold still" (use the existing pass text if one exists)

Also add two small pure helpers:
```js
createHoldTracker({ passHoldMs, failHoldMs })  // .update(pass, nowMs) -> boolean "isValid"
shouldCaptureAtZero({ isValid, lastValidAtMs, nowMs, graceMs })
```
`createHoldTracker`: becomes valid after `pass` has been true continuously for `passHoldMs`; once valid, stays valid until `pass` has been false continuously for `failHoldMs` (so one noisy frame never drops it). `shouldCaptureAtZero` is true if `isValid` now, or it was valid within `graceMs`.

## Step 5: Update the hook and the camera screen
1. The hook still runs detection on every frame (no change to its rate limiting). Each frame, it maps the landmarks, smooths them, calls `fitToGuide`, feeds `pass` to the hold tracker, and exposes `{ isValid, personVisible, hint }` as before, plus `lastValidAtMs`. The state for the silhouette is `guideState({ personVisible, isValid })` (idle, invalid, valid), unchanged.
2. **Capture button is always enabled** once the camera is ready. Remove the lock-until-green behavior. Remove the automatic start of the countdown when the frame turns green (if it exists). Keep a constant `AUTO_START_WHEN_GREEN = false` so it can be switched back.
3. Pressing the button starts the existing 3-second countdown (`countdownSeconds`). Pressing the button again during the countdown cancels it. The silhouette keeps updating during the countdown.
4. At 0, call `shouldCaptureAtZero(...)`. If true, capture. If false, do not capture; show the short message "Not quite. Match the outline and try again." (use the hint pill or the existing message area), and return to normal.
5. **Capture-time re-check.** `captureFrame` currently re-checks the captured frame with a validator. For the live camera, pass a validator that runs `fitToGuide` on the capture-time landmarks with the current placement and `radiusScale = captureRadiusScale`. If it fails, return the usual `{ error }` with the hint text. The upload path is **unchanged** and keeps its current behavior.
6. For the side photo step, keep the current behavior (no A-pose silhouette). A side guide is a later task.

## Step 6: Debug and calibration mode (`?debug=pose`)
The debug flag may already exist; extend it. When `debug=pose` is in the address (search string or after `#`):
1. Draw the **skeleton** in state colors (as before).
2. Draw each **target zone** as a thin circle (radius = its tolerance) at its target spot, and each **detected joint** as a dot, green if inside its zone and red if outside.
3. Show a small readout: pass or fail, `ratio`, `dx`, `dy`, the worst joint name, and its distance divided by its radius.
4. Add a **"Record pose"** button. When pressed while the person stands in the silhouette, collect about 1 second of frames (10 or more), average each joint's position, convert each from box pixels back to artwork coordinates (`x = (bx - tx)/k`, `y = (by - ty)/k`, un-mirroring first if the preview is mirrored; treat left and right by sorting on x as in the pairing rule), and show the result as JSON in a text box with a **Copy** button (use `navigator.clipboard`), in this shape:
```json
{ "nose": [x,y], "leftShoulder": [x,y], "rightShoulder": [x,y], "leftElbow": [x,y], "rightElbow": [x,y], "leftWrist": [x,y], "rightWrist": [x,y], "leftHip": [x,y], "rightHip": [x,y], "leftKnee": [x,y], "rightKnee": [x,y], "leftAnkle": [x,y], "rightAnkle": [x,y] }
```
This lets the owner stand exactly as the silhouette shows and record the true target spots, instead of relying on estimates. Debug UI must not appear without the flag.

## Step 7: Unit tests (no browser needed)
Use the existing test runner. If none is installed, try `npm install -D vitest` inside `frontend/`; otherwise Node's built-in runner, and say so. Express test poses **relative to the active artwork** (scale and shift the artwork's own `GUIDE.joints` around the figure's center), not with hardcoded pixel numbers, so tests stay valid if the artwork changes.

1. **Perfect fit:** person joints exactly on the targets pass; hint is empty.
2. **Scale:** 0.9 and 1.1 of the guide size pass; 0.6 fails with "Move a little closer"; 1.5 fails with "Step back a little".
3. **Shift:** a 5% box-width shift passes; a 25% shift fails with the correct left/right hint.
4. **Arms down:** wrists straight below the shoulders fails with the arms hint.
5. **Feet far apart:** ankles twice as far apart as the guide's fails with the feet hint.
6. **One bad elbow or knee** passes (`allowedMisses`), two fail.
7. **Core joint not visible** fails with the visibility hint.
8. **Mirrored preview:** the same person passes when `mirrored` is true and the joints are mirrored horizontally. Left and right swapped in the input still passes (pairing is mirror-agnostic).
9. **Zone check at capture:** a pose that fails at radius 1.0 but passes at `captureRadiusScale` is reported correctly by the `radiusScale` argument.
10. **`createHoldTracker`:** valid only after 300 ms of continuous pass; a single false frame after valid does not drop it; 250 ms of continuous fail does.
11. **`shouldCaptureAtZero`:** true if valid now, true if valid 400 ms ago, false if valid 700 ms ago.
12. **`placeGuide`:** the whole figure fits inside the box with at least a 3% margin for a few box shapes (a tall phone box, a square box, a wide box) and for both `cover` and `contain`.
13. **Smoothing helper:** with `smoothingAlpha = 0.5`, a step change moves halfway on the first update.
14. **Record-pose math:** converting known box pixels to artwork coordinates and back returns the original values (for mirrored and not mirrored).

Then run the tests, `npm run build`, and lint if configured.

## Step 8: Human visual check (for the owner, not for you)
After this is pushed and Vercel redeploys, on the phone in Chrome or Safari (hard refresh, or a private tab):
1. Open the camera screen. Your original dashed silhouette is back, with no red skeleton.
2. Press the capture button. During the 3 seconds, step back and fit inside the silhouette. If you fit, the silhouette turns green and the photo is taken at 0. If not, you see "Not quite. Match the outline and try again."
3. Stand in the silhouette without pressing capture. It should turn green within about half a second when you fit, and red when you move out of it.
4. Open the page with `?debug=pose` added before the `#`. Check that the zone circles sit where the joints of the silhouette are.
5. **Calibration:** with `?debug=pose` on, stand exactly as the silhouette shows and press **Record pose**. Copy the JSON and paste it into the chat. The values will become the exact target spots.

## Out of scope
- A silhouette for the side photo.
- Any change to the upload path.
- Any backend, database, or measurement calculation.

## Report format
```
Existing pieces found:    (camera screen, hook, silhouette, video fit, mirroring, countdown)
Original silhouette:      restored (path) / not recoverable (using built-in)
Joint spots source:       estimated from artwork / fallback values
Files created:            (list)
Files changed:            (list, one line each)
Capture button:           always enabled? yes/no; auto-start removed? yes/no
Tests:                    pass / fail (counts, runner used)
Build:                    pass / fail
Lint:                     pass / fail / not configured
Needs human check:        yes (Step 8)
Anything unclear:         (questions for the owner)
```
