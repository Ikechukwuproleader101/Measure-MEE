# Task: Per-Body-Part Pose Feedback (Replaces the Fixed Silhouette)

## Goal
The person stands 2 to 3 meters from the phone. The app checks **each body part on its own**, against a **pass range**, using the person's **own proportions** (so tall, short, broad, and slim people are judged fairly). Parts that are right are drawn as a thick solid **green** line; parts that are wrong are drawn as a thin dashed **red** line; parts the camera cannot see are grey. When everything is right, it holds for a moment and then shows as fully green.

Also in this task:
- The fixed dashed body frame (silhouette) is **removed** from the camera view.
- **Phone tilt sensing** (every kind of tilt error) gates the pose check.
- **Sound cues** for moving closer or further, and a chime on green.
- Normal-size on-screen text for what to fix (the existing hint pill).
- The capture button is always available. Pressing it starts the existing 3-second countdown.
- After 3 failed countdowns, a **"Capture anyway"** option appears; that photo is marked **not verified**.
- A debug and **test-log mode** for trying the app with real people.

Where this file conflicts with `silhouette-guide-build.md` or `fit-to-silhouette-build.md`, **this file wins**.

## Hard rules
- Work only inside `frontend/`. Do not touch `backend/` or the root `services/` folder.
- **Do not scrap the MediaPipe engine.** Keep what is listed under "Keep" in Step 1. Only retire what is listed under "Retire", and only after the new code builds and its tests pass.
- Do not change: the hint pill's look, the "Screens" button, the outer frame border colors, the photo hub layout, the analysing screen, login, or the backend.
- Do not silently change numbers in `poseRules.js`. If a test shows a rule behaves wrongly, report it.
- Photos and landmarks never leave the device.
- You cannot open a browser here. Verify with unit tests, build, and lint, then hand the visual check to the owner.

## Step 1: Inventory first (report before changing anything)
Several earlier specs may or may not have been run, so find out what actually exists. List every pose-related file and classify it:

**Keep (do not delete):**
- `services/poseLandmarker.js` (live landmarker and capture-time landmarker) and the model and wasm assets in `public/`.
- The camera stream handling, the detection loop and its rate limiting, and the canvas overlay.
- `captureFrame` / `analyzeCanvas`, `processUploadedImage`, the mask extraction, the capture session store, the photo hub, and the analysing screen.
- `validateAPose.js` and `validateSidePose.js` (the upload path and the side photo still use them). Add a comment `// still used by uploads / side photo` if not present.
- The hint pill, the countdown, the shutter row, the outer frame border.

**Reuse (move or adapt):**
- `createHoldTracker`, `shouldCaptureAtZero`, and `smoothJoints` helpers if they exist.
- The `?debug=pose` flag parsing.
- Angle helpers (`angleAt`) from `validateAPose.js` (import them instead of copying).

**Retire (after the swap works):**
- The fixed silhouette overlay element and the code that renders it.
- `poseGuide.js`, `placeGuide`, the `GUIDE` / joint-target definitions, `fitToGuide.js`, and their tests (if they exist).
- The old whole-skeleton drawing in the normal (non-debug) view.
- Any automatic countdown start when the frame turns green. Keep a constant `AUTO_START_WHEN_GREEN = false`.

**Leave in place, unused:** the owner's original silhouette artwork file (do not delete image or SVG assets).

Report the classification before making changes. If a file is in none of these groups, ask in the report instead of deleting it.

## Step 2: The rules file (`poseRules.js`)
One object holds every number, so it is easy to tune.

