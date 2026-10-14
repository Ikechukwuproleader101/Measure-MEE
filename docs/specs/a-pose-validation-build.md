# Task: A-Pose Validation in the Existing Camera Screen

## Goal
In the app's **existing camera screen**, check the user's pose live. The skeleton and the frame outline turn **green** when the user holds a correct A-pose and **red** when they are in view but not correct. The shutter button only works while it is green.

## Context (already done)
- MediaPipe is installed and proven to load and run in the browser.
- `frontend/src/services/poseLandmarker.js` exports `getPoseLandmarker()` (a shared, load-once landmarker in VIDEO mode).
- Model and wasm files are in `frontend/public/` and are served correctly.
- The temporary `PoseTest` screen has been (or is being) removed. Ignore it.

## Hard rules
- Work only inside `frontend/`. Do not touch `backend/` or the root `services/` folder.
- **Do not redesign the camera screen.** Keep its layout, colors, fonts, and components. Add only what this spec asks for.
- **Reuse the camera screen's existing `<video>` element and stream.** Do not call `getUserMedia` a second time.
- Pose detection runs on the device only. No frame or landmark is sent anywhere.
- You cannot open a browser in this environment. Verify with unit tests, build, and lint, then hand the visual check to the owner (Step 7).

## Step 1: Find the existing camera screen
1. Search `frontend/src` for the camera screen (look for `getUserMedia`, a `<video` element, or a component named like `Camera`, `Capture`, or `Scan`).
2. Report its file path, how it gets the video stream, and how its shutter/capture button works.
3. Note exactly how the preview is displayed:
   - Is it mirrored with CSS (for example `scaleX(-1)`)?
   - What `object-fit` and `object-position` does the video use?
   The overlay in Step 5 must copy both, or the skeleton will be flipped or misaligned.

## Step 2: Create the files
All new files go in `frontend/src/features/capture/` (create the folder if it does not exist; if the camera screen already lives elsewhere, put the new files next to it and report where).

```
poseConstants.js       landmark indexes + thresholds
validateAPose.js       pure function, no React, no camera
validateAPose.test.js  unit tests
usePoseValidation.js   hook: detection loop, stability, drawing
```

## Step 3: `poseConstants.js`
```js
export const IDX = {
  nose: 0,
  leftShoulder: 11, rightShoulder: 12,
  leftElbow: 13, rightElbow: 14,
  leftWrist: 15, rightWrist: 16,
  leftHip: 23, rightHip: 24,
  leftAnkle: 27, rightAnkle: 28,
};

// Starting values. Keep every threshold here so they are easy to tune.
export const THRESHOLDS = {
  minVisibility: 0.6,     // each required point must be at least this visible
  frameMargin: 0.02,      // points must be inside 2%..98% of the frame
  armAngleMin: 25,        // degrees between torso and arm, measured at the shoulder
  armAngleMax: 55,
  elbowStraightMin: 155,  // degrees at the elbow (arm roughly straight)
  legSpreadMin: 0.8,      // ankle distance divided by hip width
  legSpreadMax: 2.2,
  facingMaxZDiff: 0.15,   // allowed difference between the two shoulders' z
  bodyHeightMin: 0.55,    // nose-to-ankle as a fraction of frame height
  bodyHeightMax: 0.92,
  stableFramesToPass: 8,  // consecutive good frames before turning green
  failFramesToDrop: 3,    // consecutive bad frames before leaving green
  maxDetectionsPerSecond: 15,
};

export const COLORS = {
  valid: "#22c55e",   // green
  invalid: "#ef4444", // red
  none: "#ffffff",    // no person in view
};
```

## Step 4: `validateAPose.js`
Signature: `validateAPose(landmarks, { width, height }) -> { valid: boolean, reasons: string[] }`

`landmarks` is the array of 33 points for one person (`x`, `y` normalized 0..1, `z`, `visibility`). `width` and `height` are the video's pixel size (`video.videoWidth`, `video.videoHeight`).

**Important:** MediaPipe's x and y are normalized separately, so angles and distances computed on them directly are wrong on a 16:9 video. Convert `x * width` and `y * height` before computing any angle or distance. Use the code below.

