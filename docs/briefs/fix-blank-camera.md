# Task: Fix the Camera Staying Blank on First Open

## Problem
When the camera screen (`BodyCamera.jsx`) opens, the live video is **blank**. It only appears after the owner presses the **switch camera** button, and sometimes the button has to be pressed twice. Switching the camera runs the start-up code a second time, and the second run works, so the first start-up is going wrong.

## Likely causes (all three are addressed here)
1. **Hidden failures.** `videoRef.current.play().catch(() => {})` swallows every error, so a refused or interrupted `play()` leaves the video blank with no message.
2. **The old camera is not released yet.** The code stops one stream and immediately opens another. On phones the new stream can come up blank or fail. The switch button works as a manual retry.
3. **MediaPipe starts at the same moment as the camera.** `useMediaPipePose` begins loading its model while the camera is still starting. That contention can leave the first stream blank. By the time the switch button is pressed, MediaPipe has already loaded.

## Hard rules
- Work only inside `frontend/`. Do not touch `backend/` or the root `services/` folder.
- **Do not redesign the camera screen.** Keep its layout, classes, the shutter, the countdown, the review (retake / accept) flow, the upload logic, and the pose feedback exactly as they are. Change only the camera start-up logic and what depends on it.
- Do not change the default camera (`facingMode` starts as `'environment'`). Report it instead (see Step 6).
- If the file differs from the version described here (for example because later specs were applied), **adapt the changes to the current code instead of overwriting the file**. The goal is the behavior below, not a literal paste.
- You cannot open a browser here. Verify with unit tests, build, and lint, then hand the visual check to the owner.

## Step 1: Find and report
1. The camera screen (likely `BodyCamera.jsx`) and the hook that runs MediaPipe (likely `hooks/useMediaPipePose`).
2. The effect that calls `getUserMedia`, and everything it depends on (`facingMode`, `holdingState.isHolding`).
3. How `useMediaPipePose` uses its `enabled` option: does it start its model loading and detection loop as soon as `enabled` is true? Does it stop and clean up when `enabled` turns false, and restart correctly when it turns true again? Does it guard against a video element that has no frames yet (`readyState < 2`)?
4. Any other place that starts or stops the camera.

## Step 2: Extract the camera helpers (`cameraStream.js`)
Create `frontend/src/features/capture/cameraStream.js` (or next to `BodyCamera.jsx` if that folder structure differs). Keep these functions free of React so they can be tested without a browser.

```js
// Constraint attempts from most to least demanding.
export function buildConstraintAttempts(facingMode) {
  return [
    { video: { facingMode: { ideal: facingMode }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false },
    { video: { facingMode: { ideal: facingMode } }, audio: false },
    { video: true, audio: false },
  ];
}

// Permission problems are final; everything else is worth retrying.
export function isPermissionError(err) {
  return !!err && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
}

// Tries each constraint set (two tries each) and returns the first stream that works.
export async function getStreamWithFallback({
  facingMode,
  getUserMedia = (c) => navigator.mediaDevices.getUserMedia(c),
  sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
  retriesPerAttempt = 2,
  retryDelayMs = 300,
}) {
  let lastErr;
  for (const constraints of buildConstraintAttempts(facingMode)) {
    for (let retry = 0; retry < retriesPerAttempt; retry++) {
      try {
        return await getUserMedia(constraints);
      } catch (err) {
        lastErr = err;
        if (isPermissionError(err)) throw err;
        await sleep(retryDelayMs);
      }
    }
  }
  throw lastErr;
}

// Decides whether a camera that produced no picture should be restarted automatically.
export function shouldAutoRetry({ videoWidth, readyState, retries, maxRetries = 2 }) {
  const noPicture = videoWidth === 0 || readyState < 2;
  return noPicture && retries < maxRetries;
}
```

## Step 3: Replace the camera start-up effect in `BodyCamera.jsx`
Add near the other state and refs:
```jsx
const [isCameraPlaying, setIsCameraPlaying] = useState(false);
const [restartKey, setRestartKey] = useState(0);
const startIdRef = useRef(0);
const autoRetriesRef = useRef(0);
```
Import `getStreamWithFallback` and `shouldAutoRetry` from `cameraStream.js`.

Replace the whole `// 1. Initialize High-Resolution getUserMedia Stream` effect with:

