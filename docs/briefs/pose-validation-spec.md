# Test Task: Verify the MediaPipe Pose Landmarker Loads

## Goal
Confirm that `frontend/src/services/poseLandmarker.js` loads MediaPipe correctly in the browser. This is a **test only**. Do not build the camera screen, the validation logic, or anything in `backend/` or the root `services/` folder.

## Rules
- Work only inside `frontend/`.
- Do not change `poseLandmarker.js` unless a test fails and the fix is clearly inside that file. If you change it, explain exactly what you changed and why.
- Any temporary test code must be removed at the end (see Cleanup).
- Report results at the end using the format below.

## Step 1: Check the files exist
Verify each of these and report yes/no for each:

1. `frontend/src/services/poseLandmarker.js` exists and exports `getPoseLandmarker` and `closePoseLandmarker`.
2. `frontend/public/models/pose_landmarker_lite.task` exists and is larger than 1 MB (an empty or tiny file means a failed download).
3. `frontend/public/mediapipe/wasm/` exists and contains files such as `vision_wasm_internal.js` and `vision_wasm_internal.wasm`.
4. `@mediapipe/tasks-vision` is listed in `frontend/package.json` dependencies.

If any are missing, stop and report what is missing. Do not try to guess or download replacements.

## Step 2: Start the frontend
1. Read `frontend/package.json` to find the dev command (usually `npm run dev`).
2. Run it from inside `frontend/` and note the local URL and port.

## Step 3: Check the assets are served
Using the browser, open these URLs on the local dev server and report the result of each. Each should download or display content, **not** a 404 or the app's home page:

- `/models/pose_landmarker_lite.task`
- `/mediapipe/wasm/vision_wasm_internal.js`
- `/mediapipe/wasm/vision_wasm_internal.wasm`

## Step 4: Run the landmarker test
1. Add this **temporary** snippet to the top level of the app's entry component (for example `App.jsx`), clearly marked with the comment `// TEMP TEST - REMOVE`:

```js
// TEMP TEST - REMOVE
import { getPoseLandmarker } from "./services/poseLandmarker";
getPoseLandmarker()
  .then(() => console.log("landmarker ready"))
  .catch((err) => console.error("landmarker failed", err));
```

2. Open the app in the browser and read the **browser console**.
3. Expected result: the message `landmarker ready` and no red errors.
4. Reload the page once and confirm it still works.

## Step 5: Interpret failures
If the console shows an error, match it to the likely cause and report it:

| Symptom | Likely cause |
|---|---|
| 404 for the `.task` file | Model is not in `frontend/public/models/` or has the wrong name |
| 404 for files under `/mediapipe/wasm` | wasm folder was not copied into `frontend/public/mediapipe/wasm/` |
| Error mentioning WebAssembly or MIME type | wasm files are being served incorrectly, or the path is wrong |
| Error mentioning WebGL or GPU | GPU not available (the code should fall back to CPU; report if it does not) |
| `Failed to resolve import "@mediapipe/tasks-vision"` | Package not installed in `frontend/` |

## Cleanup (always do this)
1. Remove the `// TEMP TEST - REMOVE` snippet from the entry component.
2. Stop the dev server if you started it.
3. Confirm no other files were changed except any fix you explained.

## Report format
Reply with:

```
Files check:      pass / fail (list any missing)
Assets served:    pass / fail (list any 404s)
Landmarker ready: pass / fail
Console errors:   (paste exact text, or "none")
Changes made:     (list, or "none")
Temp code removed: yes / no
```
