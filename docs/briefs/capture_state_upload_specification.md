# Specification: Capture State Transitions, Review Previews & FastAPI Upload

## 1. Scope & Guardrails (CRITICAL)
- **DO NOT rewrite or modify** the existing MediaPipe Pose initialization, landmark detection loop, or A-pose evaluation hook. Consume its existing `isPoseValid` boolean output as-is.
- **ONLY implement** the capture state machine (`FRONT` -> `SIDE` -> `REVIEW`), blob preview management, retake controls, and `FormData` upload trigger inside `BodyCamera.jsx`.

---

## 2. Required State Variables
Manage the capture lifecycle cleanly using React state:

```jsx
const [step, setStep] = useState('FRONT'); // 'FRONT' | 'SIDE' | 'REVIEW'
const [frontBlob, setFrontBlob] = useState(null);
const [sideBlob, setSideBlob] = useState(null);
const [frontPreviewUrl, setFrontPreviewUrl] = useState(null);
const [sidePreviewUrl, setSidePreviewUrl] = useState(null);
const [isUploading, setIsUploading] = useState(false);
const [actionError, setActionError] = useState(null);
```

---

## 3. Capture & State Transition Logic (`FRONT` -> `SIDE` -> `REVIEW`)

### A. Capture Gate
- Shutter button must check `isPoseValid` before capturing.
- If `isPoseValid === false`, prevent capture and set `actionError` (e.g., `"Align your pose first before capturing."`).

### B. Committing Frames & Object URL Cleanup
- Capture the active `<video>` frame onto an offscreen `<canvas>` at native resolution (`video.videoWidth` x `video.videoHeight`) and export as JPEG (`0.92` quality).
- **On `step === 'FRONT'`:**
  - Revoke any existing `frontPreviewUrl` via `URL.revokeObjectURL()`.
  - Store `blob` in `frontBlob` and create a new `frontPreviewUrl = URL.createObjectURL(blob)`.
  - Transition `step` to `'SIDE'` so the alignment overlay switches to the side profile guide.
- **On `step === 'SIDE'`:**
  - Revoke any existing `sidePreviewUrl` via `URL.revokeObjectURL()`.
  - Store `blob` in `sideBlob` and create a new `sidePreviewUrl = URL.createObjectURL(blob)`.
  - Transition `step` to `'REVIEW'`.
- **Cleanup on Unmount:** Ensure `URL.revokeObjectURL()` is called for both preview URLs when `BodyCamera` unmounts to prevent browser memory leaks.

---

## 4. Review Screen & Retake Controls (`step === 'REVIEW'`)

When `step === 'REVIEW'`:
1. **Pause/Hide Live Feed:** Hide the live video stream and pause MediaPipe frame evaluation while in `REVIEW` to save battery and GPU resources.
2. **Display Thumbnails:** Render `frontPreviewUrl` and `sidePreviewUrl` side-by-side.
3. **Granular Retake Buttons:**
   - **Retake Front:** Revokes `frontPreviewUrl`, sets `frontBlob` and `frontPreviewUrl` to `null`, clears `actionError`, and sets `step` to `'FRONT'`. (Keep `sideBlob` intact if already captured, or allow proceeding straight back to `REVIEW` after recapturing front if `sideBlob` exists).
   - **Retake Side:** Revokes `sidePreviewUrl`, sets `sideBlob` and `sidePreviewUrl` to `null`, clears `actionError`, and sets `step` to `'SIDE'`.
   - **Reset All:** Revokes both URLs, clears both blobs and URLs, and resets `step` to `'FRONT'`.

---

## 5. FastAPI Upload Trigger (`/api/v1/scan`)

When the user clicks **Process Measurements** in `REVIEW`:
1. Guard check: Ensure both `frontBlob` and `sideBlob` exist.
2. Set `isUploading = true` and `actionError = null`.
3. Build `FormData`:
   ```javascript
   const formData = new FormData();
   formData.append('front_image', frontBlob, 'front.jpg');
   formData.append('side_image', sideBlob, 'side.jpg');
   formData.append('height_cm', String(userHeight));
   ```
4. Send `POST` request to `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/scan`.
5. On success, pass parsed JSON to `onScanSuccess?.(data)`.
6. On failure, catch error, display message in `actionError`, and reset `isUploading = false` in `finally`.

---

## 6. Acceptance Criteria
- [ ] Existing MediaPipe hook and pose validation remain untouched.
- [ ] Tapping capture during `FRONT` with a valid pose saves `frontBlob` and transitions UI to `SIDE`.
- [ ] Tapping capture during `SIDE` with a valid pose saves `sideBlob` and transitions UI to `REVIEW`.
- [ ] Review screen renders both image previews and allows individual retakes without memory leaks.
- [ ] Submitting sends `front_image`, `side_image`, and `height_cm` as multipart `FormData` to FastAPI.