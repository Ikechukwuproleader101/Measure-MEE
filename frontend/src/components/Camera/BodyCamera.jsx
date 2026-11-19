import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  RefreshCw,
  Check,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Zap,
  ZapOff,
  Camera,
  Upload,
} from 'lucide-react';
import { getStreamWithFallback, shouldAutoRetry } from '../../features/capture/cameraStream';
import { getCaptureLandmarker } from '../../services/poseLandmarker';
import { validatePoseByMode } from '../../utils/poseValidation';
import { PillSpinner } from '../common/PillLoader';

/**
 * BodyCamera Component
 *
 * Implements on-click pose validation, capture state machine (FRONT -> SIDE -> REVIEW),
 * preview URL lifecycle with retake handlers, and multipart FormData upload to FastAPI.
 */
export const BodyCamera = ({
  onBack,
  onComplete,
  onUpload,
  userHeight = 175,
  onScanSuccess,
}) => {
  // 1. Capture State Machine & Photo Storage
  const [step, setStep] = useState('FRONT'); // 'FRONT' | 'SIDE' | 'REVIEW'
  const [frontBlob, setFrontBlob] = useState(null);
  const [sideBlob, setSideBlob] = useState(null);
  const [frontPreviewUrl, setFrontPreviewUrl] = useState(null);
  const [sidePreviewUrl, setSidePreviewUrl] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // 2. Camera Controls & Stream State
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isScreenFlashing, setIsScreenFlashing] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [isCameraPlaying, setIsCameraPlaying] = useState(false);
  const [restartKey, setRestartKey] = useState(0);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const startIdRef = useRef(0);
  const autoRetriesRef = useRef(0);

  // Keep references to preview URLs for safe cleanup on unmount
  const frontPreviewUrlRef = useRef(frontPreviewUrl);
  const sidePreviewUrlRef = useRef(sidePreviewUrl);

  useEffect(() => {
    frontPreviewUrlRef.current = frontPreviewUrl;
    sidePreviewUrlRef.current = sidePreviewUrl;
  }, [frontPreviewUrl, sidePreviewUrl]);

  // Clean up Object URLs on component unmount
  useEffect(() => {
    return () => {
      if (frontPreviewUrlRef.current) URL.revokeObjectURL(frontPreviewUrlRef.current);
      if (sidePreviewUrlRef.current) URL.revokeObjectURL(sidePreviewUrlRef.current);
    };
  }, []);

  // 3. Camera Stream Initialization (hardware stays idle when in REVIEW)
  useEffect(() => {
    if (step === 'REVIEW') {
      // Pause/stop active camera tracks so hardware stays idle during review
      if (videoRef.current) {
        videoRef.current.pause();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
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
      await sleep(150); // allow device to release previous camera hardware
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

        // Safety retry watchdog if video dimensions stay 0
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
  }, [facingMode, step, restartKey]);

  // 4. On-Click Pose Validation & Frame Capture
  const handleCaptureClick = async () => {
    if (isValidating || isUploading) return;
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    setIsValidating(true);
    setStatusMessage(null);
    setIsScreenFlashing(true);
    setTimeout(() => setIsScreenFlashing(false), 200);

    try {
      const width = video.videoWidth;
      const height = video.videoHeight;

      // Draw current video frame onto offscreen canvas at native resolution
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas rendering context not available');
      }
      ctx.drawImage(video, 0, 0, width, height);

      // Export JPEG blob (0.92 quality)
      const blob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92);
      });

      if (!blob) {
        throw new Error('Failed to create image file');
      }

      // Execute MediaPipe Pose landmarker on the captured canvas
      const landmarker = await getCaptureLandmarker();
      const detectionResult = landmarker.detect(canvas);
      const landmarks = detectionResult?.landmarks?.[0];

      const activeMode = step === 'FRONT' ? 'front' : 'side';
      const validation =
        landmarks && landmarks.length >= 33
          ? validatePoseByMode(landmarks, activeMode)
          : { valid: false, reasons: ['No person clearly detected'] };

      // Check validation outcome
      if (!validation.valid) {
        // Discard candidate frame without saving
        setStatusMessage('Pose not valid. Adjust your position and tap capture again.');
        setIsValidating(false);
        return;
      }

      // Validation passed - commit blob and transition state machine
      if (step === 'FRONT') {
        if (frontPreviewUrl) {
          URL.revokeObjectURL(frontPreviewUrl);
        }
        setFrontBlob(blob);
        setFrontPreviewUrl(URL.createObjectURL(blob));
        setStep('SIDE');
      } else if (step === 'SIDE') {
        if (sidePreviewUrl) {
          URL.revokeObjectURL(sidePreviewUrl);
        }
        setSideBlob(blob);
        setSidePreviewUrl(URL.createObjectURL(blob));
        setStep('REVIEW');
      }
    } catch (err) {
      console.error('Capture validation error:', err);
      setStatusMessage('Pose not valid. Adjust your position and tap capture again.');
    } finally {
      setIsValidating(false);
    }
  };

  // 5. Retake & Reset Handlers with Memory Management
  const handleRetakeFront = () => {
    if (frontPreviewUrl) {
      URL.revokeObjectURL(frontPreviewUrl);
    }
    setFrontBlob(null);
    setFrontPreviewUrl(null);
    setStatusMessage(null);
    setStep('FRONT');
  };

  const handleRetakeSide = () => {
    if (sidePreviewUrl) {
      URL.revokeObjectURL(sidePreviewUrl);
    }
    setSideBlob(null);
    setSidePreviewUrl(null);
    setStatusMessage(null);
    setStep('SIDE');
  };

  const handleResetAll = () => {
    if (frontPreviewUrl) {
      URL.revokeObjectURL(frontPreviewUrl);
    }
    if (sidePreviewUrl) {
      URL.revokeObjectURL(sidePreviewUrl);
    }
    setFrontBlob(null);
    setSideBlob(null);
    setFrontPreviewUrl(null);
    setSidePreviewUrl(null);
    setStatusMessage(null);
    setStep('FRONT');
  };

  // 6. FastAPI Upload Handler
  const handleUploadScan = async () => {
    if (!frontBlob || !sideBlob) {
      setStatusMessage('Both front and side photos are required.');
      return;
    }

    setIsUploading(true);
    setStatusMessage(null);

    try {
      const formData = new FormData();
      formData.append('front_image', frontBlob, 'front.jpg');
      formData.append('side_image', sideBlob, 'side.jpg');
      formData.append('height_cm', String(userHeight));

      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const cleanBase = apiBase.replace(/\/+$/, '');
      const response = await fetch(`${cleanBase}/api/v1/scan`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed (${response.status})`);
      }

      const data = await response.json();
      onScanSuccess?.(data);

      if (onUpload) {
        await onUpload(formData, { front: frontBlob, side: sideBlob });
      } else if (onComplete) {
        onComplete({ front: frontBlob, side: sideBlob }, formData);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setStatusMessage(msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-background text-foreground flex flex-col justify-between max-w-lg mx-auto overflow-hidden select-none font-sans">
      {/* Shutter Screen Flash Animation */}
      {isScreenFlashing && (
        <div className="absolute inset-0 z-50 bg-white/90 animate-fade-in pointer-events-none" />
      )}

      {/* Permission Error Banner */}
      {permissionError && (
        <div className="absolute top-20 left-4 right-4 z-40 bg-destructive/90 text-destructive-foreground p-3 rounded-2xl flex items-center gap-2 text-xs font-semibold shadow-lg backdrop-blur-md">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{permissionError}</span>
        </div>
      )}

      {/* Status & Validation Error Message Toast */}
      {statusMessage && (
        <div className="absolute top-20 left-4 right-4 z-40 bg-amber-500/95 text-black p-3 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-xl backdrop-blur-md animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 stroke-[2.5]" />
          <span className="flex-1">{statusMessage}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="p-1 hover:bg-black/10 rounded-full cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Validating Pose Spinner Overlay */}
      {isValidating && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/60 backdrop-blur-xs">
          <PillSpinner className="w-10 h-10 text-primary animate-spin mb-2" />
          <span className="text-xs font-bold text-foreground">Validating pose...</span>
        </div>
      )}

      {/* Uploading Server Spinner Overlay */}
      {isUploading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/70 backdrop-blur-xs">
          <PillSpinner className="w-10 h-10 text-primary animate-spin mb-2" />
          <span className="text-xs font-bold text-foreground">Uploading scan to server...</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="px-5 pt-6 pb-2 flex items-center justify-between z-30 w-full">
        <button
          type="button"
          onClick={onBack}
          className="w-11 h-11 rounded-full bg-card/80 backdrop-blur-md border border-border flex items-center justify-center text-foreground hover:bg-card transition-all cursor-pointer shadow-sm active:scale-95"
          aria-label="Close camera"
        >
          <X className="w-5 h-5 stroke-[2]" />
        </button>

        {/* Center Step Badge */}
        <div className="px-4 py-2 rounded-full bg-primary/20 border border-primary/30 backdrop-blur-md flex items-center gap-2 text-xs font-semibold text-primary shadow-sm">
          {step === 'FRONT' && <span>Step 1 of 2 • Front View</span>}
          {step === 'SIDE' && <span>Step 2 of 2 • Side View</span>}
          {step === 'REVIEW' && <span>Review Captures</span>}
        </div>

        {/* Right Flash Toggle (available only in active camera modes) */}
        {step !== 'REVIEW' ? (
          <button
            type="button"
            onClick={() => setIsFlashOn(!isFlashOn)}
            className={`w-11 h-11 rounded-full backdrop-blur-md border flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 ${
              isFlashOn
                ? 'bg-primary text-primary-foreground border-primary shadow-primary/30'
                : 'bg-card/80 text-primary border-border hover:bg-card'
            }`}
            aria-label={isFlashOn ? 'Disable flash' : 'Enable flash'}
          >
            {isFlashOn ? <Zap className="w-5 h-5 fill-current" /> : <ZapOff className="w-5 h-5 stroke-[2]" />}
          </button>
        ) : (
          <div className="w-11" />
        )}
      </header>

      {/* Main View Area */}
      {step === 'REVIEW' ? (
        /* REVIEW SCREEN */
        <main className="flex-1 px-5 py-4 flex flex-col justify-between overflow-y-auto z-20">
          <div className="w-full">
            <h2 className="text-lg font-bold text-foreground text-center">
              Your Measurement Photos
            </h2>
            <p className="text-xs text-muted-foreground text-center mt-1">
              Height: {userHeight} cm • Both captures ready for geometric extraction
            </p>

            {/* Photo Cards Grid */}
            <div className="grid grid-cols-2 gap-3.5 mt-5">
              {/* Front Photo Card */}
              <div className="flex flex-col gap-2">
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-card border border-border shadow-md">
                  {frontPreviewUrl ? (
                    <img
                      src={frontPreviewUrl}
                      alt="Front capture"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                      No front photo
                    </div>
                  )}
                  <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-[10px] font-semibold text-white flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                    <span>Front</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRetakeFront}
                  className="w-full py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Retake Front</span>
                </button>
              </div>

              {/* Side Photo Card */}
              <div className="flex flex-col gap-2">
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-card border border-border shadow-md">
                  {sidePreviewUrl ? (
                    <img
                      src={sidePreviewUrl}
                      alt="Side capture"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                      No side photo
                    </div>
                  )}
                  <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-[10px] font-semibold text-white flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                    <span>Side</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRetakeSide}
                  className="w-full py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Retake Side</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col gap-2.5 pt-6 pb-2">
            <button
              type="button"
              onClick={handleUploadScan}
              disabled={isUploading || !frontBlob || !sideBlob}
              className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>{isUploading ? 'Uploading...' : 'Upload & Analyze Scan'}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              type="button"
              onClick={handleResetAll}
              disabled={isUploading}
              className="w-full h-10 rounded-2xl bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake All Photos</span>
            </button>
          </div>
        </main>
      ) : (
        /* CAMERA VIEWFINDER (FRONT or SIDE) */
        <>
          <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-black flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover opacity-90"
            />
          </div>

          <main className="relative flex-1 flex flex-col items-center justify-center overflow-hidden px-4 z-10 my-1 pointer-events-none">
            {/* Viewfinder Brackets */}
            <div className="absolute top-2 left-6 w-9 h-9 border-t-[2.5px] border-l-[2.5px] rounded-tl-2xl border-primary/80" />
            <div className="absolute top-2 right-6 w-9 h-9 border-t-[2.5px] border-r-[2.5px] rounded-tr-2xl border-primary/80" />
            <div className="absolute bottom-24 left-6 w-9 h-9 border-b-[2.5px] border-l-[2.5px] rounded-bl-2xl border-primary/80" />
            <div className="absolute bottom-24 right-6 w-9 h-9 border-b-[2.5px] border-r-[2.5px] rounded-br-2xl border-primary/80" />

            {/* Center Hairline */}
            <div className="absolute inset-y-4 left-1/2 -translate-x-1/2 w-[1px] bg-primary/30" />

            {/* View Direction Guidance Pill */}
            <div className="mt-auto mb-3 px-5 py-2.5 rounded-full bg-card/90 backdrop-blur-md border border-border shadow-lg flex items-center gap-2.5 animate-fade-in pointer-events-auto">
              <Camera className="w-4 h-4 text-primary shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-foreground leading-tight">
                  {step === 'FRONT'
                    ? 'Stand in A-Pose (arms away from body)'
                    : 'Turn 90° with arms relaxed at your side'}
                </span>
                <span className="text-[11px] text-muted-foreground leading-tight">
                  Full body must be visible • Tap button to validate & capture
                </span>
              </div>
            </div>
          </main>

          {/* Shutter Bar */}
          <footer className="w-full rounded-t-[32px] bg-card border-t border-border px-8 pt-5 pb-8 flex items-center justify-between shadow-2xl z-30 relative">
            <div className="w-14 flex items-center justify-start">
              <button
                type="button"
                onClick={() =>
                  setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
                }
                className="w-11 h-11 rounded-2xl bg-secondary/50 hover:bg-secondary border border-border flex flex-col items-center justify-center text-foreground transition-all cursor-pointer shadow-sm active:scale-95 group"
                aria-label="Flip camera"
              >
                <RefreshCw className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:rotate-180 transition-all duration-300" />
              </button>
            </div>

            <div className="flex-1 flex justify-center">
              <button
                type="button"
                onClick={handleCaptureClick}
                disabled={isValidating || isUploading || !isCameraPlaying}
                className="w-20 h-20 rounded-full border-4 p-1.5 border-primary/40 hover:border-primary/80 flex items-center justify-center active:scale-95 transition-all cursor-pointer group shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Capture and validate photo"
              >
                <div className="w-full h-full rounded-full transition-colors bg-primary group-hover:bg-primary/90 shadow-inner flex items-center justify-center" />
              </button>
            </div>

            <div className="w-14 flex items-center justify-end">
              <div className="text-right">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {step === 'FRONT' ? '1/2' : '2/2'}
                </span>
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
};

export default BodyCamera;
