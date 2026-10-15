# Task: Height Entry + Front and Side Capture Flow

## Goal
Build the capture flow that gathers everything the measurement step will need, **on the device**:

1. The user enters their height.
2. The user takes a **front** photo (A-pose, already validated by the existing checker).
3. The user takes a **side** photo (relaxed, turned sideways, with its own checker).
4. For each photo, the app keeps the image, the body landmarks, and a body-outline mask, all taken from the exact captured frame.

Measuring is **not** part of this task. This task ends with a "ready to measure" state holding the data below.

## Context (already done)
- The camera screen exists and the A-pose check works: green skeleton and frame outline, shutter locked until green (`validateAPose.js`, `usePoseValidation.js` in `frontend/src/features/capture/`).
- `frontend/src/services/poseLandmarker.js` exports the shared live landmarker (VIDEO mode, no masks, kept fast on purpose).
- Login works. This task does not touch auth.

## Hard rules
- Work only inside `frontend/`. Do not touch `backend/` or the root `services/` folder.
- **No uploading, no network calls with images or landmarks.** Everything stays in memory on the device for now.
- Do not redesign any screen. Reuse the app's existing components, colors, and fonts. Add only what is listed here.
- Reuse the existing camera screen for both front and side. Do not build a second camera screen.
- Do not call `getUserMedia` more than the existing screen already does.
- You cannot open a browser here. Verify with unit tests, build, and lint, then hand the visual check to the owner (Step 10).

## Step 1: Find what exists
Report:
1. The camera screen file and how it gets its stream.
2. Whether a height input already exists anywhere. If it does, reuse it instead of making a new one.
3. How screens are navigated (router, a step state, etc.).
4. Whether the app already has a shared store or context library (Context, Zustand, Redux). Use what exists; do not add a new library.

## Step 2: The capture data shape
Each photo produces one `CaptureResult`:

```js
{
  view: "front" | "side",
  imageBlob: Blob,          // JPEG, quality 0.92, full video resolution, NOT mirrored
  previewUrl: string,       // URL.createObjectURL(imageBlob), revoke on retake and unmount
  width: number,            // pixel width of the captured frame
  height: number,           // pixel height of the captured frame
  landmarks: Array<{ x, y, z, visibility }>,       // 33 points, normalized
  worldLandmarks: Array<{ x, y, z, visibility }>,  // 33 points, meters
  mask: { data: Uint8Array, width: number, height: number } | null, // 1 = body, 0 = background
  capturedAt: number,       // Date.now()
}
```
Important: the preview on screen may be mirrored with CSS, but stored data is **never** mirrored. Landmarks and mask must line up with the stored image.

