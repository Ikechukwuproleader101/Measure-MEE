import React, { useState, useEffect, useRef } from 'react';
import { X, RefreshCw, Check, AlertCircle, ArrowRight, RotateCcw, User, Zap, ZapOff } from 'lucide-react';
import { useMediaPipePose } from '../../hooks/useMediaPipePose';

/**
 * BodyCamera Component
 *
 * Implements the camera interface and local state machine for 3D body measurement.
 * Handles high-resolution getUserMedia stream, captures raw frames into HTML5 Canvas,
 * holds image blobs temporarily in browser RAM with review/retake states,
 * and packages them into a multipart FormData request for backend processing.
 */
export const BodyCamera = ({ onBack, onComplete, onUpload }) => {
  const [viewMode, setViewMode] = useState('front'); // 'front' | 'side'
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [isScreenFlashing, setIsScreenFlashing] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // In-memory RAM storage for captured blobs and temporary object preview URLs
  const [capturedBlobs, setCapturedBlobs] = useState({
    front: null,
    side: null,
  });

  const [previewUrls, setPreviewUrls] = useState({
    front: null,
    side: null,
  });

  // Currently held image being reviewed before committing
  const [holdingState, setHoldingState] = useState({
    isHolding: false,
    view: null, // 'front' | 'side'
    blob: null,
    previewUrl: null,
  });

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  // Real-time on-device MediaPipe Pose detection & A-pose tracking
  const {
    isReady: isPoseReady,
    isLoading: isPoseLoading,
    isValid: isPoseValid,
    reasons: poseReasons,
    landmarks: poseLandmarks,
  } = useMediaPipePose(videoRef, {
    enabled: !holdingState.isHolding,
    viewMode,
    fps: 15,
  });

  // Log tracking status to console for live monitoring
  useEffect(() => {
    if (isPoseReady) {
      console.log('[MediaPipe Pose Tracker]', {
        active: true,
        ready: isPoseReady,
        valid: isPoseValid,
        landmarksCount: poseLandmarks ? poseLandmarks.length : 0,
        hint: poseReasons[0] || 'Valid',
      });
    }
  }, [isPoseReady, isPoseValid, poseLandmarks, poseReasons]);

  // 1. Initialize High-Resolution getUserMedia Stream
  useEffect(() => {
    let isMounted = true;

    async function initCamera() {
      setPermissionError(null);

      // Stop existing tracks if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissionError('Camera is not supported on this browser or device.');
        return;
      }

      try {
        const constraints = {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920, max: 3840 },
            height: { ideal: 1080, max: 2160 },
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        if (isMounted) {
          const errMsg = err instanceof Error ? err.message : 'Camera access denied';
          setPermissionError(errMsg);
        }
      }
    }

    // Only stream if not holding an image for review
    if (!holdingState.isHolding) {
      initCamera();
    }

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode, holdingState.isHolding]);

  // Clean up Object URLs from browser RAM when unmounting
  useEffect(() => {
    return () => {
      if (previewUrls.front) URL.revokeObjectURL(previewUrls.front);
      if (previewUrls.side) URL.revokeObjectURL(previewUrls.side);
      if (holdingState.previewUrl) URL.revokeObjectURL(holdingState.previewUrl);
    };
  }, [previewUrls, holdingState.previewUrl]);

  // 2. High-Resolution Frame Capture to Memory Blob
  const captureFrameToBlob = () => {
    const video = videoRef.current;
    if (!video) return null;

    const width = video.videoWidth || 1920;
    const height = video.videoHeight || 1080;

    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvasRef.current = canvas;
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Draw video frame onto offscreen canvas
    ctx.drawImage(video, 0, 0, width, height);

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        'image/jpeg',
        0.95
      );
    });
  };

  // Trigger Shutter Flash & Hold Image in State
  const executeCapture = async () => {
    setIsScreenFlashing(true);
    setTimeout(() => setIsScreenFlashing(false), 200);

    const blob = await captureFrameToBlob();
    if (!blob) return;

    // Store temporarily in RAM and create preview Object URL
    const tempUrl = URL.createObjectURL(blob);

    // Pause video feed
    if (videoRef.current) {
      videoRef.current.pause();
    }

    // Enter temporary holding state
    setHoldingState({
      isHolding: true,
      view: viewMode,
      blob,
      previewUrl: tempUrl,
    });
  };

  // Countdown timer effect
  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((c) => (c !== null ? c - 1 : null));
      }, 700);
      return () => clearTimeout(timer);
    } else {
      setCountdown(null);
      executeCapture();
    }
  }, [countdown]);

  // 3. User Actions on Held Image (Retake vs Accept)
  const handleRetakeHeldImage = () => {
    if (holdingState.previewUrl) {
      URL.revokeObjectURL(holdingState.previewUrl);
    }

    // Reset holding state to resume live video feed
    setHoldingState({
      isHolding: false,
      view: null,
      blob: null,
      previewUrl: null,
    });

    if (videoRef.current && streamRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleAcceptHeldImage = async () => {
    const { view, blob, previewUrl } = holdingState;
    if (!blob || !view) return;

    // Save into committed in-memory state
    const nextBlobs = {
      ...capturedBlobs,
      [view]: blob,
    };
    const nextPreviews = {
      ...previewUrls,
      [view]: previewUrl,
    };

    setCapturedBlobs(nextBlobs);
    setPreviewUrls(nextPreviews);

    // Clear holding state
    setHoldingState({
      isHolding: false,
      view: null,
      blob: null,
      previewUrl: null,
    });

    // Check if both views are ready
    if (view === 'front') {
      if (!nextBlobs.side) {
        // Transition to Side View
        setViewMode('side');
      } else {
        // Both complete
        handleFinalSubmission(nextBlobs);
      }
    } else if (view === 'side') {
      if (!nextBlobs.front) {
        // Transition to Front View
        setViewMode('front');
      } else {
        // Both complete
        handleFinalSubmission(nextBlobs);
      }
    }
  };

  // 4. Multipart FormData Upload Packaging
  const handleFinalSubmission = async (blobs) => {
    if (!blobs.front || !blobs.side) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('front', blobs.front, 'front_view.jpg');
      formData.append('side', blobs.side, 'side_view.jpg');

      if (onUpload) {
        await onUpload(formData, blobs);
      } else if (onComplete) {
        onComplete(blobs, formData);
      }
    } catch (err) {
      console.error('Error during photo package upload:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const stepNumber = viewMode === 'front' ? 1 : 2;
  const currentViewLabel = viewMode === 'front' ? 'Front View' : 'Side View';

  return (
    <div className="relative w-full h-full min-h-screen bg-background text-foreground flex flex-col justify-between max-w-lg mx-auto overflow-hidden select-none font-sans">
      {/* Screen Shutter Flash Overlay */}
      {isScreenFlashing && (
        <div className="absolute inset-0 z-50 bg-white/90 animate-fade-in pointer-events-none" />
      )}

      {/* Camera Stream Viewfinder */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-black flex items-center justify-center">
        {holdingState.isHolding && holdingState.previewUrl ? (
          /* Held Image Frozen in RAM */
          <img
            src={holdingState.previewUrl}
            alt="Held captured preview"
            className="w-full h-full object-cover"
          />
        ) : (
          /* Live Video Stream */
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover opacity-85 brightness-95"
          />
        )}
      </div>

      {/* Permission Error Banner */}
      {permissionError && (
        <div className="absolute top-20 left-4 right-4 z-40 bg-destructive/90 text-destructive-foreground p-3 rounded-2xl flex items-center gap-2 text-xs font-semibold shadow-lg backdrop-blur-md">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{permissionError}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="px-5 pt-6 pb-2 flex items-center justify-between z-30 w-full">
        {/* Left: Close/Back Button */}
        <button
          type="button"
          onClick={onBack}
          className="w-11 h-11 rounded-full bg-card/80 backdrop-blur-md border border-border flex items-center justify-center text-foreground hover:bg-card transition-all cursor-pointer shadow-sm active:scale-95"
          aria-label="Close camera"
        >
          <X className="w-5 h-5 stroke-[2]" />
        </button>

        {/* Center: Step & Angle Badge */}
        <div className="px-4 py-2 rounded-full bg-primary/20 border border-primary/30 backdrop-blur-md flex items-center gap-2 text-xs font-semibold text-primary shadow-sm">
          <span>Step {stepNumber} of 2</span>
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span>{currentViewLabel}</span>
        </div>

        {/* Right: Flash Toggle */}
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
      </header>

      {/* Main Viewfinder Overlay */}
      <main className="relative flex-1 flex flex-col items-center justify-center overflow-hidden px-4 z-10 my-1">
        {/* Countdown Center Overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/50 backdrop-blur-xs rounded-3xl animate-fade-in">
            <span className="text-8xl font-black text-primary font-display animate-ping select-none">
              {countdown}
            </span>
          </div>
        )}

        {/* Temporary Held State Banner Overlay */}
        {holdingState.isHolding && (
          <div className="absolute top-4 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-lg animate-fade-in z-20 flex items-center gap-2">
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{holdingState.view === 'front' ? 'Front' : 'Side'} photo held in RAM</span>
          </div>
        )}

        {/* Viewfinder Brackets - Glow green when pose is valid */}
        <div className={`absolute top-2 left-6 w-9 h-9 border-t-[2.5px] border-l-[2.5px] rounded-tl-2xl pointer-events-none transition-colors duration-300 ${isPoseValid ? 'border-emerald-400' : 'border-primary/80'}`} />
        <div className={`absolute top-2 right-6 w-9 h-9 border-t-[2.5px] border-r-[2.5px] rounded-tr-2xl pointer-events-none transition-colors duration-300 ${isPoseValid ? 'border-emerald-400' : 'border-primary/80'}`} />
        <div className={`absolute bottom-24 left-6 w-9 h-9 border-b-[2.5px] border-l-[2.5px] rounded-bl-2xl pointer-events-none transition-colors duration-300 ${isPoseValid ? 'border-emerald-400' : 'border-primary/80'}`} />
        <div className={`absolute bottom-24 right-6 w-9 h-9 border-b-[2.5px] border-r-[2.5px] rounded-br-2xl pointer-events-none transition-colors duration-300 ${isPoseValid ? 'border-emerald-400' : 'border-primary/80'}`} />

        {/* Center Vertical Hairline Alignment Line */}
        <div className={`absolute inset-y-4 left-1/2 -translate-x-1/2 w-[1px] pointer-events-none transition-colors duration-300 ${isPoseValid ? 'bg-emerald-400/70' : 'bg-primary/30'}`} />

        {/* Distance guidance pill - Live dynamic guidance */}
        {!holdingState.isHolding && (
          <div className="mt-auto mb-3 px-5 py-2 rounded-full bg-card/90 backdrop-blur-md border border-border shadow-lg flex items-center gap-3 animate-fade-in z-20">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
              isPoseValid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-primary/20 text-primary'
            }`}>
              {isPoseValid ? <Check className="w-4 h-4 stroke-[2.5]" /> : <User className="w-4 h-4 fill-current" />}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-foreground leading-tight">
                {isPoseLoading
                  ? 'Loading pose tracker...'
                  : isPoseValid
                  ? 'Pose Locked & Stable'
                  : poseReasons[0] || 'Stand 2 meters back'}
              </span>
              <span className="text-[11px] text-muted-foreground leading-tight">
                {isPoseValid ? '(Ready to capture)' : '(Full body must be visible)'}
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Control Bar */}
      <footer className="w-full rounded-t-[32px] bg-card border-t border-border px-8 pt-5 pb-8 flex items-center justify-between shadow-2xl z-30 relative">
        {holdingState.isHolding ? (
          /* Held State Decision Buttons (Retake vs Keep) */
          <div className="w-full flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleRetakeHeldImage}
              className="flex-1 h-[52px] rounded-2xl bg-secondary/80 hover:bg-secondary text-foreground font-semibold text-sm flex items-center justify-center gap-2 border border-border cursor-pointer transition-all active:scale-[0.98]"
            >
              <RotateCcw className="w-4 h-4 text-muted-foreground" />
              <span>Retake</span>
            </button>

            <button
              type="button"
              onClick={handleAcceptHeldImage}
              disabled={isUploading}
              className="flex-1 h-[52px] rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-primary/25 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-60"
            >
              <span>{viewMode === 'front' && !capturedBlobs.side ? 'Use & Continue' : 'Confirm Both'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Normal Live Camera Capture Controls */
          <>
            <div className="w-14 flex items-center justify-start">
              <button
                type="button"
                onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
                className="w-11 h-11 rounded-2xl bg-secondary/50 hover:bg-secondary border border-border flex flex-col items-center justify-center text-foreground transition-all cursor-pointer shadow-sm active:scale-95 group"
                aria-label="Flip camera"
              >
                <RefreshCw className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:rotate-180 transition-all duration-300" />
              </button>
            </div>

            <div className="flex-1 flex justify-center">
              <button
                type="button"
                onClick={() => setCountdown(3)}
                disabled={countdown !== null}
                className={`w-20 h-20 rounded-full border-4 p-1.5 flex items-center justify-center active:scale-95 transition-all cursor-pointer group shadow-lg ${
                  isPoseValid
                    ? 'border-emerald-500/80 hover:border-emerald-400 shadow-emerald-500/20'
                    : 'border-primary/35 hover:border-primary/60 shadow-primary/20'
                } disabled:opacity-50`}
                aria-label="Capture photo"
              >
                <div className={`w-full h-full rounded-full transition-colors shadow-inner flex items-center justify-center ${
                  isPoseValid ? 'bg-emerald-500 group-hover:bg-emerald-400' : 'bg-primary group-hover:bg-primary/90'
                }`} />
              </button>
            </div>

            <div className="w-14 flex items-center justify-end">
              <div className="text-right">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {viewMode === 'front' ? '1/2' : '2/2'}
                </span>
              </div>
            </div>
          </>
        )}
      </footer>
    </div>
  );
};

export default BodyCamera;
