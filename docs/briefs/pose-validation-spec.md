# A-Pose Validation for the Camera Screen

## Goal
While the camera is open, detect the user's body pose on-device with MediaPipe. Show a green frame outline only when the user holds a correct A-pose. The shutter button stays disabled (and the capture handler refuses to fire) unless the frame is green.

## Hard rules
- All pose detection runs **in the frontend, on the device**. No video frames, images, or landmarks are ever sent to the backend.
- Do **not** touch `backend/` or the root `services/` folder for this feature.
- Assumes the **React web** frontend. (React Native needs a different approach; stop and ask if the target is RN.)

## Install (run inside `frontend/`)
```
npm install @mediapipe/tasks-vision
```

## Assets (files the browser downloads, not imported code)
```
frontend/public/models/pose_landmarker_lite.task
frontend/public/mediapipe/wasm/        <- copy of node_modules/@mediapipe/tasks-vision/wasm/*
```
Model download:
`https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task`

Serve the wasm files locally from `public/` so nothing is fetched from a CDN at runtime.

## File layout
```
frontend/src/
  services/
    poseLandmarker.js          <- MediaPipe setup (singleton)
  features/capture/
    CameraScreen.jsx           <- video, outline color, shutter button
    usePoseValidation.js       <- detection loop + stability logic
    validateAPose.js           <- pure function, no React, no camera
    poseConstants.js           <- landmark indices + thresholds
```

## 1. `services/poseLandmarker.js`
- Export `getPoseLandmarker()` that creates the landmarker **once** and returns the same instance afterwards.
- Use `FilesetResolver.forVisionTasks("/mediapipe/wasm")`.
- Create with `PoseLandmarker.createFromOptions` using:
  - `baseOptions.modelAssetPath: "/models/pose_landmarker_lite.task"`
  - `runningMode: "VIDEO"`
  - `numPoses: 1`
  - `delegate: "GPU"` (fall back to CPU if it fails)
- Export `closePoseLandmarker()` for cleanup on unmount.

## 2. `poseConstants.js`
Landmark indices (MediaPipe Pose):

| Name | Index |
|---|---|
| nose | 0 |
| leftShoulder / rightShoulder | 11 / 12 |
| leftElbow / rightElbow | 13 / 14 |
| leftWrist / rightWrist | 15 / 16 |
| leftHip / rightHip | 23 / 24 |
| leftAnkle / rightAnkle | 27 / 28 |

Starting thresholds (keep them in one object so they are easy to tune):

```js
export const THRESHOLDS = {
  minVisibility: 0.6,          // every required landmark must be at least this visible
  frameMargin: 0.02,           // landmarks must sit inside 2%..98% of the frame
  armAngleMin: 25,             // degrees between torso line and arm, at the shoulder
  armAngleMax: 55,
  elbowStraightMin: 155,       // degrees at the elbow (arms roughly straight)
  legSpreadMin: 0.8,           // ankle distance / hip width
  legSpreadMax: 2.0,
  facingMaxZDiff: 0.15,        // |leftShoulder.z - rightShoulder.z|
  bodyHeightMin: 0.60,         // nose-to-ankle as fraction of frame height
  bodyHeightMax: 0.92,
  stableFramesToPass: 8,       // consecutive valid frames before turning green
  failFramesToDrop: 3,         // consecutive invalid frames before turning red
};
```
These are starting guesses. Tune them by testing with real people.

## 3. `validateAPose.js` (pure function)
Signature:
```js
validateAPose(landmarks) -> { valid: boolean, reasons: string[] }
```
`landmarks` is the array of 33 normalized points (`x`, `y`, `z`, `visibility`) for one person. Return `{ valid: false, reasons: ["No person detected"] }` if it is empty.

Checks, each adding a human-readable string to `reasons` when it fails:

1. **Visible** - all required landmarks (shoulders, elbows, wrists, hips, ankles, nose) have `visibility >= minVisibility`. Reason: "Make sure your whole body is visible".
2. **In frame** - all required landmarks have x and y within `frameMargin` to `1 - frameMargin`. Reason: "Step back so your whole body fits".
3. **Distance** - body height (nose y to average ankle y) is between `bodyHeightMin` and `bodyHeightMax`. Too small: "Move closer". Too large: "Step back".
4. **Facing camera** - shoulder `z` difference is below `facingMaxZDiff`. Reason: "Face the camera straight on".
5. **Arm angle (A shape)** - for each side, the angle at the shoulder between the vector shoulder-to-hip and the vector shoulder-to-wrist is between `armAngleMin` and `armAngleMax`. Reason: "Lower your arms to about 40 degrees from your body" (or "Raise your arms slightly" if too small).
6. **Straight elbows** - angle at each elbow (shoulder-elbow-wrist) is at least `elbowStraightMin`. Reason: "Straighten your arms".
7. **Leg spread** - ankle distance divided by hip width is between `legSpreadMin` and `legSpreadMax`. Reason: "Stand with feet shoulder-width apart".

Write a small `angleBetween(a, b, c)` helper (angle at point `b`, in degrees) and use only x and y for the arm and elbow angles.

## 4. `usePoseValidation.js`
```js
usePoseValidation(videoRef) -> { isValid, reasons, isReady }
```
- On mount, call `getPoseLandmarker()`; set `isReady` once loaded.
- Run a `requestAnimationFrame` loop. Skip frames until the video has data (`readyState >= 2`), and throttle to roughly 15 detections per second.
- Call `landmarker.detectForVideo(video, performance.now())` and pass `result.landmarks[0]` to `validateAPose`.
- **Stability logic (prevents flicker):** only switch to valid after `stableFramesToPass` consecutive valid frames; only switch back to invalid after `failFramesToDrop` consecutive invalid frames.
- Cancel the loop and clean up on unmount.

## 5. `CameraScreen.jsx`
- Open the camera with `getUserMedia({ video: { facingMode: "user" } })` and attach to a `<video>` (`playsInline`, `muted`). Mirror the preview visually.
- Use the hook's `isValid`:
  - Green outline/border around the camera frame when `isValid` is true, red or neutral otherwise.
  - Show the first item in `reasons` as a short hint under the frame while invalid.
  - Show "Loading pose detection..." until `isReady` is true.
- Shutter button: `disabled={!isValid}`.
- **Also** check `isValid` inside the capture handler and return early if false, so a disabled-button bug can never allow a bad shot.
- On capture, draw the current video frame to a canvas and keep the result in memory on the device only.

## Acceptance checklist
- [ ] No network request carries any image or landmark data.
- [ ] Outline turns green only after the pose is held for about half a second.
- [ ] Outline does not flicker when the user is borderline.
- [ ] Shutter is disabled and the handler refuses to capture while red.
- [ ] Hints change sensibly (too close, too far, arms too low, and so on).
- [ ] Camera stream and landmarker are cleaned up when leaving the screen.
- [ ] `validateAPose` can be tested alone with hand-written landmark arrays.

## Out of scope for this task
- Backend changes, Supabase, uploads.
- Drawing the full skeleton overlay (optional later).
- Measurement calculations from the captured photo.
