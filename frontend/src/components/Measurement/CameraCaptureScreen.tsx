import React, { useState, useEffect, useRef, useReducer, useCallback } from 'react';
import {
  X,
  Zap,
  ZapOff,
  User,
  RefreshCw,
  Check,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Ruler,
  AlertCircle,
  Camera,
} from 'lucide-react';
import { usePoseValidation } from '../../features/capture/usePoseValidation';
import { validateAPose } from '../../features/capture/validateAPose';
import { validateSidePose } from '../../features/capture/validateSidePose';
import { COUNTDOWN_SECONDS } from '../../features/capture/poseConstants';
import { captureFrame } from '../../features/capture/captureFrame';
import {
  captureReducer,
  INITIAL_CAPTURE_STATE,
  setHeightAction,
  goToStepAction,
  setCaptureAction,
  retakeAction,
  resetAction,
} from '../../features/capture/captureSession';
import { validateHeight } from '../../features/capture/heightValidation';

interface CameraCaptureScreenProps {
  onBack: () => void;
  onCaptured: () => void;
}

export const CameraCaptureScreen: React.FC<CameraCaptureScreenProps> = ({
  onBack,
  onCaptured,
}) => {
  const [session, dispatch] = useReducer(captureReducer, INITIAL_CAPTURE_STATE);

  // Height step local input state
  const [heightInput, setHeightInput] = useState<string>(
    session.heightCm ? String(session.heightCm) : ''
  );
  const [heightError, setHeightError] = useState<string | null>(null);

  // Camera settings & controls
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isScreenFlashing, setIsScreenFlashing] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasCameraStream, setHasCameraStream] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isCameraStep = session.step === 'front' || session.step === 'side';
  const currentView = session.step === 'side' ? 'side' : 'front';
  const currentValidator = currentView === 'front' ? validateAPose : validateSidePose;

  // Real-time on-device MediaPipe Pose detection
  const {
    isValid: isPoseValid,
    hint: poseHint,
    isReady: isPoseReady,
    error: poseError,
  } = usePoseValidation({
    videoRef,
    canvasRef,
    enabled: isCameraStep && hasCameraStream && !isCapturing,
    validator: currentValidator,
  });

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 2800);
  };

  // 1. Initialize and clean up getUserMedia stream only during camera steps
  useEffect(() => {
    let isMounted = true;

    if (!isCameraStep) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setHasCameraStream(false);
      return;
    }

    async function initCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraStream(false);
        return;
      }

      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setHasCameraStream(true);
      } catch {
        if (isMounted) {
          setHasCameraStream(false);
        }
      }
    }

    initCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isCameraStep, facingMode]);

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => {
      if (session.front?.previewUrl) {
        try {
          URL.revokeObjectURL(session.front.previewUrl);
        } catch {
          // ignore
        }
      }
      if (session.side?.previewUrl) {
        try {
          URL.revokeObjectURL(session.side.previewUrl);
        } catch {
          // ignore
        }
      }
    };
  }, [session.front?.previewUrl, session.side?.previewUrl]);

  // Execute frame capture using separate IMAGE mode landmarker
  const executeCapture = useCallback(async () => {
    if (!videoRef.current || isCapturing) return;

    setIsCapturing(true);
    setIsScreenFlashing(true);
    setTimeout(() => setIsScreenFlashing(false), 200);

    const result = await captureFrame({
      video: videoRef.current,
      view: currentView,
      validator: currentValidator,
    });

    if ('error' in result) {
      showNotification(result.error);
      setIsCapturing(false);
    } else {
      dispatch(setCaptureAction(currentView, result));
      dispatch(goToStepAction(currentView === 'front' ? 'reviewFront' : 'reviewSide'));
      setIsCapturing(false);
    }
  }, [currentView, currentValidator, isCapturing]);

  // 3. Hands-free capture countdown (3 -> 2 -> 1 -> capture at 0)
  // When green (stable), start countdown. If frame turns red, cancel and reset.
  useEffect(() => {
    if (!isCameraStep || isCapturing) {
      setCountdown(null);
      return;
    }

    if (isPoseValid) {
      if (countdown === null) {
        setCountdown(COUNTDOWN_SECONDS);
      }
    } else {
      // Turned red during countdown: cancel and reset
      if (countdown !== null) {
        setCountdown(null);
      }
    }
  }, [isCameraStep, isPoseValid, isCapturing, countdown]);

  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((c) => (c !== null && c > 0 ? c - 1 : null));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCountdown(null);
      executeCapture();
    }
  }, [countdown, executeCapture]);

  const handleManualShutter = () => {
    if (!isPoseValid || isCapturing) return;
    executeCapture();
  };

  const handleToggleFlash = () => {
    setIsFlashOn((prev) => {
      const next = !prev;
      showNotification(next ? 'Flash enabled' : 'Flash disabled');
      return next;
    });
  };

  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    showNotification('Switched camera');
  };

  // Height Form submit
  const handleHeightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = validateHeight(heightInput);
    if (!res.valid || res.heightCm === null) {
      setHeightError(res.error || 'Please enter a valid height between 100 and 230 cm');
      return;
    }
    setHeightError(null);
    dispatch(setHeightAction(res.heightCm));
    dispatch(goToStepAction('prep'));
  };

  // Render Step 1: Height Entry
  if (session.step === 'height') {
    const check = validateHeight(heightInput);
    const canContinue = check.valid;

    return (
      <div className="relative w-full min-h-screen bg-background text-foreground flex flex-col justify-between max-w-lg mx-auto p-6 font-sans">
        <header className="flex items-center justify-between pt-2 pb-4">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-secondary/80 border border-border flex items-center justify-center text-foreground hover:bg-secondary transition-all cursor-pointer shadow-xs active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            Step 1 of 4
          </div>
          <div className="w-10" />
        </header>

        <main className="flex-1 flex flex-col justify-center items-center max-w-sm mx-auto w-full text-center py-6">
          <div className="w-16 h-16 rounded-3xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary mb-6 shadow-inner">
            <Ruler className="w-8 h-8" />
          </div>

          <h1 className="text-2xl font-bold text-foreground tracking-tight">Your height (cm)</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            We use your height to get the scale right.
          </p>

          <form onSubmit={handleHeightSubmit} className="w-full mt-8 flex flex-col items-center">
            <div className="relative w-48">
              <input
                id="height-input"
                type="number"
                inputMode="numeric"
                min={100}
                max={230}
                value={heightInput}
                onChange={(e) => {
                  setHeightInput(e.target.value);
                  setHeightError(null);
                }}
                placeholder="175"
                autoFocus
                className="w-full text-center text-4xl font-black py-3 px-4 rounded-2xl bg-card border-2 border-border focus:border-primary focus:outline-none transition-all shadow-sm tracking-wide text-foreground placeholder:text-muted-foreground/40"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                cm
              </span>
            </div>

            {heightError && (
              <div className="flex items-center gap-1.5 text-xs text-destructive font-medium mt-3 animate-fade-in">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{heightError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!canContinue}
              className="w-full mt-10 h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm tracking-wide transition-all shadow-md active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </main>

        <footer className="text-center pb-2 text-[11px] text-muted-foreground">
          Accepted range: 100 cm – 230 cm
        </footer>
      </div>
    );
  }

  // Render Step 2: Get-Ready Tips (prep)
  if (session.step === 'prep') {
    return (
      <div className="relative w-full min-h-screen bg-background text-foreground flex flex-col justify-between max-w-lg mx-auto p-6 font-sans">
        <header className="flex items-center justify-between pt-2 pb-4">
          <button
            type="button"
            onClick={() => dispatch(goToStepAction('height'))}
            className="w-10 h-10 rounded-full bg-secondary/80 border border-border flex items-center justify-center text-foreground hover:bg-secondary transition-all cursor-pointer shadow-xs active:scale-95"
            aria-label="Back to height"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            Step 2 of 4
          </div>
          <div className="w-10" />
        </header>

        <main className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full py-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary mb-5 shadow-inner">
            <Sparkles className="w-7 h-7" />
          </div>

          <h1 className="text-2xl font-bold text-foreground tracking-tight">Get Ready</h1>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Follow these tips for the most accurate measurements:
          </p>

          <ul className="mt-6 space-y-3.5 text-xs text-foreground/90">
            <li className="flex items-start gap-3 p-3 rounded-2xl bg-card border border-border">
              <span className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                1
              </span>
              <span className="leading-relaxed">Wear fitted clothes (loose clothes make measurements bigger).</span>
            </li>
            <li className="flex items-start gap-3 p-3 rounded-2xl bg-card border border-border">
              <span className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                2
              </span>
              <span className="leading-relaxed">
                Stand 2 to 3 meters from the camera with your whole body in view, head to feet.
              </span>
            </li>
            <li className="flex items-start gap-3 p-3 rounded-2xl bg-card border border-border">
              <span className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                3
              </span>
              <span className="leading-relaxed">Put the camera about chest height, level, not tilted.</span>
            </li>
            <li className="flex items-start gap-3 p-3 rounded-2xl bg-card border border-border">
              <span className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                4
              </span>
              <span className="leading-relaxed">Plain background and good light in front of you.</span>
            </li>
            <li className="flex items-start gap-3 p-3 rounded-2xl bg-card border border-border">
              <span className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                5
              </span>
              <span className="leading-relaxed">Take off shoes and bulky jackets if you can.</span>
            </li>
          </ul>

          {/* Reserved space for owner to add consent text later */}
          <div className="mt-4 min-h-[16px] text-[10px] text-muted-foreground text-center" />

          <button
            type="button"
            onClick={() => dispatch(goToStepAction('front'))}
            className="w-full mt-6 h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm tracking-wide transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>I'm ready</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </main>

        <footer className="text-center pb-2 text-[11px] text-muted-foreground">
          Camera permission required next
        </footer>
      </div>
    );
  }

  // Render Step 4 & 6: Review Captured Photo (reviewFront / reviewSide)
  if (session.step === 'reviewFront' || session.step === 'reviewSide') {
    const isFrontReview = session.step === 'reviewFront';
    const reviewResult = isFrontReview ? session.front : session.side;
    const viewTitle = isFrontReview ? 'Front Photo' : 'Side Photo';

    return (
      <div className="relative w-full min-h-screen bg-background text-foreground flex flex-col justify-between max-w-lg mx-auto p-5 font-sans">
        <header className="flex items-center justify-between pt-2 pb-2">
          <div className="w-10" />
          <div className="px-4 py-1.5 rounded-full bg-primary/15 border border-primary/25 text-xs font-semibold text-primary">
            Review {viewTitle}
          </div>
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-secondary/80 border border-border flex items-center justify-center text-foreground hover:bg-secondary transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center my-3 relative overflow-hidden rounded-3xl border border-border bg-black/60 shadow-inner">
          {reviewResult?.previewUrl ? (
            <img
              src={reviewResult.previewUrl}
              alt={viewTitle}
              className="w-full h-full object-contain max-h-[65vh] select-none rounded-3xl"
            />
          ) : (
            <div className="text-xs text-muted-foreground">No preview available</div>
          )}
        </main>

        <footer className="flex flex-col gap-3 pt-2 pb-4">
          <p className="text-center text-xs text-muted-foreground">
            Make sure your whole body is clearly visible and posture is natural.
          </p>
          <div className="flex items-center gap-3 w-full">
            <button
              type="button"
              onClick={() => dispatch(retakeAction(isFrontReview ? 'front' : 'side'))}
              className="flex-1 h-12 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake</span>
            </button>
            <button
              type="button"
              onClick={() =>
                dispatch(goToStepAction(isFrontReview ? 'side' : 'done'))
              }
              className="flex-1 h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98"
            >
              <span>Looks good</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </footer>
      </div>
    );
  }

  // Render Step 7: Done Screen
  if (session.step === 'done') {
    return (
      <div className="relative w-full min-h-screen bg-background text-foreground flex flex-col justify-between max-w-lg mx-auto p-6 font-sans">
        <header className="flex items-center justify-between pt-2 pb-2">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-secondary/80 border border-border flex items-center justify-center text-foreground hover:bg-secondary transition-all cursor-pointer shadow-xs active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-xs font-semibold text-emerald-500">
            Captures Complete
          </div>
          <div className="w-10" />
        </header>

        <main className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full py-4 text-center">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-500 mb-4 shadow-inner">
            <Check className="w-8 h-8 stroke-[2.5]" />
          </div>

          <h1 className="text-2xl font-bold text-foreground tracking-tight">Photos captured!</h1>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-xs leading-relaxed">
            Your front and side reference photos are ready for body measurement.
          </p>

          <div className="mt-3 px-3 py-1 rounded-full bg-secondary border border-border text-xs font-medium text-foreground">
            Height confirmed: <span className="font-bold text-primary">{session.heightCm} cm</span>
          </div>

          {/* Thumbnails of both photos */}
          <div className="grid grid-cols-2 gap-3.5 w-full mt-6">
            <div className="flex flex-col items-center p-2.5 rounded-2xl bg-card border border-border shadow-xs">
              <span className="text-[11px] font-bold text-muted-foreground mb-2">Front View</span>
              <div className="w-full h-36 rounded-xl bg-black/40 overflow-hidden border border-border/60">
                {session.front?.previewUrl && (
                  <img
                    src={session.front.previewUrl}
                    alt="Front view"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>

            <div className="flex flex-col items-center p-2.5 rounded-2xl bg-card border border-border shadow-xs">
              <span className="text-[11px] font-bold text-muted-foreground mb-2">Side View</span>
              <div className="w-full h-36 rounded-xl bg-black/40 overflow-hidden border border-border/60">
                {session.side?.previewUrl && (
                  <img
                    src={session.side.previewUrl}
                    alt="Side view"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>
          </div>

          {/* NEXT: measurement step goes here */}

          <button
            type="button"
            onClick={onCaptured}
            className="w-full mt-8 h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm tracking-wide transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Proceed to Measurements</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => dispatch(resetAction())}
            className="mt-3 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer"
          >
            Start over
          </button>
        </main>

        <footer className="text-center pb-2 text-[10px] text-muted-foreground">
          All images remain on device in local RAM
        </footer>
      </div>
    );
  }

  // Render Step 3 & 5: Camera Screen (front and side)
  const isPersonInView =
    isPoseReady &&
    !isPoseValid &&
    poseHint !== 'Step into the camera view' &&
    poseHint !== 'Getting ready...';

  const frameOutlineClass = isPoseValid
    ? 'outline outline-4 outline-[#22c55e] -outline-offset-4 shadow-[inset_0_0_24px_rgba(34,197,94,0.35)]'
    : isPersonInView
    ? 'outline outline-4 outline-[#ef4444] -outline-offset-4 shadow-[inset_0_0_24px_rgba(239,68,68,0.35)]'
    : '';

  const cornerColorClass = isPoseValid
    ? 'border-[#22c55e]'
    : isPersonInView
    ? 'border-[#ef4444]'
    : 'border-primary/80';

  const stepNumber = currentView === 'front' ? 1 : 2;
  const currentViewLabel = currentView === 'front' ? 'Front View' : 'Side View';
  const instructionText =
    currentView === 'front'
      ? 'Stand facing the camera, arms out slightly in an A shape.'
      : 'Turn to your side, arms relaxed by your body.';

  return (
    <div className="relative w-full h-full min-h-screen bg-background text-foreground flex flex-col justify-between max-w-lg mx-auto overflow-hidden select-none font-sans">
      {/* Screen Shutter Flash Overlay */}
      {isScreenFlashing && (
        <div className="absolute inset-0 z-50 bg-white/90 animate-fade-in pointer-events-none" />
      )}

      {/* Real Video Stream Background */}
      {hasCameraStream && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover z-0 opacity-40 brightness-95"
        />
      )}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
      />

      {/* Top Floating Notification */}
      {notification && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-card/90 backdrop-blur-md border border-border px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2 animate-fade-in text-xs font-medium text-foreground">
          <Check className="w-3.5 h-3.5 text-primary" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="px-5 pt-6 pb-2 flex items-center justify-between z-30 w-full">
        {/* Left: Close Button */}
        <button
          type="button"
          onClick={onBack}
          className="w-11 h-11 rounded-full bg-card/80 backdrop-blur-md border border-border flex items-center justify-center text-foreground hover:bg-card transition-all cursor-pointer shadow-xs active:scale-95"
          aria-label="Close capture"
        >
          <X className="w-5 h-5 stroke-[2]" />
        </button>

        {/* Center: Step & View Indicator Badge */}
        <div className="px-4 py-2 rounded-full bg-primary/15 border border-primary/25 backdrop-blur-md flex items-center gap-2 text-xs font-semibold text-primary shadow-xs">
          <span>Step {stepNumber} of 2</span>
          <span className="w-1 h-1 rounded-full bg-primary" />
          <span>{currentViewLabel}</span>
        </div>

        {/* Right: Flash Toggle Button */}
        <button
          type="button"
          onClick={handleToggleFlash}
          className={`w-11 h-11 rounded-full backdrop-blur-md border flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 ${
            isFlashOn
              ? 'bg-primary text-primary-foreground border-primary shadow-primary/30'
              : 'bg-card/80 text-primary border-border hover:bg-card'
          }`}
          aria-label={isFlashOn ? 'Turn off flash' : 'Turn on flash'}
        >
          {isFlashOn ? (
            <Zap className="w-5 h-5 fill-current" />
          ) : (
            <ZapOff className="w-5 h-5 stroke-[2]" />
          )}
        </button>
      </header>

      {/* Instruction Line for each view */}
      <div className="z-20 px-6 py-1 text-center">
        <p className="text-xs font-medium text-foreground/90 bg-card/75 backdrop-blur-md border border-border px-4 py-1.5 rounded-full inline-block shadow-xs">
          {instructionText}
        </p>
      </div>

      {/* Viewfinder Canvas Area with Anatomical Silhouette */}
      <main
        className={`relative flex-1 flex flex-col items-center justify-center overflow-hidden px-4 z-10 my-1 transition-all duration-300 rounded-3xl ${frameOutlineClass}`}
      >
        {/* Corner Brackets */}
        <div
          className={`absolute top-2 left-6 w-9 h-9 border-t-[2.5px] border-l-[2.5px] rounded-tl-2xl pointer-events-none transition-colors duration-300 ${cornerColorClass}`}
        />
        <div
          className={`absolute top-2 right-6 w-9 h-9 border-t-[2.5px] border-r-[2.5px] rounded-tr-2xl pointer-events-none transition-colors duration-300 ${cornerColorClass}`}
        />
        <div
          className={`absolute bottom-24 left-6 w-9 h-9 border-b-[2.5px] border-l-[2.5px] rounded-bl-2xl pointer-events-none transition-colors duration-300 ${cornerColorClass}`}
        />
        <div
          className={`absolute bottom-24 right-6 w-9 h-9 border-b-[2.5px] border-r-[2.5px] rounded-br-2xl pointer-events-none transition-colors duration-300 ${cornerColorClass}`}
        />

        {/* Center Vertical Alignment Line */}
        <div
          className={`absolute inset-y-4 left-1/2 -translate-x-1/2 w-[1px] pointer-events-none transition-colors duration-300 ${
            isPoseValid ? 'bg-emerald-400/70' : 'bg-primary/30'
          }`}
        />

        {/* Dashed Anatomical Silhouette (SVG) */}
        <div className="relative w-full max-w-xs h-[480px] flex items-center justify-center">
          {currentView === 'front' ? (
            /* Front View Dashed Body Contour */
            <svg
              viewBox="0 0 340 560"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`w-full h-full max-h-[490px] select-none pointer-events-none drop-shadow-md transition-colors duration-300 ${
                isPoseValid ? 'text-emerald-400' : 'text-primary'
              }`}
            >
              <line
                x1="170"
                y1="30"
                x2="170"
                y2="530"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeDasharray="4 4"
                className="opacity-40"
              />
              <line x1="135" y1="92" x2="147" y2="92" stroke="currentColor" strokeWidth="2" className="opacity-80" />
              <line x1="193" y1="92" x2="205" y2="92" stroke="currentColor" strokeWidth="2" className="opacity-80" />
              <path
                d="M170 54 C153 54 143 68 143 88 C143 108 153 124 170 124 C187 124 197 108 197 88 C197 68 187 54 170 54 Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeDasharray="5 4"
                className="opacity-85"
              />
              <path
                d="
                  M158 123
                  C157 132 153 138 144 142
                  C132 147 114 156 104 175
                  C95 192 84 225 78 260
                  C72 292 68 335 72 360
                  C73 365 77 368 81 364
                  C84 360 87 348 90 330
                  C95 295 106 255 114 225
                  C118 208 122 195 125 188
                  C127 205 129 235 131 270
                  C133 300 131 328 126 355
                  C120 388 114 430 110 475
                  C108 495 107 518 106 525
                  C109 527 121 528 127 525
                  C129 515 133 480 138 438
                  C143 395 148 355 152 320
                  C156 288 163 260 170 252
                  C177 260 184 288 188 320
                  C192 355 197 395 202 438
                  C207 480 211 515 213 525
                  C219 528 231 527 234 525
                  C233 518 232 495 230 475
                  C226 430 220 388 214 355
                  C209 328 207 300 209 270
                  C211 235 213 205 215 188
                  C218 195 222 208 226 225
                  C234 255 245 295 250 330
                  C253 348 256 360 259 364
                  C263 368 267 365 268 360
                  C272 335 268 292 262 260
                  C256 225 245 192 236 175
                  C226 156 208 147 196 142
                  C187 138 183 132 182 123
                "
                stroke="currentColor"
                strokeWidth="1.8"
                strokeDasharray="5 4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-85"
              />
            </svg>
          ) : (
            /* Side View Dashed Body Profile Contour */
            <svg
              viewBox="0 0 340 560"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`w-full h-full max-h-[490px] select-none pointer-events-none drop-shadow-md transition-colors duration-300 ${
                isPoseValid ? 'text-emerald-400' : 'text-primary'
              }`}
            >
              <line
                x1="170"
                y1="30"
                x2="170"
                y2="530"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeDasharray="4 4"
                className="opacity-40"
              />
              <path
                d="M172 54 C158 54 148 66 146 82 C145 92 140 98 135 102 C140 106 148 108 152 118 C155 125 162 126 170 126 C182 126 192 114 192 90 C192 68 184 54 172 54 Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeDasharray="5 4"
                className="opacity-85"
              />
              <path
                d="
                  M152 126
                  C142 142 136 170 138 205
                  C140 230 148 250 150 270
                  C152 295 148 330 144 370
                  C140 410 138 450 136 490
                  C135 515 130 525 138 526
                  C150 528 165 528 172 525
                  C175 510 176 480 178 440
                  C180 400 184 360 188 320
                  C192 280 196 240 194 200
                  C192 170 185 145 174 130
                  C170 125 168 126 166 126
                "
                stroke="currentColor"
                strokeWidth="1.8"
                strokeDasharray="5 4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-85"
              />
              <path
                d="
                  M164 165
                  C160 190 158 230 156 270
                  C154 300 152 335 154 355
                  C156 360 160 360 162 355
                  C165 335 168 300 170 270
                  C172 230 174 190 172 165
                "
                stroke="currentColor"
                strokeWidth="1.8"
                strokeDasharray="5 4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-70"
              />
            </svg>
          )}

          {/* Hands-Free Countdown Center Overlay */}
          {countdown !== null && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/50 backdrop-blur-xs rounded-3xl animate-fade-in">
              <span className="text-8xl font-black text-primary font-display animate-ping select-none">
                {countdown}
              </span>
            </div>
          )}

          {/* Capturing Processing Spinner */}
          {isCapturing && (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-background/60 backdrop-blur-xs rounded-3xl animate-fade-in">
              <RefreshCw className="w-10 h-10 text-primary animate-spin mb-2" />
              <span className="text-xs font-semibold text-foreground">Processing capture...</span>
            </div>
          )}
        </div>

        {/* Gating Instruction Pill */}
        <div className="mt-auto mb-3 px-5 py-2 rounded-full bg-card/90 backdrop-blur-md border border-border shadow-lg flex items-center gap-3 animate-fade-in z-20">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
              isPoseValid
                ? 'bg-emerald-500/20 text-emerald-400'
                : isPersonInView
                ? 'bg-red-500/20 text-red-400'
                : 'bg-primary/20 text-primary'
            }`}
          >
            {isPoseValid ? (
              <Check className="w-4 h-4 stroke-[2.5]" />
            ) : (
              <User className="w-4 h-4 fill-current" />
            )}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-foreground leading-tight">
              {poseError ? 'Pose detection error' : poseHint}
            </span>
            <span className="text-[11px] text-muted-foreground leading-tight">
              {poseError
                ? poseError
                : isPoseValid
                ? '(Ready to capture)'
                : !isPoseReady
                ? 'Initializing...'
                : '(Full body must be visible)'}
            </span>
          </div>
        </div>
      </main>

      {/* Bottom Sheet / Shutter Bar with Flip & Shutter Controls */}
      <footer className="w-full rounded-t-[32px] bg-card border-t border-border px-8 pt-5 pb-8 flex items-center justify-between shadow-2xl z-30 relative">
        {/* Left: Camera Flip Action */}
        <div className="w-14 flex items-center justify-start">
          <button
            type="button"
            onClick={handleFlipCamera}
            className="w-11 h-11 rounded-2xl bg-secondary/50 hover:bg-secondary border border-border flex flex-col items-center justify-center text-foreground transition-all cursor-pointer shadow-xs active:scale-95 group"
            aria-label="Flip camera"
            title="Flip camera"
          >
            <RefreshCw className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:rotate-180 transition-all duration-300" />
          </button>
        </div>

        {/* Center: Big Double-Ring Shutter Button */}
        <div className="flex-1 flex justify-center">
          <button
            type="button"
            onClick={handleManualShutter}
            disabled={!isPoseValid || isCapturing}
            className={`w-20 h-20 rounded-full border-4 p-1.5 flex items-center justify-center active:scale-95 transition-all cursor-pointer group shadow-lg ${
              isPoseValid
                ? 'border-emerald-500/80 hover:border-emerald-400 shadow-emerald-500/20'
                : 'border-primary/35 opacity-50 cursor-not-allowed shadow-none'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label="Capture photo"
          >
            <div
              className={`w-full h-full rounded-full transition-colors shadow-inner flex items-center justify-center ${
                isPoseValid ? 'bg-emerald-500 group-hover:bg-emerald-400' : 'bg-primary/50'
              }`}
            />
          </button>
        </div>

        {/* Right: Camera icon badge */}
        <div className="w-14 flex items-center justify-end">
          <div className="w-11 h-11 rounded-2xl bg-secondary/30 border border-border flex items-center justify-center text-muted-foreground">
            <Camera className="w-4 h-4" />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CameraCaptureScreen;