```js
export const RULES = {
  tilt: {
    pitch: { min: -6, max: 6, buffer: 3 },   // degrees from upright (0 = upright)
    roll:  { min: -5, max: 5, buffer: 3 },   // degrees sideways (0 = level)
    veryTiltedPitch: 40,                     // beyond this: "stand your phone upright"
    shakeDegPerSec: 20,                      // tilt change per second above this = shaking
    noDataMs: 1500,                          // no tilt readings after this = sensor unavailable
  },
  body: {
    minVisibility: 0.4,
    frameMargin: 0.02,
    heightFracMin: 0.55,        // nose to ankle as a fraction of video height
    heightFracMax: 0.92,
    centerOffsetMax: 0.12,      // hips center must be within 12% of screen center
  },
  arm: {
    angle: { min: 30, max: 50, buffer: 5 },    // degrees between the torso line and the arm (ideal about 40)
    elbow: { min: 150, max: 180, buffer: 5 },  // degrees at the elbow (180 = straight)
  },
  leg: {
    knee: { min: 160, max: 180, buffer: 5 },
    spread: { min: 0.6, max: 1.7, buffer: 0.08 }, // ankle distance divided by shoulder width
  },
  shoulders: { tilt: { min: -6, max: 6, buffer: 3 } },  // degrees from horizontal
  torso: { lean: { min: -8, max: 8, buffer: 3 } },      // degrees from vertical
  smoothingAlpha: 0.5,
  hold: { passMs: 300, failMs: 250 },
  capture: { countdownSeconds: 3, rangeScale: 1.25, graceMs: 500, failsBeforeAnyway: 3 },
  cues: { minGapMs: 3000, repeatMs: 5000 },
  TARGET_ARM_ANGLE: 40,
  SHOW_TARGET_HINTS: true,      // faint dashed arm and foot targets; set false to remove
};
```
Ranges sit on **both sides** of the ideal number (people raise their arms too high as often as too low). The `buffer` stops flicker: a value becomes OK only when it is inside `min..max`, and once OK it stays OK until it leaves `min - buffer .. max + buffer`.

Add a pure helper:
```js
rangeCheck(value, range, wasOk, scale = 1) -> boolean
```
`scale` widens the range around its center (`scale = 1.25` makes the half-width 25% larger) and is used for the final check at capture time.

## Step 3: Body metrics (`bodyMetrics.js`, pure functions)
Work in **pixels** to avoid aspect-ratio errors: `x = u * videoW`, `y = v * videoH` for every normalized landmark. Landmark indexes: nose 0; shoulders 11 (left) and 12 (right); elbows 13, 14; wrists 15, 16; hips 23, 24; knees 25, 26; ankles 27, 28. "Left" means the **person's own left** (as MediaPipe labels it).

Definitions:
- `shoulderMid`, `hipMid` are the midpoints. `torsoVec = hipMid - shoulderMid`, `torsoDir` is its unit vector, `shoulderWidth = |leftShoulder - rightShoulder|`.
- **Torso lean:** `atan2(torsoDir.x, torsoDir.y)` in degrees (0 = straight up and down).
- **Shoulder tilt:** take the two shoulders, call the one with the smaller x `A` and the other `B`; tilt is `atan2(B.y - A.y, B.x - A.x)` in degrees.
- **Arm angle (each side):** the angle between `torsoDir` and `(wrist - shoulder)`, 0 to 180 degrees.
- **Arm outward:** `|wrist.x - hipMid.x| >= |shoulder.x - hipMid.x|`. If false, the arm is crossing inward and fails.
- **Elbow angle:** the angle at the elbow between `(shoulder - elbow)` and `(wrist - elbow)`.
- **Knee angle:** the angle at the knee between `(hip - knee)` and `(ankle - knee)`.
- **Spread:** distance between the two ankles divided by `shoulderWidth`.
- **Height fraction:** `meanAnkleV - noseV` (normalized video height).
- **Center offset:** `hipMidU` (using the displayed U, which is `1 - u` when the preview is mirrored) minus 0.5.

All of these use only the person's own proportions, so the results do not depend on how tall or wide they are.

## Step 4: The evaluator (`evaluatePose.js`, pure function)
```js
evaluatePose({ landmarks, videoW, videoH, mirrored, prev, rangeScale = 1 })
  -> { personVisible, wholeBody: { ok, hint, cue }, parts, metrics, pass, hint, nextPrev }
```
Steps:
1. If no landmarks: `personVisible: false`, hint "Step into the camera view".
2. **Smoothing** is done in the hook (exponential, `smoothingAlpha`) before this function, so it stays pure.
3. **Whole-body checks**, in this order. The first failure sets `wholeBody.hint`, and `wholeBody.ok` is false:
   - A required joint (nose, shoulders, hips, ankles) is below `minVisibility` or outside the frame margin: "Make sure your whole body is visible".
   - Height fraction below `heightFracMin`: "Move closer" (cue: `closer`). Above `heightFracMax`: "Step back" (cue: `further`).
   - Center offset beyond `centerOffsetMax`: if the person is right of center on screen, "Move a little to the left"; if left of center, "Move a little to the right". (Directions are as the user sees the screen.)
4. **Parts.** Each part has a `state`: `ok`, `bad`, or `unseen`.
   - `leftArm`, `rightArm`: joints shoulder, elbow, wrist. Bad if the arm angle is outside its range, the arm is not outward, or the elbow angle is outside its range.
   - `leftLeg`, `rightLeg`: joints hip, knee, ankle. Bad if the knee angle is outside its range or the spread is outside its range (a bad spread marks **both** legs bad).
   - `shoulders`: bad if the tilt is outside its range.
   - `torso`: bad if the lean is outside its range.
   - A part is `unseen` if any of its joints is below `minVisibility`.
   - Each check uses `rangeCheck` with `prev` for hysteresis and `rangeScale`. Return `nextPrev` for the next frame.
