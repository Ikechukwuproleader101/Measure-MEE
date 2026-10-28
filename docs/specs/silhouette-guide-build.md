# Task: Fixed Silhouette Guide That Turns Green, With the Skeleton Hidden

## Goal
In the existing camera screen, the **dashed body silhouette** becomes the signal the user watches:

- It is a **fixed guide** in the middle of the camera view. The user steps into it and matches the pose.
- It is neutral (white, dashed) when nobody is in view, **red** when a person is in view but the pose is not valid yet, and **green** when the pose is valid.
- MediaPipe keeps doing the pose estimation and validation on every frame, but the **red skeleton lines and dots are no longer shown** (a hidden debug switch brings them back).
- The checker still decides. The silhouette only shows its result.

## Why fixed (design decision, do not change)
A silhouette that follows the person would jitter with MediaPipe's small frame-to-frame changes and would not show the user where to go. A fixed silhouette is steady and tells users the target. It also pulls every user to a similar distance and framing, which helps measurement accuracy.

## Hard rules
- Work only inside `frontend/`. Do not touch `backend/` or the root `services/` folder.
- Do **not** change the validation rules (`validateAPose`, `validateSidePose`, thresholds), the stability logic, the countdown, the shutter lock, the hint pill, the "Screens" button, or the outer frame border. Only change what is listed here.
- Match the app's existing look: dashed outline style, stroke width, fonts, colors. Reuse the camera screen's existing colors for red and green (`COLORS` in `poseConstants.js`).
- Detection still runs on every frame as before. Only the **drawing** of the skeleton is switched off.
- You cannot open a browser here. Verify with unit tests, build, and lint, then hand the visual check to the owner.

## Step 1: Find what exists (report before changing)
The names below may differ from what the agent previously built. Search for them.
1. The camera screen (likely `BodyCamera.jsx`) and the hook that runs MediaPipe and validation (likely `useMediaPipePose` or `usePoseValidation`).
2. The **existing dashed silhouette**: is it an inline SVG, an image file, or CSS? Where is it rendered, how is it sized and positioned, and does it change color today?
3. How the video is displayed: `object-fit`, `object-position`, whether the preview is mirrored with CSS, and the size of the wrapper that holds the video.
4. Where the skeleton is drawn today (canvas and `DrawingUtils`) and where the red/green colors for the skeleton and the outer frame come from.
5. The pose states the hook exposes today (valid, hint, person detected or not). If the hook does not report "a person is in view", add it as a simple boolean (`personVisible`) without changing existing outputs.

**Keep the old silhouette artwork file** (do not delete it) so the owner can compare. Do not use it as the live guide unless Step 3 is satisfied.

## Step 2: One state drives everything
Create a tiny pure function in `poseConstants.js` or a new `guideState.js`:

```js
export function guideState({ personVisible, isValid }) {
  if (isValid) return "valid";
  if (personVisible) return "invalid";
  return "idle";
}
```
Colors: `idle` is white, `invalid` is `COLORS.invalid` (red), `valid` is `COLORS.valid` (green). The outer frame border keeps following the same state it follows today.

## Step 3: The silhouette artwork (must match the checker)
A guide that shows a different pose from the one the checker accepts makes users match the picture and still stay red. So the guide's geometry is defined here, in SVG units (viewBox `0 0 400 600`, figure centered at x = 200). Create `frontend/src/features/capture/poseGuide.js`:

```js
export const GUIDE_VIEWBOX = { w: 400, h: 600 };

// Head: circle. Body: one closed outline path.
export const GUIDE_HEAD = { cx: 200, cy: 92, r: 34 };
export const GUIDE_BODY_PATH =
  "M185 128 L152 140 L138 142 L46 285 L63 296 L149 172 L152 190 L168 250 " +
  "L158 320 L142 425 L141 535 L128 560 L172 560 L169 535 L178 425 L200 335 " +
  "L222 425 L231 535 L228 560 L272 560 L259 535 L258 425 L242 320 L232 250 " +
  "L248 190 L251 172 L337 296 L354 285 L262 142 L248 140 L215 128 Z";

// The joints this pose represents, in the same SVG units.
// Arms are straight and 40 degrees from the torso; feet are about shoulder width apart.
export const GUIDE_KEYPOINTS = {
  nose: [200, 95],
  leftShoulder: [150, 150],  rightShoulder: [250, 150],
  leftElbow: [102.1, 220.2], rightElbow: [297.9, 220.2],
  leftWrist: [54.2, 290.4],  rightWrist: [345.8, 290.4],
  leftHip: [165, 300],       rightHip: [235, 300],
  leftAnkle: [155, 535],     rightAnkle: [245, 535],
};

// Nose-to-ankle distance in SVG units, used for scaling.
export const GUIDE_NOSE_TO_ANKLE = 440; // 535 - 95
export const GUIDE_FIGURE_BOUNDS = { top: 58, bottom: 560, left: 46, right: 354 };
```