```jsx
useEffect(() => {
  if (holdingState.isHolding) {
    setIsCameraPlaying(false);
    return;
  }

  let cancelled = false;
  let watchdog = null;
  const myId = ++startIdRef.current;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  async function initCamera() {
    setPermissionError(null);
    setIsCameraPlaying(false);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionError('Camera is not supported on this browser or device.');
      return;
    }

    stopStream();
    await sleep(150); // let the phone fully release the previous camera
    if (cancelled) return;

    try {
      const stream = await getStreamWithFallback({ facingMode });
      if (cancelled || myId !== startIdRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) return;
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;
      video.addEventListener('loadedmetadata', () => video.play().catch(() => {}), { once: true });
      try {
        await video.play();
      } catch (e) {
        if (e.name !== 'AbortError') console.warn('Video play failed:', e);
      }
      if (cancelled) return;
      setIsCameraPlaying(true);

      // Safety net: if no picture arrives, restart the camera automatically.
      watchdog = setTimeout(() => {
        const v = videoRef.current;
        if (cancelled || !v) return;
        if (shouldAutoRetry({ videoWidth: v.videoWidth, readyState: v.readyState, retries: autoRetriesRef.current })) {
          autoRetriesRef.current += 1;
          setRestartKey((k) => k + 1);
        } else if (v.videoWidth > 0) {
          autoRetriesRef.current = 0;
        }
      }, 2500);
    } catch (err) {
      if (!cancelled) {
        setPermissionError(err instanceof Error ? err.message : 'Camera access denied');
      }
    }
  }

  initCamera();

  return () => {
    cancelled = true;
    if (watchdog) clearTimeout(watchdog);
    stopStream();
  };
}, [facingMode, holdingState.isHolding, restartKey]);
```
Notes for the agent:
- The effect is safe under React StrictMode (it runs twice in development): `cancelled` and `startIdRef` make the first run stop itself.
- The early return for `isHolding` also sets `isCameraPlaying` to false, so MediaPipe is off while a photo is being reviewed, and does not start on a video that has no stream yet after Retake.
- Keep the `<video>` element's existing attributes (`autoPlay`, `playsInline`, `muted`) and classes unchanged.

## Step 4: Start MediaPipe only after the camera is playing
Change the options passed to the hook, keeping everything else:
```jsx
useMediaPipePose(videoRef, {
  enabled: !holdingState.isHolding && isCameraPlaying,
  viewMode,
  fps: 15,
});
```
Then check `useMediaPipePose` against Step 1, item 3. If it does not start, stop, and restart correctly when `enabled` changes (including after a camera restart or a switch between cameras, where the same `<video>` element gets a new stream), fix it minimally: cancel the animation frame on stop, avoid starting two loops, and skip frames until `video.readyState >= 2`. Do not change the hook's outputs.

## Step 5: Optional diagnostics (debug flag only)
If the `?debug=pose` flag exists, also show in its readout: the facing mode, `video.videoWidth x videoHeight`, `video.readyState`, `autoRetriesRef.current`, and whether `isCameraPlaying` is true. If the flag does not exist, use `console.debug` for the same values. Nothing appears without the flag.

## Step 6: Report, but do not change
- The screen opens on the **back** camera (`'environment'`). Someone posing alone 2 to 3 meters from the phone cannot see the screen on the back camera. Report where this default is set and what changing it to `'user'` would involve, but **do not change it**; the owner will decide.
- The effect `console.log('[MediaPipe Pose Tracker]', ...)` runs every time the landmarks change, which spams the console. Report it; do not remove it.

## Step 7: Unit tests (no browser needed)
Use the existing test runner. If none is installed, try `npm install -D vitest` inside `frontend/`; otherwise Node's built-in runner, and say so. Use injected fakes (`getUserMedia` and `sleep`) so no real camera or waiting is needed.

1. `buildConstraintAttempts('user')` returns three attempts, ordered from most to least demanding, with the facing mode in the first two.
2. `getStreamWithFallback` returns the stream from the first successful attempt.
3. It retries after a failure such as `NotReadableError` or `OverconstrainedError`, then falls to the next constraint set, and finally succeeds on `{ video: true }`.
4. `NotAllowedError` and `SecurityError` throw **immediately**, with no retries.
5. If every attempt fails, it throws the last error.
6. `shouldAutoRetry`: true when `videoWidth` is 0 or `readyState < 2` and retries are below the maximum; false when the picture is fine; false when retries are used up.
7. `isPermissionError` for the error names above and for `undefined`.

Then run the tests, `npm run build`, and lint if configured.

## Step 8: Human check (for the owner, not for you)
After this is pushed and Vercel redeploys, on a phone in Chrome or Safari (hard refresh, or a private tab):
1. Open the camera screen cold. The picture should appear **without** pressing the switch button. Repeat 10 times: close the camera screen, open it again, and count how many times it shows up on the first try.
2. Press the switch button several times quickly, then wait. The camera should settle on a picture and not go blank.
3. Take a photo, then press **Retake**. The picture should come back by itself.
4. Deny the camera permission once, then allow it in the browser settings and reopen. It should show a clear message, then work.
5. Put the app in the background for 20 seconds and return. If the picture is lost, it should recover within a few seconds.
6. While the camera is blank, nothing should show an error banner unless the camera truly failed.

If the picture still sometimes fails, report the debug readout (`videoWidth`, `readyState`, retries) from `?debug=pose`.

## Out of scope
- Changing which camera opens by default.
- Any pose, tilt, sound, or feedback logic.
- Any backend or upload change.

## Report format
```
Existing pieces found:    (camera screen, hook, how the hook uses `enabled`)
Hook changes needed:      none / (what, and why)
Files created:            (list)
Files changed:            (list, one line each)
Default camera:           (where set; unchanged)
Console log spam:         (where; unchanged)
Tests:                    pass / fail (counts, runner used)
Build:                    pass / fail
Lint:                     pass / fail / not configured
Needs human check:        yes (Step 8)
Anything unclear:         (questions for the owner)
```