5. **When `wholeBody.ok` is false**, parts are returned with state `neutral` (not red). Telling a person that every limb is wrong, when the real problem is distance, only confuses them.
6. **Hint for parts** (first match, in this order: left arm, right arm, left leg, right leg, shoulders, torso; unseen parts come before bad parts):
   - Unseen: "I can't see your left arm" (or right arm, or "feet" for the legs).
   - Arm angle too small, or arm inward: "Move your left arm away from your body".
   - Arm angle too large: "Lower your left arm a little".
   - Elbow outside its range: "Straighten your left arm".
   - Knee outside its range: "Straighten your left leg".
   - Spread below the range: "Open your feet a little". Above: "Bring your feet closer".
   - Shoulders: "Level your shoulders". Torso: "Stand up straight".
7. `pass` is true when `wholeBody.ok` and all six parts are `ok`.

## Step 5: Tilt sensing (`tilt.js` and `useDeviceTilt.js`)
Pure function `evaluateTilt({ beta, gamma, orientationType, shakeRate, hasData }) -> { ok, state, hint }`. Convention: with the phone upright in portrait, `beta` is about 90 and `gamma` about 0. `pitch = beta - 90`, `roll = gamma`.

States and messages (check in this order; the first problem wins):
1. No data after `noDataMs` (laptop, permission refused, or no sensor): `state: "unavailable"`, `ok: true` (it **never blocks**). Show the tip "Keep your phone upright" once.
2. Held sideways (landscape): "Turn your phone upright."
3. Upside down (`beta` between -130 and -50): "Your phone is upside down."
4. `|pitch| > veryTiltedPitch` (flat or nearly flat): "Stand your phone upright."
5. Pitch outside its range: below the range, "Your phone is leaning back. Stand it upright."; above, "Your phone is leaning forward. Stand it upright."
6. Roll outside its range: "Your phone is tilted to the side. Straighten it."
7. Shaking (`shakeRate > shakeDegPerSec`, measured over about 500 ms): "Hold the phone steady, or prop it up."
Pitch and roll use `rangeCheck` with the same hysteresis idea.

`useDeviceTilt({ enabled })` listens to `deviceorientation` and exposes the evaluated result. iPhones need permission, requested with `DeviceOrientationEvent.requestPermission()` from a **user tap**. Export `requestTiltPermission()` and call it from the tap handlers that lead to the camera: the "I'm ready" button and the hub's "Take photo" and "Retake" buttons (skip if already granted or not needed). Android and desktop need no prompt.

**Tilt gates the pose check.** While tilt is not OK, pose evaluation still runs, but its result is not used: limbs are drawn neutral, the hint is the tilt message, and green cannot show. The tilt result also counts toward `isValid`.

## Step 6: Drawing the limbs (`limbRenderer.js`)
Draw on the existing canvas overlay (sized to the video frame, same CSS object-fit and mirroring as the video). Scale line widths by `videoH / 720`.

Style by state (a pure function `partStyle(state)`):
- `ok`: green (`COLORS.valid`), **solid**, width 6.
- `bad`: red (`COLORS.invalid`), **dashed** (10 on, 8 off), width 3.
- `unseen`: grey, **dotted** (round caps, 2 on, 8 off), width 3.
- `neutral` (whole-body or tilt problem): white at 50% opacity, solid, width 2.

Color is never the only signal: the line width and style differ too, for color-blind users.

Parts drawn: left arm (shoulder to elbow to wrist), right arm, left leg (hip to knee to ankle), right leg, shoulders (line between the shoulders), torso (both shoulder-to-hip sides and the hip line). Small dots at joints in the same style. Draw nothing when no person is detected.

**Target hints** (only when `SHOW_TARGET_HINTS`, whole-body and tilt are OK, and only for parts that are `bad`): faint dashed white lines (40% opacity).
- **Arm target:** from the shoulder, in the direction of `torsoDir` rotated **outward** by `TARGET_ARM_ANGLE` degrees (outward is away from `hipMid.x`), with the length of that person's own arm (shoulder-to-elbow plus elbow-to-wrist, measured).
- **Foot target:** small dashed circle for each ankle at `hipMid.x ± shoulderWidth / 2`, at the person's current ankle height.
The targets are built from the person's own proportions, never a fixed shape.