Rendering style, to look like the current silhouette:
- Body path and head circle: `fill` is the state color at about 10% opacity (15% when valid), `stroke` is the state color, same stroke width as the current silhouette.
- `idle` and `invalid`: dashed stroke (`stroke-dasharray`, as in the current silhouette). `valid`: solid stroke.
- Animate color changes with a short CSS transition (about 200 ms), only inside `@media (prefers-reduced-motion: no-preference)`.
- Use `vector-effect: non-scaling-stroke` so the stroke width stays the same at any scale.
- `pointer-events: none`, and it sits above the video but **below** the hint pill, buttons, and the outer frame.

If the existing silhouette artwork is a recolorable SVG whose proportions the agent can verify against `GUIDE_KEYPOINTS` (arms about 40 degrees from the torso, feet about shoulder width), the agent may keep it instead. Otherwise use the geometry above and say so in the report.

## Step 4: Place the guide on the visible camera area
Create a pure, testable function `placeGuide` in `poseGuide.js` that returns the SVG transform for the overlay.

Inputs: `videoW`, `videoH` (the video's pixel size), `boxW`, `boxH` (the pixel size of the box that shows the video), and `fit` (`"cover"` or `"contain"`, matching the video's `object-fit`; object-position is centered).

Formulas:
```
cs        = fit === "cover" ? max(boxW/videoW, boxH/videoH) : min(boxW/videoW, boxH/videoH)
fDesired  = 0.733                        // nose-to-ankle as a fraction of VIDEO height
kDesired  = (fDesired / GUIDE_NOSE_TO_ANKLE) * videoH * cs   // box pixels per SVG unit
margin    = 0.03 * min(boxW, boxH)
figureH   = GUIDE_FIGURE_BOUNDS.bottom - GUIDE_FIGURE_BOUNDS.top     // 502
figureW   = GUIDE_FIGURE_BOUNDS.right  - GUIDE_FIGURE_BOUNDS.left    // 308
kMax      = min((boxH - 2*margin) / figureH, (boxW - 2*margin) / figureW)
k         = min(kDesired, kMax)
fActual   = k * GUIDE_NOSE_TO_ANKLE / (videoH * cs)        // what the guide really represents
```
Position: center the figure vertically and horizontally in the box. The figure's center is at SVG (200, 309).
```
tx = boxW/2 - 200*k
ty = boxH/2 - 309*k
transform = translate(tx, ty) scale(k)
```
Return `{ k, tx, ty, fActual, warning }`. Set `warning` when `fActual < 0.60` (the checker's minimum body size is 0.55, so a guide below 0.60 leaves too little room).

Notes:
- The video may be cropped by `cover`. The box is what the user sees, so the guide must fit inside the **box**, which the formulas do.
- Recompute on window resize, rotation, and when the video's real size is known (`loadedmetadata`). Use a `ResizeObserver` on the box.
- If the preview is mirrored by CSS, mirror the overlay the same way. The shape is symmetric, so this only matters for alignment of the box.
- Do not hardcode pixel sizes.

## Step 5: Hide the skeleton, keep the detection
1. In the hook, add an option `showSkeleton` (default `false`). When false, **skip all drawing** (canvas clear, `drawConnectors`, `drawLandmarks`). Detection, validation, stability counters, hints, and the countdown logic stay exactly as they are.
2. Debug switch: `showSkeleton` is true only when the page address contains `debug=pose` (check both the search string and the part after `#`). When on, draw the skeleton in the state colors as before.
3. The red/green coloring of the **outer frame** and the hint pill stays as it is.

## Step 6: Wire it into the camera screen
1. Render the guide overlay inside the same wrapper as the video, sized to that wrapper (`position: absolute; inset: 0; width: 100%; height: 100%`), using `placeGuide` for the transform.
2. Feed it `guideState({ personVisible, isValid })`.
3. Replace the old silhouette element with this overlay. Remove nothing else.
4. For the side photo step, use the same overlay mechanism but **do not** show the A-pose figure. Show no guide for the side view for now (or the existing side illustration if one exists). Report which you did. A side-view guide is a later task.

## Step 7: Unit tests (no browser needed)
Use the existing test runner. If none is installed, try `npm install -D vitest` inside `frontend/`; otherwise use Node's built-in runner and say so.

1. **`guideState`:** idle, invalid, and valid for each input combination.
2. **`placeGuide`:**
   - For a 720x1280 video in a 720x1280 box with `cover`, `fActual` is 0.733 and the figure is centered.
   - For a tall narrow box (for example 390x844) with a 720x1280 video and `cover`, the whole figure (`left`, `right`, `top`, `bottom` bounds mapped by the transform) lies inside the box with at least a 3% margin, and `fActual >= 0.60` (or `warning` is set).
   - For a box much wider than the video with `contain`, the figure still fits inside the video area.
3. **The guide must pass the checker.** Map `GUIDE_KEYPOINTS` into a 33-point landmark array for a 720x1280 video at `fDesired = 0.733`, centered:
   - `u = 0.5 + (x - 200) * s * videoH / videoW`, with `s = 0.733 / 440`.
   - `v = 0.5 + (y - 309) * s`.
   - Every other landmark can be `{ x: 0.5, y: 0.5, z: 0, visibility: 0.99 }`; set the 11 listed ones with `z: 0` and `visibility: 0.99`.
   - Run `validateAPose(landmarks, { width: 720, height: 1280 })`. It must return `valid: true` with no reasons. If it does not, report which check failed and **do not change thresholds silently**; explain what is inconsistent so the owner can decide.
4. **Skeleton hidden:** with `showSkeleton` false, a drawing function is never called (test the drawing decision in a small pure helper, or with a mock).
5. **Debug flag parsing:** `debug=pose` in the search string or in the hash enables it; anything else does not.

Then run the tests, `npm run build`, and lint if configured.

## Step 8: Human visual check (for the owner, not for you)
After the changes are pushed, Vercel redeploys. Then on the phone:
1. Open the app in Chrome or Safari (not inside another app) and hard refresh, or open a private tab so nothing old is cached.
2. Open the camera screen. You should see the dashed white silhouette centered, with **no red skeleton**.
3. Stand back so your whole body is in the silhouette. It turns **red** while the pose is wrong and the hint text tells you what to fix.
4. Match the pose (arms out about 40 degrees, feet shoulder-width apart). The silhouette and outer frame turn **green**, the countdown starts, and the photo is taken.
5. Check the silhouette is not cut off at the screen edges and your whole body fits inside it at a normal distance (about 2 to 3 meters).
6. To see the skeleton again for testing, add `?debug=pose` to the address (before the `#`) and reload.

If the user fits the silhouette but stays red with a hint, report which hint appears and how far the person is from the guide. That tells us which threshold to tune.

## Out of scope
- A silhouette for the side photo.
- A following or moving silhouette.
- Any change to validation rules or thresholds.
- Any backend or database change.

## Report format
```
Existing pieces found:   (camera screen, hook, old silhouette type/location, video fit, mirroring)
Old silhouette:          kept as file (path) / replaced; used builtin geometry? yes/no
Files created:           (list)
Files changed:           (list, one line each)
Side photo guide:        (what was done)
placeGuide results:      (fActual for the test box sizes; any warnings)
Guide passes validateAPose: yes / no (details if no)
Tests:                   pass / fail (counts, runner used)
Build:                   pass / fail
Lint:                    pass / fail / not configured
Needs human check:       yes (Step 8)
Anything unclear:        (questions for the owner)
```