```js
import { IDX, THRESHOLDS as T } from "./poseConstants";

const REQUIRED = [
  IDX.nose,
  IDX.leftShoulder, IDX.rightShoulder,
  IDX.leftElbow, IDX.rightElbow,
  IDX.leftWrist, IDX.rightWrist,
  IDX.leftHip, IDX.rightHip,
  IDX.leftAnkle, IDX.rightAnkle,
];

const px = (p, w, h) => ({ x: p.x * w, y: p.y * h });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// Angle in degrees at point b, between the lines b->a and b->c.
function angleAt(a, b, c) {
  const v1 = { x: a.x - b.x, y: a.y - b.y };
  const v2 = { x: c.x - b.x, y: c.y - b.y };
  const m = Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y);
  if (!m) return 0;
  const cos = (v1.x * v2.x + v1.y * v2.y) / m;
  return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
}

export function validateAPose(landmarks, { width = 1280, height = 720 } = {}) {
  if (!landmarks || landmarks.length < 33) {
    return { valid: false, reasons: ["Step into the camera view"] };
  }
  const lm = landmarks;
  const reasons = [];

  // 1) Everything visible and inside the frame. If this fails, the other
  //    measurements are unreliable, so stop here.
  if (REQUIRED.some((i) => (lm[i].visibility ?? 0) < T.minVisibility)) {
    reasons.push("Make sure your whole body is visible");
  }
  const m = T.frameMargin;
  if (REQUIRED.some((i) => lm[i].x < m || lm[i].x > 1 - m || lm[i].y < m || lm[i].y > 1 - m)) {
    reasons.push("Step back so your whole body fits");
  }
  if (reasons.length) return { valid: false, reasons };

  // 2) Distance from the camera.
  const ankleY = (lm[IDX.leftAnkle].y + lm[IDX.rightAnkle].y) / 2;
  const bodyH = ankleY - lm[IDX.nose].y;
  if (bodyH < T.bodyHeightMin) reasons.push("Move a little closer");
  else if (bodyH > T.bodyHeightMax) reasons.push("Step back a little");

  // 3) Facing the camera straight on.
  if (Math.abs(lm[IDX.leftShoulder].z - lm[IDX.rightShoulder].z) > T.facingMaxZDiff) {
    reasons.push("Face the camera straight on");
  }

  // 4) Arms: A-shape and fairly straight, both sides.
  let armsTooLow = false, armsTooHigh = false, elbowsBent = false;
  const sides = [
    { s: IDX.leftShoulder, e: IDX.leftElbow, w: IDX.leftWrist, h: IDX.leftHip },
    { s: IDX.rightShoulder, e: IDX.rightElbow, w: IDX.rightWrist, h: IDX.rightHip },
  ];
  for (const side of sides) {
    const S = px(lm[side.s], width, height);
    const E = px(lm[side.e], width, height);
    const W = px(lm[side.w], width, height);
    const H = px(lm[side.h], width, height);
    const armAngle = angleAt(H, S, W);   // torso line vs arm line
    const elbowAngle = angleAt(S, E, W); // 180 = perfectly straight
    if (armAngle < T.armAngleMin) armsTooLow = true;
    else if (armAngle > T.armAngleMax) armsTooHigh = true;
    if (elbowAngle < T.elbowStraightMin) elbowsBent = true;
  }
  if (armsTooLow) reasons.push("Move your arms slightly away from your body");
  if (armsTooHigh) reasons.push("Lower your arms a little");
  if (elbowsBent) reasons.push("Straighten your arms");

  // 5) Feet about shoulder-width apart.
  const hipW = dist(px(lm[IDX.leftHip], width, height), px(lm[IDX.rightHip], width, height));
  const ankleD = dist(px(lm[IDX.leftAnkle], width, height), px(lm[IDX.rightAnkle], width, height));
  const spread = hipW ? ankleD / hipW : 0;
  if (spread < T.legSpreadMin) reasons.push("Open your feet to about shoulder width");
  else if (spread > T.legSpreadMax) reasons.push("Bring your feet a little closer");

  return { valid: reasons.length === 0, reasons };
}
```
The first item in `reasons` is the one shown to the user as a hint.

## Step 5: `usePoseValidation.js`
Signature: `usePoseValidation({ videoRef, canvasRef, enabled }) -> { isValid, hint, isReady, error }`

Behavior:
1. When `enabled` and the video has data, call `getPoseLandmarker()` and set `isReady` when it resolves. Catch errors and return them in `error`.
2. Run a `requestAnimationFrame` loop:
   - Skip until `video.readyState >= 2`.
   - Only detect when `video.currentTime` has changed since the last detection, and no more than `maxDetectionsPerSecond` times per second.
   - Call `landmarker.detectForVideo(video, performance.now())` and take `result.landmarks[0]`.
3. For each detection:
   - No person: draw nothing, count it as a bad frame, hint = "Step into the camera view".
   - Person found: `validateAPose(landmarks, { width: video.videoWidth, height: video.videoHeight })`.
4. **Stability (prevents flicker):** `isValid` becomes true only after `stableFramesToPass` consecutive valid frames. It becomes false only after `failFramesToDrop` consecutive invalid frames. Keep the counters in refs.
5. **Drawing** on `canvasRef` using MediaPipe's `DrawingUtils`:
   - Set the canvas size to `video.videoWidth` x `video.videoHeight` (once, or when it changes).
   - Clear it each detection.
   - Color: `COLORS.valid` when `isValid` is true, `COLORS.invalid` when a person is in view but `isValid` is false, `COLORS.none` when no person is detected.
   - `drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, { color, lineWidth: 4 })` and `drawLandmarks(landmarks, { color, fillColor: color, radius: 4 })`.