If the preview is mirrored by CSS, the canvas gets the same mirroring. Hints use the person's own left and right and need no change.

## Step 7: Sound (`cues.js`)
- `unlockAudio()` is called on the same user taps as `requestTiltPermission()`. It creates the Web Audio context and primes speech.
- `cue("closer" | "further")` speaks "Move closer" or "Step back" using the browser's speech (`speechSynthesis`, English, normal rate; cancel any earlier speech first). If speech is not available, play short tones instead (closer: two quick rising beeps; further: two quick falling beeps) using Web Audio.
- `chime()` plays a short two-note rising chime when the state changes to valid.
- **Policy:** a cue plays when it **starts**, at most once every `minGapMs`, and repeats only after `repeatMs` if the same problem persists. No cue plays when the problem clears. The chime plays once per transition to valid. No cues during the countdown. Write this as a pure function so it can be tested: `cueDecision({ cue, lastCue, lastPlayedAtMs, nowMs }) -> boolean`.
- A small **mute button** on the camera screen (use the app's existing icon style). Remember the choice in `localStorage`, wrapped in try/catch.
- Map the existing side-photo hints too: a pure `cueFromHint(hint)` returns `closer` when the text includes "closer" and `further` when it includes "step back".
- Text is always the main signal. On iPhones the silent switch can mute web audio, so do not rely on sound.

## Step 8: Update the hook and the camera screen
Keep the existing hook's name and outputs, and extend it. It still runs detection on every frame, as before.
1. Per frame: smooth the joints, run `evaluateTilt` (from `useDeviceTilt`), run `evaluatePose` for the front step, combine into `isValid` using `createHoldTracker({ passMs: 300, failMs: 250 })`, and expose `{ isValid, personVisible, hint, parts, tilt, isReady, error }` plus `lastValidAtMs`.
2. Hint priority: tilt, then whole-body, then parts. Show **one** clue at a time in the existing hint pill. When valid, show the existing pass text ("Perfect, hold still").
3. Remove the silhouette overlay element from the camera screen. The outer frame border stays and keeps following the valid / invalid / idle state.
4. **Capture button:** always enabled once the camera is ready. Pressing it starts the 3-second countdown; pressing it again during the countdown cancels it.
5. At 0: `shouldCaptureAtZero(...)` (true if valid now, or valid within `graceMs`). If true, capture. If false, show "Not quite. Check the red parts and try again." and increase the failure counter.
6. **Capture anyway:** after `failsBeforeAnyway` (3) failed countdowns in a row, show a secondary button "Capture anyway". It captures without requiring a pass and sets `verified: false` on the result. The failure counter resets on a pass, when the view changes, and when the screen is left.
7. Add `verified: boolean` to `CaptureResult` (true for passed captures, false for "capture anyway"; uploads keep their existing behavior and are `verified: true` only if their pose check passed). On the photo hub, a photo with `verified: false` shows an amber chip "Not verified". Analysis is still allowed; do not block it.
8. **Capture-time re-check:** the camera path's validator runs `evaluatePose` on the capture-time landmarks with `rangeScale = capture.rangeScale`. If it fails (and this was not "capture anyway"), return the usual `{ error }` with the hint.
9. **Side photo:** keep the existing side checker (`validateSidePose`) and add the tilt gating and the closer/further sound cues. The per-limb colored feedback applies to the front photo only for now.
10. The upload path is unchanged.

## Step 9: Debug and test-log mode (`?debug=pose`)
Debug appears only with the flag (search string or after `#`). When on:
1. Draw the **full skeleton** (as before) under the limb lines.
2. Show a readout: tilt (pitch, roll, shake rate, state), whole-body checks (height fraction, center offset), and for each part its measured values (arm angle, elbow angle, knee angles, spread, shoulder tilt, torso lean) with the range and an OK flag.
3. **Attempt log.** Every time a countdown ends (pass, fail, or capture anyway), add a row: timestamp, view, `passed`, `usedGrace`, `captureAnyway`, seconds from pressing the button to the first green (or empty), the failing parts, and the measured values. Add a **Copy log** button (use `navigator.clipboard`) that copies the rows as JSON, and a **Clear log** button. Keep the log in memory only.

## Step 10: Unit tests (no browser needed)
Use the existing test runner. If none is installed, try `npm install -D vitest` inside `frontend/`; otherwise Node's built-in runner, and say so. Build test poses from simple numbers (video 720x1280 unless stated).

1. **`rangeCheck`:** enters only inside `min..max`; stays OK within the buffer; leaves outside the buffer; `scale = 1.25` widens correctly.
2. **Arm angle:** arms at 40 degrees pass; arms down (about 5 degrees) fail with "away from your body"; arms at 70 degrees fail with "Lower your...".
3. **Arm outward:** an arm crossing inward fails.
4. **Elbow, knee, spread, shoulder tilt, torso lean:** each failing case returns the right hint with the right side (left or right).
5. **Size independence:** the same pose scaled by 0.7 and 1.4, and a pose with long legs and a short torso, give the same pass result.
6. **Aspect ratio:** the same real pose in a 720x1280 frame and a 1280x720 frame gives the same arm angles.
7. **Unseen part:** a low-visibility wrist makes that arm `unseen`, the hint is "I can't see your left arm", and `pass` is false.
8. **Precedence:** tilt problem beats whole-body, which beats parts; when whole-body is not OK, parts are `neutral`, not `bad`.
9. **Mirroring:** the drawn positions flip with `mirrored`, while the hint text stays on the person's own left and right.
10. **`evaluateTilt`:** upright is OK; pitch forward and back, roll, landscape, upside down, nearly flat, shaking, and no data each give the right message; no data never blocks.
11. **Hold tracker:** valid only after 300 ms of continuous pass; a single bad frame does not drop it; 250 ms of continuous fail does.
12. **Cue policy:** a cue plays at its start; the same cue does not repeat within 3 seconds; it repeats after 5 seconds if it persists; the chime plays once per transition to valid; `cueFromHint` maps hint text correctly.
13. **Capture logic:** `shouldCaptureAtZero`; three consecutive failures offer "Capture anyway"; a pass resets the counter; a "capture anyway" result has `verified: false`.
14. **Target hints geometry:** the arm target is `TARGET_ARM_ANGLE` degrees from the torso direction, outward, with the arm's measured length; foot targets sit at `hipMid.x ± shoulderWidth / 2`.
15. **`partStyle`:** returns solid thick green, dashed thin red, dotted grey, and neutral white for each state.
16. **Debug:** the flag parser and the attempt-log row builder.

Then run the tests, `npm run build`, and lint if configured. Confirm nothing still imports a retired file before deleting it.

## Step 11: Human check (for the owner, not for you)
After this is pushed and Vercel redeploys, on a phone in Chrome or Safari (hard refresh, or a private tab):
1. Open the camera screen. The dashed body frame is gone. Lean the phone back, forward, and sideways, hold it flat, turn it sideways, and shake it. Each gives its own message, and the message goes away when you fix it. On an iPhone, allow motion access when asked.
2. Prop the phone upright and stand 2 to 3 meters away. Step too close and too far: you should hear "Move closer" and "Step back", and the text matches.
3. Stand with arms out about 40 degrees and feet about shoulder width apart. Wrong parts show thin dashed red lines, right parts show thick solid green lines. Fix them one by one until everything turns green and the chime plays.
4. Press the capture button. The 3-second timer runs, and the photo is taken only if it is still green. Move out of the pose on purpose three times in a row: "Capture anyway" should appear, and that photo shows the amber "Not verified" chip on the photo hub.
5. Cover one arm with a wide sleeve or a jacket. A part that cannot be seen should be grey, with "I can't see your ... arm".

**Testing with real people (before the numbers are locked):** have 6 to 8 people try it, mixing height, build, and clothing (fitted clothes, a dress, a kaftan or agbada). Each person makes 3 attempts at 2 to 3 meters, and some also pose wrongly on purpose (arms down, feet together). Use `?debug=pose` and press **Copy log** after each person. If correct poses keep failing on the same part, that part's range is too tight. If obviously wrong poses pass, it is too loose. A good target is that most correct poses turn green within about 5 seconds and arms-down never does. Paste the logs back so the ranges can be tuned.

## Out of scope
- Per-limb colored feedback for the side photo.
- Any backend, database, or measurement calculation.
- Changes to the upload path, the photo hub layout, or the analysing screen (except the amber "Not verified" chip).

## Report format
```
Inventory:               (keep / reuse / retire lists, with file names)
Files created:           (list)
Files changed:           (list, one line each)
Files deleted:           (list; confirm nothing imported them)
Silhouette overlay:      removed? yes/no; original artwork file left in place? yes/no
Auto-countdown on green: removed? yes/no
Tests:                   pass / fail (counts, runner used)
Build:                   pass / fail
Lint:                    pass / fail / not configured
Needs human check:       yes (Step 11)
Anything unclear:        (questions for the owner)
```
