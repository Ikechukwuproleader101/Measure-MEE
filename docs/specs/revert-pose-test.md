# Task: Remove the Temporary Pose Test and Restore the App UI

## Goal
The app currently shows a temporary MediaPipe test panel on top of the real UI. Remove it so the app looks and behaves exactly as it did before the test, while keeping the real MediaPipe setup that is needed for the camera screen.

## Hard rules
- Work only inside `frontend/`. Do not touch `backend/` or the root `services/` folder.
- Remove **only** code that is marked `// TEMP TEST - REMOVE`, plus the `PoseTest.jsx` file and anything that imports it.
- Do **not** use destructive git commands: no `git checkout -- <file>`, `git reset --hard`, `git clean`, or `git stash drop`. The files may contain real work that is not part of the test, and those commands would erase it.
- Do **not** commit anything.
- You cannot open a browser here. Rely on search, build, and lint checks.

## Step 1: Find everything temporary
1. Search all of `frontend/src` for the text `TEMP TEST - REMOVE` and list every file and line.
2. Search for `PoseTest` (imports, JSX usage, routes) and list every match.
3. If `git` is available, run `git status` and `git diff --stat` (read only) and list which files changed.

## Step 2: Remove only the test code
1. Delete the marked snippet(s) and any `import PoseTest ...` line and `<PoseTest />` usage.
2. If a marked snippet was added inside a larger block, remove just the marked lines. Do not reformat or rewrite the surrounding code.
3. Delete `frontend/src/features/capture/PoseTest.jsx`.
4. If a route, menu item, or button was added only to reach the test screen, remove it. If you are unsure whether something was added for the test, leave it and list it in the report.

## Step 3: Keep these (do not delete)
- `frontend/src/services/poseLandmarker.js` (including any bug fix made to it)
- `frontend/public/models/pose_landmarker_lite.task`
- `frontend/public/mediapipe/wasm/`
- The `@mediapipe/tasks-vision` dependency in `frontend/package.json`
- Any other files from the pose validation work (for example `validateAPose.js`, `poseConstants.js`, `usePoseValidation.js`) if they exist

## Step 4: Verify the UI is back to normal
1. Search again for `TEMP TEST - REMOVE` and `PoseTest`. Both must return **no results**.
2. Confirm the app's entry component (for example `App.jsx`) renders only what it rendered before the test. If `git diff` is available, the diff for that file should now be empty or contain only changes that are unrelated to the test.
3. Run `npm run build` inside `frontend/` and report pass or fail.
4. Run lint if configured, and report any errors in the files you touched.
5. Start the dev server, check its output for compile errors, then stop it.

## Step 5: Leftovers to double-check
- No leftover `getUserMedia` calls outside the real camera screen.
- No leftover console logs from the test, such as `first detection result` or `landmarker ready`.
- No unused imports in files you edited.

## Report format
```
Marked snippets found:     (file and line list)
PoseTest references found: (file and line list)
Removed:                   (list)
Deleted files:             PoseTest.jsx (yes/no)
Kept as required:          (confirm the Step 3 items still exist)
Search for leftovers:      none / (list)
Build:                     pass / fail
Lint:                      pass / fail / not configured
Unsure items left alone:   (list, or "none")
```

## After this task (for the project owner)
The next job is making the real camera screen use MediaPipe and the green outline. Do not start that here. It will be a separate task.