6. Avoid re-rendering on every frame: only call `setState` when `isValid` or `hint` actually changes.
7. Clean up on unmount or when `enabled` becomes false: cancel the animation frame and clear the canvas. Do **not** close the shared landmarker and do **not** stop the stream (the camera screen owns it).
8. Must be safe under React StrictMode (effects run twice in development): use a `cancelled` flag.

## Step 6: Wire it into the existing camera screen
Make small additions only.

1. **Overlay canvas.** Add a `<canvas>` positioned exactly on top of the existing video, inside the same wrapper (`position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none`).
   - Give the canvas the **same** `object-fit` and `object-position` as the video.
   - If the video preview is mirrored with CSS, apply the **same** transform to the canvas, so the skeleton matches the picture.
2. **Frame outline.** Add a colored outline around the camera frame using `box-shadow` or `outline` (not `border`, so the layout does not shift). Colors: green when `isValid`, red when a person is in view but not valid, and the existing default when no person is detected or while loading.
3. **Hint text.** Show `hint` as one short line near the frame, using the app's existing text styles. When valid, show a short positive message such as "Perfect, hold still". While loading, show "Getting ready...".
4. **Shutter button.**
   - `disabled` unless `isValid` is true.
   - Also check `isValid` at the start of the capture handler and return early if it is false.
   - Do not change what the capture does once it fires.
5. If `error` is set, show a friendly message and leave the shutter disabled. Do not crash the screen.

## Step 7: Unit tests (these need no browser)
Add `validateAPose.test.js`. Use Vitest if it is installed. If it is not, try `npm install -D vitest` inside `frontend/`; if that is not possible, use Node's built-in runner (`node --test`) and say so.

Use this helper to build a **good** pose (video 1280x720). Every point not listed is `{ x: 0.5, y: 0.5, z: 0, visibility: 0.99 }`.

```js
const base = () => {
  const lm = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.99 }));
  const set = (i, x, y) => { lm[i] = { x, y, z: 0, visibility: 0.99 }; };
  set(0, 0.5, 0.10);                       // nose
  set(11, 0.44, 0.24); set(12, 0.56, 0.24); // shoulders
  set(13, 0.397, 0.356); set(14, 0.603, 0.356); // elbows
  set(15, 0.354, 0.472); set(16, 0.646, 0.472); // wrists
  set(23, 0.46, 0.55); set(24, 0.54, 0.55);     // hips
  set(27, 0.444, 0.90); set(28, 0.556, 0.90);   // ankles
  return lm;
};
```
Tests to write (call with `{ width: 1280, height: 720 }`):
1. The good pose returns `valid: true` and no reasons.
2. Empty or too-short landmark array returns `valid: false`.
3. Arms hanging straight down (set wrists to `x` of the shoulder, `y = 0.52`; elbows halfway) returns `valid: false`, and a reason about moving arms away from the body.
4. Feet together (ankles at `x = 0.48` and `0.52`) returns `valid: false`, and a reason about feet.
5. Bent left elbow (set point 13 to `x = 0.375, y = 0.319`) returns `valid: false`, and a reason about straightening arms.
6. One ankle with `visibility = 0.2` returns `valid: false`, and a reason about the whole body being visible.
7. An ankle at `y = 0.995` returns `valid: false`, and a reason about stepping back.

If the good-pose test fails, fix the thresholds or the fixture only after explaining why in the report.

Then run: the tests, `npm run build`, and lint if configured.

## Step 8: Human visual check (for the project owner, not for you)
After your changes, tell the owner to:
1. Run the app and open the camera screen on a laptop with a webcam.
2. Prop the laptop on a table or shelf and step back 2 to 3 meters so the whole body is visible, head to feet.
3. Confirm that:
   - The skeleton appears on the body, aligned with it, and is **red** at first.
   - Standing with arms about 40 degrees from the body, straight, feet about shoulder width apart, facing the camera: the skeleton and frame turn **green** after about half a second.
   - Lowering the arms or closing the feet turns it red and changes the hint.
   - The shutter does nothing while red and works while green.
4. Note which hint appears when it will not turn green, so thresholds can be tuned.

## Out of scope
- The side-view pose (a later task).
- Uploading, storing, or measuring the photos.
- Any backend change.
- Any redesign of the camera screen.

## Report format
```
Camera screen found:      (path, how the stream works, mirroring, object-fit)
Files created:            (list)
Files changed:            (list, one-line reason each)
Unit tests:               pass / fail (counts, runner used)
Build:                    pass / fail
Lint:                     pass / fail / not configured
Threshold changes:        (none, or what and why)
Needs human check:        yes (Step 8)
Anything unclear:         (questions for the owner)
```
