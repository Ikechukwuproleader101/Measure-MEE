# MediaPipe Diagnostic and Test Task

## Problem
On a live camera test page, the skeleton dots do **not** follow the user's body. Find out why and make the test page reliable, so a human can confirm tracking works.

## Hard rules
- Work only inside `frontend/`. Do not touch `backend/` or the root `services/` folder.
- **You cannot open a browser in this environment** (Playwright cannot download its drivers). Do not try. Do the static checks, build checks, and code changes below, then hand the visual check to the human using the checklist in Step 6.
- Do not delete or rewrite `frontend/src/services/poseLandmarker.js`. If it has a bug, explain the bug and make the smallest fix.
- All temporary code must be clearly marked `// TEMP TEST - REMOVE` and listed in the final report.

## Step 1: Check the assets
Report yes/no for each:
1. `frontend/public/models/pose_landmarker_lite.task` exists and is larger than 1 MB.
2. `frontend/public/mediapipe/wasm/` contains `vision_wasm_internal.js` and `vision_wasm_internal.wasm`.
3. `@mediapipe/tasks-vision` is in `frontend/package.json`, and the installed version matches the wasm files in `public/mediapipe/wasm/` (they must be copied from the same installed package version in `node_modules/@mediapipe/tasks-vision/wasm`). If they differ, re-copy the wasm folder from `node_modules`.

## Step 2: Review `poseLandmarker.js` for these known problems
Report what you find for each:
- `runningMode` is `"VIDEO"`.
- The model path is `/models/pose_landmarker_lite.task` and the wasm path is `/mediapipe/wasm`.
- The GPU-to-CPU fallback only triggers when creation throws. Some devices create a GPU landmarker successfully but return wrong or empty results. Add an optional parameter or an exported helper so the delegate can be forced to `"CPU"` for testing.
- The landmarker is created once and reused.

## Step 3: Create the diagnostic page
Create `frontend/src/features/capture/PoseTest.jsx` with the code below. It is self-contained on purpose, so it isolates MediaPipe from the rest of the app. Notes on why it is built this way:
- It is safe under React StrictMode (dev mode runs effects twice), using a `cancelled` flag checked after every `await`.
- The video and canvas sit inside one wrapper with a fixed aspect ratio, so dots always line up with the picture.
- It only runs detection when the video actually has a new frame.
- It defaults to the **CPU** delegate for diagnosis, with a switch to try GPU.
- It shows a debug panel so a human can read exactly what is happening.

```jsx
// TEMP TEST - REMOVE
import { useEffect, useRef, useState } from "react";
import {
  DrawingUtils,
  FilesetResolver,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";

export default function PoseTest() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [delegate, setDelegate] = useState("CPU");
  const [dims, setDims] = useState({ w: 4, h: 3 });
  const [info, setInfo] = useState({
    status: "Loading...",
    fps: 0,
    points: 0,
    nose: "-",
    video: "-",
  });

  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    let stream = null;
    let landmarker = null;

    (async () => {
      const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
      landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "/models/pose_landmarker_lite.task",
          delegate,
        },
        runningMode: "VIDEO",
        numPoses: 1,
      });
      if (cancelled) return;

      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      if (cancelled) return;

      const video = videoRef.current;
      video.srcObject = stream;
      await video.play();
      if (cancelled) return;

      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      setDims({ w: video.videoWidth, h: video.videoHeight });
      const ctx = canvas.getContext("2d");
      const drawing = new DrawingUtils(ctx);

      let lastVideoTime = -1;
      let frames = 0;
      let lastReport = performance.now();
      let lastLm = null;
      let loggedFirst = false;

      const loop = () => {
        if (cancelled) return;
        if (video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;
          const result = landmarker.detectForVideo(video, performance.now());
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          lastLm = result.landmarks && result.landmarks[0];
          if (lastLm) {
            drawing.drawConnectors(lastLm, PoseLandmarker.POSE_CONNECTIONS);
            drawing.drawLandmarks(lastLm, { radius: 3 });
          }
          if (!loggedFirst) {
            console.log("first detection result", result);
            loggedFirst = true;
          }
          frames++;
        }
        const now = performance.now();
        if (now - lastReport >= 1000) {
          setInfo({
            status: lastLm ? "Person detected" : "No person detected",
            fps: frames,
            points: lastLm ? lastLm.length : 0,
            nose: lastLm
              ? `${lastLm[0].x.toFixed(2)}, ${lastLm[0].y.toFixed(2)}`
              : "-",
            video: `${video.videoWidth}x${video.videoHeight}`,
          });
          frames = 0;
          lastReport = now;
        }
        raf = requestAnimationFrame(loop);
      };
      loop();
    })().catch((e) => {
      console.error("PoseTest error", e);
      setInfo((i) => ({ ...i, status: "Error: " + e.message }));
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (landmarker) landmarker.close();
    };
  }, [delegate]);

  return (
    <div style={{ padding: 16, maxWidth: 520 }}>
      <label>
        Delegate:{" "}
        <select value={delegate} onChange={(e) => setDelegate(e.target.value)}>
          <option value="CPU">CPU</option>
          <option value="GPU">GPU</option>
        </select>
      </label>
      <pre style={{ fontSize: 13 }}>
        {`status:  ${info.status}