## Step 3: A session store (in memory only)
Create `frontend/src/features/capture/captureSession.js` (context or the app's existing store) holding:

```js
{ step, heightCm, front: CaptureResult | null, side: CaptureResult | null }
```
with `step` one of: `"height"`, `"prep"`, `"front"`, `"reviewFront"`, `"side"`, `"reviewSide"`, `"done"`.

Actions: `setHeight`, `goTo(step)`, `setCapture(view, result)`, `retake(view)` (clears that capture, revokes its preview URL, returns to that view's step), `reset()`.

Rules:
- `front` must exist before `side` can start.
- `done` is only reachable when `heightCm`, `front`, and `side` are all present.
- Nothing is written to `localStorage`, cookies, or any network.

Write it as a small reducer so it can be unit tested without React.

## Step 4: Height step
- One field: "Your height (cm)". Numeric input.
- Accept 100 to 230. Anything else shows a short message and blocks Continue.
- One short line under it: "We use your height to get the scale right."
- Store as `heightCm` (number).

## Step 5: Get-ready tips step (`prep`)
A single plain screen before the front camera opens, using existing styles, with these tips (short, one line each):
- Wear fitted clothes (loose clothes make measurements bigger).
- Stand 2 to 3 meters from the camera with your whole body in view, head to feet.
- Put the camera about chest height, level, not tilted.
- Plain background and good light in front of you.
- Take off shoes and bulky jackets if you can.

Button: "I'm ready". Leave room for the owner to add consent text later (do not invent legal copy).

## Step 6: Checker for the side photo
Add to `poseConstants.js`:

```js
export const SIDE_THRESHOLDS = {
  minVisibility: 0.5,        // only the camera-facing side is required
  frameMargin: 0.02,
  bodyHeightMin: 0.55,       // nose to ankle as fraction of frame height
  bodyHeightMax: 0.92,
  maxShoulderSeparation: 0.35, // shoulder-to-shoulder distance / torso length
  maxArmAngle: 30,           // degrees at the shoulder between torso and arm
  maxLean: 0.2,              // |shoulder x - ankle x| / body height
};
```
Create `validateSidePose.js` with the same signature as `validateAPose`:
`validateSidePose(landmarks, { width, height }) -> { valid, reasons }`

Logic:
1. Convert x and y to pixels (`x * width`, `y * height`) before any angle or distance, same as `validateAPose`.
2. Choose the camera-facing side: compare the average visibility of the left set (shoulder 11, elbow 13, wrist 15, hip 23, knee 25, ankle 27) with the right set (12, 14, 16, 24, 26, 28). Use the higher one as `side`.
3. **Visible:** nose (0) plus all six points of `side` have visibility at least `minVisibility`. Else reason "Make sure your whole body is visible", and stop.
4. **In frame:** nose and the six `side` points inside `frameMargin` to `1 - frameMargin` on both axes. Else "Step back so your whole body fits", and stop.
5. **Distance:** `(side ankle y - nose y)` between `bodyHeightMin` and `bodyHeightMax`. Too small: "Move a little closer". Too big: "Step back a little".
6. **Sideways:** shoulder separation (pixel distance between points 11 and 12) divided by torso length (pixel distance between the shoulder midpoint and the hip midpoint) must be at most `maxShoulderSeparation`. Else "Turn 90 degrees so you are facing sideways".
7. **Arms relaxed:** angle at the `side` shoulder between the hip and the wrist, at most `maxArmAngle`. Else "Let your arms hang naturally at your sides".
8. **Upright:** `|side shoulder x - side ankle x|` in pixels divided by body height in pixels, at most `maxLean`. Else "Stand up straight".
9. `valid` is true when `reasons` is empty. The first reason is the hint.

## Step 7: Let the existing hook use either checker
Change `usePoseValidation` minimally so it accepts a validator:

```js
usePoseValidation({ videoRef, canvasRef, enabled, validator = validateAPose })
```
Everything else (stability frames, drawing, green and red colors, hint) stays the same. The front step passes `validateAPose`; the side step passes `validateSidePose`.

## Step 8: A separate capture-time landmarker (masks only when capturing)
In `poseLandmarker.js`, add a second shared landmarker; do **not** change the live one:

```js
export function getCaptureLandmarker()
```
- Same model and wasm paths, same GPU-then-CPU fallback as the live one.
- `runningMode: "IMAGE"`, `numPoses: 1`, `outputSegmentationMasks: true`.
- Created once, reused.

Add `captureFrame.js` with:

```js
captureFrame({ video, view, validator }) -> Promise<CaptureResult | { error: string }>
```
Steps:
1. Draw the current video frame to an offscreen canvas at `video.videoWidth` x `video.videoHeight`. Do **not** mirror it.
2. `const result = landmarker.detect(canvas)` using `getCaptureLandmarker()`.
3. Take `result.landmarks[0]` and `result.worldLandmarks[0]`. If missing, return `{ error: "We couldn't see you clearly. Try again." }`.
4. **Re-check the pose on these captured-frame landmarks** with the same `validator`. If it fails, return `{ error: <first reason> }`. This stops a bad photo if the user moved at the moment of capture.
5. Turn the mask into a compact 0/1 array, then free it:
```js
let mask = null;
const m = result.segmentationMasks && result.segmentationMasks[0];
if (m) {
  const f = m.getAsFloat32Array();
  const data = new Uint8Array(f.length);
  for (let i = 0; i < f.length; i++) data[i] = f[i] > 0.5 ? 1 : 0;
  mask = { data, width: m.width, height: m.height };
  m.close();
}
```
Put the 0/1 conversion in its own small pure function so it can be unit tested.
6. Make the JPEG blob with `canvas.toBlob(..., "image/jpeg", 0.92)`, create `previewUrl`, and return the full `CaptureResult`.

## Step 9: Wire the flow into the existing screens
1. Flow order: `height` -> `prep` -> `front` -> `reviewFront` -> `side` -> `reviewSide` -> `done`.
2. **Front and side steps** reuse the existing camera screen, passing `view` and the matching validator. Show a short instruction line for each view using the app's existing text style:
   - Front: "Stand facing the camera, arms out slightly in an A shape."
   - Side: "Turn to your side, arms relaxed by your body."
3. **Hands-free capture.** The user stands 2 to 3 meters away and cannot reach the screen. So when the frame has been green (stable) for the first time, start a visible 3 -> 2 -> 1 countdown and capture at 0. If the frame turns red during the countdown, cancel it and reset. Keep the manual shutter button working too (still locked while red). Put the countdown time in one constant (`COUNTDOWN_SECONDS = 3`).
4. After capture, call `captureFrame`. On `{ error }`, show the message and return to live view. On success, store it with `setCapture` and go to the review step.
5. **Review steps** show the captured photo (`previewUrl`) with two buttons: "Retake" (calls `retake(view)`) and "Looks good" (goes to the next step). Do not draw the skeleton on the review photo.
6. **Done step:** a simple screen saying photos are captured and measurements come next. Show a small thumbnail of each photo. No measuring yet. Add a clearly marked `// NEXT: measurement step goes here` comment where the next task will plug in.
7. Clean up: revoke preview URLs on retake and on leaving the flow; stop the camera stream when leaving the camera steps; never keep the live landmarker loop running when no camera screen is open.

## Step 10: Unit tests (no browser needed)
Use the existing test runner. If none is installed, try `npm install -D vitest` inside `frontend/`; if that is not possible, use Node's built-in runner (`node --test`) and say so.

Write tests for:
1. **`validateSidePose`:** build a good side pose by hand (video 1280x720) and check it returns valid. Then check each failure alone: shoulders far apart (facing the camera), arm raised away from the body, a visible-side ankle with low visibility, ankle out of frame, body too small, and a heavy lean. Each should return `valid: false` and a matching reason. If the good pose fails, adjust the fixture or thresholds, and explain why in the report.
2. **Height check:** 99 and 231 are rejected; 100, 175, and 230 are accepted; empty and text are rejected.
3. **Session reducer:** `side` cannot start without `front`; `done` is unreachable unless height, front, and side are all set; `retake` clears only that view; `reset` clears everything.
4. **Mask conversion:** values above 0.5 become 1, others 0, the length is preserved, and the output is a `Uint8Array`.

Then run the tests, `npm run build`, and lint if configured.

## Step 11: Human visual check (for the project owner, not for you)
After the changes, the owner should:
1. Open the app, log in, enter a height, and confirm bad values (like 50) are blocked.
2. Read the tips screen, tap "I'm ready", and stand back with the whole body visible.
3. Front photo: hold the A-pose. The frame goes green, a 3-2-1 countdown starts, and a photo is taken. Check that moving during the countdown cancels it.
4. Review screen: the photo looks right (not mirrored the wrong way), "Retake" works, "Looks good" continues.
5. Side photo: turn sideways with arms relaxed. It should only go green when really sideways. Try facing the camera and confirm it stays red with a sensible hint.
6. Done screen shows both thumbnails.
7. Refresh the page mid-way. It is fine (and expected) that the flow restarts, since nothing is saved.

## Out of scope (do not do these now)
- Computing any measurement.
- Uploading or storing photos or numbers anywhere.
- Consent or legal copy.
- Switching to a larger pose model. If the capture-time landmarks look rough, that is a tuning job for later.
- Any redesign of existing screens.

## Report format
```
Existing pieces found:    (camera screen path, height input?, navigation, store library)
Files created:            (list)
Files changed:            (list, one line each)
Side checker thresholds:  (any changes from the defaults, and why)
Unit tests:               pass / fail (counts, runner used)
Build:                    pass / fail
Lint:                     pass / fail / not configured
Needs human check:        yes (Step 11)
Anything unclear:         (questions for the owner)
```
