# Specification: On-Click Pose Validation, Capture State Machine & FastAPI Upload

## 1. Objective
Wire the capture button in `BodyCamera` so that pose validation runs **only when the camera/shutter button is clicked** (not continuously in the background prior to clicking), transitions cleanly through `FRONT` -> `SIDE` -> `REVIEW`, supports individual and full retakes with proper memory cleanup, and uploads the captured images and height to the FastAPI backend.

---

## 2. Strict Guardrails
- **Do NOT alter** existing MediaPipe Pose setup, landmark extraction, or A-pose/pose validation rules.
- **On-click execution only:** Do not run continuous frame-by-frame pose validation before the shutter button is pressed. Validation executes only during/immediately after the shutter button is clicked.
- **Modular scope:** Keep changes focused on capture execution, state transitions (`FRONT` -> `SIDE` -> `REVIEW`), preview URL lifecycle, retake handlers, and FastAPI upload.

---

## 3. State Variables (`BodyCamera`)
```js
const [step, setStep] = useState('FRONT'); // 'FRONT' | 'SIDE' | 'REVIEW'
const [frontBlob, setFrontBlob] = useState(null);
const [sideBlob, setSideBlob] = useState(null);
const [frontPreviewUrl, setFrontPreviewUrl] = useState(null);
const [sidePreviewUrl, setSidePreviewUrl] = useState(null);
const [isValidating, setIsValidating] = useState(false);
const [isUploading, setIsUploading] = useState(false);
const [statusMessage, setStatusMessage] = useState(null);
```

---

## 4. Shutter Click Flow (`handleCaptureClick`)
When the camera/shutter button is clicked (ignore clicks while `isValidating` or `isUploading` is true):
1. Set `isValidating = true` and clear `statusMessage`.
2. Draw the current `<video>` frame onto an offscreen `<canvas>` at native dimensions (`video.videoWidth` x `video.videoHeight`) and export a JPEG `Blob` (`'image/jpeg'`, quality `0.92`).
3. Pass the captured canvas/image/blob into the existing MediaPipe Pose validation function for the active `step` (`'FRONT'` or `'SIDE'`).
4. **If validation fails:**
   - Discard the candidate frame without saving to `frontBlob` or `sideBlob`.
   - Set `statusMessage` to `"Pose not valid. Adjust your position and tap capture again."`
   - Set `isValidating = false` and stay on the current `step`.
5. **If validation passes:**
   - If `step === 'FRONT'`:
     - Revoke any existing `frontPreviewUrl` via `URL.revokeObjectURL`.
     - Save `frontBlob` and set `frontPreviewUrl = URL.createObjectURL(blob)`.
     - Transition `step` to `'SIDE'`.
   - If `step === 'SIDE'`:
     - Revoke any existing `sidePreviewUrl` via `URL.revokeObjectURL`.
     - Save `sideBlob` and set `sidePreviewUrl = URL.createObjectURL(blob)`.
     - Transition `step` to `'REVIEW'`.
   - Set `isValidating = false`.

---

## 5. Review, Retake & Memory Management
- When `step === 'REVIEW'`, pause or stop active camera tracks so hardware stays idle during review.
- `handleRetakeFront()`: revoke `frontPreviewUrl`, set `frontBlob = null`, `frontPreviewUrl = null`, clear `statusMessage`, and set `step = 'FRONT'`.
- `handleRetakeSide()`: revoke `sidePreviewUrl`, set `sideBlob = null`, `sidePreviewUrl = null`, clear `statusMessage`, and set `step = 'SIDE'`.
- `handleResetAll()`: revoke `frontPreviewUrl` and `sidePreviewUrl`, clear `frontBlob`, `sideBlob`, `frontPreviewUrl`, `sidePreviewUrl`, and `statusMessage`, and set `step = 'FRONT'`.
- On component unmount, revoke any active `frontPreviewUrl` and `sidePreviewUrl` and stop active media tracks.

---

## 6. FastAPI Upload (`handleUploadScan`)
When triggered from `'REVIEW'`:
1. Ensure both `frontBlob` and `sideBlob` are present; if not, set `statusMessage = "Both front and side photos are required."` and return.
2. Set `isUploading = true` and clear `statusMessage`.
3. Build `FormData`:
   ```js
   const formData = new FormData();
   formData.append('front_image', frontBlob, 'front.jpg');
   formData.append('side_image', sideBlob, 'side.jpg');
   formData.append('height_cm', String(userHeight));
   ```
4. Send `POST` to `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/scan`.
5. If `!response.ok`, throw `new Error(\`Upload failed (\${response.status})\`)`.
6. Parse JSON response and call `onScanSuccess?.(data)`.
7. On error, set `statusMessage` to the error message; in `finally`, set `isUploading = false`.

---

## 7. Acceptance Criteria
- [ ] Existing MediaPipe Pose setup and validation logic remain untouched.
- [ ] Validation executes only when the shutter button is clicked (not continuously beforehand).
- [ ] Valid front capture saves `frontBlob`, generates preview URL, and advances to `SIDE`.
- [ ] Valid side capture saves `sideBlob`, generates preview URL, and advances to `REVIEW`.
- [ ] Review screen supports individual and full retakes with proper `URL.revokeObjectURL` cleanup.
- [ ] Upload sends `front_image`, `side_image`, and `height_cm` as multipart `FormData` to FastAPI.