delegate: ${delegate}
fps:     ${info.fps}
points:  ${info.points}
nose xy: ${info.nose}
video:   ${info.video}`}
      </pre>
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: `${dims.w} / ${dims.h}`,
          transform: "scaleX(-1)",
          background: "#000",
        }}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        />
        <canvas
          ref={canvasRef}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        />
      </div>
    </div>
  );
}
```

## Step 4: Mount it temporarily
Render `<PoseTest />` from the app's entry component (for example `App.jsx`), marked `// TEMP TEST - REMOVE`. Do not remove any existing routes or components; add it so it can be switched off by deleting the marked lines only.

## Step 5: Static checks you can run
1. Run the frontend build (`npm run build` inside `frontend/`) and report whether it passes.
2. Run lint if the project has it, and report any errors in the files you touched.
3. Start the dev server, read its output for compile errors, then stop it. Do not try to open a browser.

## Step 6: Human visual checklist (for the project owner, not for you)
After your changes, tell the owner to:
1. Run the dev server and open the local URL on a computer with a webcam. Allow the camera.
2. Read the debug panel and check:
   - `status` becomes "Person detected" within a few seconds.
   - `fps` is above about 10.
   - `points` is 33.
   - `nose xy` changes as they move their head. Values are between 0 and 1.
3. Confirm the dots and lines sit on the body and follow movement.
4. Switch the delegate between CPU and GPU and note whether results differ.
5. Step back until the whole body is in frame, then hold a rough A-pose with arms about 40 degrees from the sides.

## Step 7: Symptom guide (use this in the report)
| What the debug panel shows | Likely cause | Fix |
|---|---|---|
| `Error:` mentioning fetch, 404, or wasm | Asset path or file missing | Redo Step 1 |
| `Loading...` forever | Camera permission blocked, or landmarker never created | Check browser permission and console |
| `status` is "Person detected" but dots are offset or stretched | Canvas and video sizes differ | Confirm wrapper aspect ratio and canvas size match `video:` values |
| "No person detected" on CPU and GPU, `fps` normal | Body not in frame, bad lighting, or wrong model/wasm pairing | Step back, add light, redo wasm copy in Step 1 |
| Works on CPU, broken or empty on GPU | GPU delegate problem on this device | Make CPU the default in `poseLandmarker.js`, or detect and fall back |
| `fps` very low (under 5) | CPU too slow or page is busy | Try GPU, or throttle detection to about 15 per second |
| Dots are mirrored relative to the person | Mirror applied to only one layer | Apply the flip to the wrapper (as in the code above), never to just one layer |

## Step 8: Cleanup
Do **not** clean up until the human confirms the dots follow the body. Then:
1. Remove everything marked `// TEMP TEST - REMOVE`.
2. Delete `PoseTest.jsx` unless the owner asks to keep it.
3. Keep any real fix made to `poseLandmarker.js`.

## Report format
```
Assets check:           pass / fail (details)
poseLandmarker review:  (findings per item in Step 2)
Build:                  pass / fail
Lint:                   pass / fail / not configured
Files created:          (list)
Files changed:          (list, with a one-line reason each)
Temp code to remove:    (list of files and lines)
Needs human check:      yes (see Step 6)
```
