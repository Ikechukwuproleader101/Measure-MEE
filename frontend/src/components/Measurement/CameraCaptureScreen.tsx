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
  Upload,
  Edit2,
  FileImage,
} from 'lucide-react';
import { usePoseValidation } from '../../features/capture/usePoseValidation';
import { validateAPose } from '../../features/capture/validateAPose';
import { validateSidePose } from '../../features/capture/validateSidePose';
import { COUNTDOWN_SECONDS } from '../../features/capture/poseConstants';
import { guideState } from '../../features/capture/guideState';
import { parsePoseDebug } from '../../features/capture/poseGuide';
import { PoseGuideOverlay } from '../../features/capture/PoseGuideOverlay';
import { captureFrame, processUploadedImage } from '../../features/capture/captureFrame';
import {
  captureReducer,
  INITIAL_CAPTURE_STATE,
  setHeightAction,
  goToStepAction,
  startCameraAction,
  setCaptureAction,
  cancelCameraAction,
  startAnalysisAction,
  resetAction,
} from '../../features/capture/captureSession';
import { validateHeight } from '../../features/capture/heightValidation';
import { ProcessingScreen } from './ProcessingScreen';

interface CameraCaptureScreenProps {
  onBack: () => void;
  onCaptured: () => void;
}

export const CameraCaptureScreen: React.FC<CameraCaptureScreenProps> = ({
  onBack,
  onCaptured,
}) => {
  const [session, dispatch] = useReducer(captureReducer, INITIAL_CAPTURE_STATE);

  // Height step local state
  const [heightInput, setHeightInput] = useState<string>(
    session.heightCm ? String(session.heightCm) : ''
  );
  const [heightError, setHeightError] = useState<string | null>(null);

  // Upload state
  const [uploadTargetView, setUploadTargetView] = useState<'front' | 'side' | null>(null);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Analysis result holder for Done screen
  const [analysisResult, setAnalysisResult] = useState<any>(null);

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
  const cameraContainerRef = useRef<HTMLDivElement | null>(null);

  const isCameraActive = session.step === 'camera';
  const activeCameraView = session.cameraView || 'front';
  const activeValidator = activeCameraView === 'front' ? validateAPose : validateSidePose;
  const isDebugPose = typeof window !== 'undefined' ? parsePoseDebug(window.location) : false;

  // Real-time on-device MediaPipe Pose detection (only active during camera step)
  const {
    isValid: isPoseValid,
    hint: poseHint,
    isReady: isPoseReady,
    error: poseError,
    personVisible,
  } = usePoseValidation({
    videoRef,
    canvasRef,
    enabled: isCameraActive && hasCameraStream && !isCapturing,
    validator: activeValidator,
    showSkeleton: isDebugPose,
  });

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 2800);
  };

  // 1. Initialize and clean up getUserMedia stream only during camera step
  useEffect(() => {
    let isMounted = true;

    if (!isCameraActive) {
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
  }, [isCameraActive, facingMode]);

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

  // Execute frame capture using unmirrored IMAGE mode landmarker
  const executeCapture = useCallback(async () => {
    if (!videoRef.current || isCapturing) return;

    setIsCapturing(true);
    setIsScreenFlashing(true);
    setTimeout(() => setIsScreenFlashing(false), 200);

    const result = await captureFrame({
      video: videoRef.current,
      view: activeCameraView,
      validator: activeValidator,
    });

    if ('error' in result) {
      showNotification(result.error);
      setIsCapturing(false);
    } else {
      dispatch(setCaptureAction(activeCameraView, result));
      setIsCapturing(false);
    }
  }, [activeCameraView, activeValidator, isCapturing]);

  // Hands-free capture countdown (3 -> 2 -> 1 -> capture at 0)
  useEffect(() => {
    if (!isCameraActive || isCapturing) {
      setCountdown(null);
      return;
    }

    if (isPoseValid) {
      if (countdown === null) {
        setCountdown(COUNTDOWN_SECONDS);
      }
    } else {
      if (countdown !== null) {
        setCountdown(null);
      }
    }
  }, [isCameraActive, isPoseValid, isCapturing, countdown]);

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

  // Upload handlers
  const handleOpenPicker = (view: 'front' | 'side') => {
    setUploadTargetView(view);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetView) return;

    setIsProcessingUpload(true);
    const validator = uploadTargetView === 'front' ? validateAPose : validateSidePose;
    const result = await processUploadedImage({
      file,
      view: uploadTargetView,
      validator,
    });
    setIsProcessingUpload(false);

    if ('error' in result) {
      showNotification(result.error);
    } else {
      dispatch(setCaptureAction(uploadTargetView, result));
    }

    e.target.value = '';
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
    // If photos already exist (edited height from hub), return directly to hub
    if (session.front || session.side) {
      dispatch(goToStepAction('hub'));
    } else {
      dispatch(goToStepAction('prep'));
    }
  };

  // ==========================================
  // Render Step 1: Height Entry
  // ==========================================
  if (session.step === 'height') {
    const check = validateHeight(heightInput);
    const canContinue = check.valid;

    return (
      <div className="relative w-full min-h-screen bg-background text-foreground flex flex-col justify-between max-w-lg mx-auto p-6 font-sans">
        <header className="flex items-center justify-between pt-2 pb-4">
          <button
            type="button"
            onClick={session.front || session.side ? () => dispatch(goToStepAction('hub')) : onBack}
            className="w-10 h-10 rounded-full bg-secondary/80 border border-border flex items-center justify-center text-foreground hover:bg-secondary transition-all cursor-pointer shadow-xs active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            Height Entry
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

  // ==========================================
  // Render Step 2: Get-Ready Tips (prep)
  // ==========================================
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
            Preparation
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

          <div className="mt-4 min-h-[16px] text-[10px] text-muted-foreground text-center" />

          <button
            type="button"
            onClick={() => dispatch(goToStepAction('hub'))}
            className="w-full mt-6 h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm tracking-wide transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>I'm ready</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </main>

        <footer className="text-center pb-2 text-[11px] text-muted-foreground">
          Step 2 of 4
        </footer>
      </div>
    );
  }

  // ==========================================
  // Render Step 3: Photo Hub (PhotoHub)
  // ==========================================
  if (session.step === 'hub') {
    const isFrontFilled = !!session.front;
    const isSideFilled = !!session.side;
    const isFrontValid = session.front ? session.front.valid !== false : false;
    const isSideValid = session.side ? session.side.valid !== false : false;
    const canAnalyze = isFrontFilled && isSideFilled && isFrontValid && isSideValid;

    return (
      <div className="relative w-full min-h-screen bg-background text-foreground flex flex-col justify-between max-w-lg mx-auto p-6 font-sans">
        {/* Hidden Device File Picker */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          onChange={handleFileChange}
          className="hidden"
          aria-hidden="true"
        />

        {/* Top Notification Toast */}
        {notification && (
          <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 bg-card/95 backdrop-blur-md border border-border px-4 py-2 rounded-full shadow-xl flex items-center gap-2 text-xs font-semibold text-foreground animate-fade-in">
            <AlertCircle className="w-4 h-4 text-primary" />
            <span>{notification}</span>
          </div>
        )}

        {/* Processing Upload Modal */}
        {isProcessingUpload && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xs">
            <RefreshCw className="w-10 h-10 text-primary animate-spin mb-3" />
            <span className="text-xs font-bold text-foreground">Processing uploaded photo...</span>
            <span className="text-[11px] text-muted-foreground mt-1">Analyzing pose and silhouette</span>
          </div>
        )}

        {/* Top Header */}
        <header className="flex items-center justify-between pt-1 pb-3">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-secondary/80 border border-border flex items-center justify-center text-foreground hover:bg-secondary transition-all cursor-pointer shadow-xs active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <h1 className="font-display font-bold text-lg text-foreground">Your photos</h1>

          <button
            type="button"
            onClick={() => dispatch(resetAction())}
            className="w-10 h-10 rounded-full bg-secondary/80 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer shadow-xs active:scale-95"
            title="Reset flow"
            aria-label="Reset flow"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </header>

        {/* Height Confirmation with Edit Link (does not lose photos) */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-card border border-border shadow-xs mt-1 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Ruler className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-foreground">
                Height: <span className="text-primary font-black">{session.heightCm || 175} cm</span>
              </span>
              <span className="text-[10px] text-muted-foreground">Used to calibrate scale</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => dispatch(goToStepAction('height'))}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer px-2.5 py-1 rounded-lg hover:bg-primary/10 transition-colors"
          >
            <Edit2 className="w-3 h-3" />
            <span>Edit</span>
          </button>
        </div>

        {/* Two Photo Cards (Front & Side) */}
        <main className="flex-1 flex flex-col gap-4 overflow-y-auto py-1">
          {/* Card 1: Front Photo Card */}
          <div className="rounded-3xl bg-card border border-border p-4 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Front Photo
                </span>
                {session.front && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground font-semibold">
                    {session.front.source === 'camera' ? 'Camera' : 'Uploaded'}
                  </span>
                )}
              </div>

              {session.front && (
                <div
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
                    isFrontValid
                      ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/25'
                      : 'bg-destructive/15 text-destructive border border-destructive/25'
                  }`}
                >
                  {isFrontValid ? (
                    <>
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Looks good</span>
                    </>
                  ) : (
                    <>
                      <X className="w-3 h-3 stroke-[3]" />
                      <span className="truncate max-w-[140px]">
                        {session.front.validationError || 'Invalid pose'}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Photo Box: Empty or Filled */}
            {!session.front ? (
              <div className="w-full h-56 rounded-2xl border-2 border-dashed border-border/80 bg-background/50 flex flex-col items-center justify-center p-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground mb-3">
                  <User className="w-6 h-6" />
                </div>
                <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                  Face the camera, arms out slightly like an A.
                </p>
                <div className="flex items-center gap-2.5 mt-4 w-full max-w-xs">
                  <button
                    type="button"
                    onClick={() => dispatch(startCameraAction('front'))}
                    className="flex-1 h-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Take photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenPicker('front')}
                    className="flex-1 h-10 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-primary" />
                    <span>Upload</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="w-full h-60 rounded-2xl bg-black/40 border border-border overflow-hidden flex items-center justify-center">
                  <img
                    src={session.front.previewUrl}
                    alt="Front capture"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex items-center gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => dispatch(startCameraAction('front'))}
                    className="flex-1 h-9 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retake</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenPicker('front')}
                    className="flex-1 h-9 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <FileImage className="w-3.5 h-3.5 text-primary" />
                    <span>Replace</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Side Photo Card */}
          <div className="rounded-3xl bg-card border border-border p-4 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Side Photo
                </span>
                {session.side && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground font-semibold">
                    {session.side.source === 'camera' ? 'Camera' : 'Uploaded'}
                  </span>
                )}
              </div>

              {session.side && (
                <div
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
                    isSideValid
                      ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/25'
                      : 'bg-destructive/15 text-destructive border border-destructive/25'
                  }`}
                >
                  {isSideValid ? (
                    <>
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Looks good</span>
                    </>
                  ) : (
                    <>
                      <X className="w-3 h-3 stroke-[3]" />
                      <span className="truncate max-w-[140px]">
                        {session.side.validationError || 'Invalid pose'}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Photo Box: Empty or Filled */}
            {!session.side ? (
              <div className="w-full h-56 rounded-2xl border-2 border-dashed border-border/80 bg-background/50 flex flex-col items-center justify-center p-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground mb-3">
                  <User className="w-6 h-6 -scale-x-100" />
                </div>
                <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                  Turn to your side, arms relaxed.
                </p>
                <div className="flex items-center gap-2.5 mt-4 w-full max-w-xs">
                  <button
                    type="button"
                    onClick={() => dispatch(startCameraAction('side'))}
                    className="flex-1 h-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Take photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenPicker('side')}
                    className="flex-1 h-10 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-primary" />
                    <span>Upload</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="w-full h-60 rounded-2xl bg-black/40 border border-border overflow-hidden flex items-center justify-center">
                  <img
                    src={session.side.previewUrl}
                    alt="Side capture"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex items-center gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => dispatch(startCameraAction('side'))}
                    className="flex-1 h-9 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retake</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenPicker('side')}
                    className="flex-1 h-9 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <FileImage className="w-3.5 h-3.5 text-primary" />
                    <span>Replace</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <p className="text-center text-[11px] text-muted-foreground mt-1">
            Use fitted clothes and a photo where your whole body is visible.
          </p>
        </main>

        {/* Analyze Button */}
        <footer className="w-full pt-4 pb-2">
          <button
            type="button"
            disabled={!canAnalyze}
            onClick={() => dispatch(startAnalysisAction())}
            className="w-full h-13 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm tracking-wide shadow-lg shadow-primary/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4" />
            <span>Analyze my measurements</span>
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </button>
        </footer>
      </div>
    );
  }

  // ==========================================
  // Render Step 4: Camera Viewfinder
  // ==========================================
  if (session.step === 'camera') {
    const isPersonInView = personVisible && !isPoseValid;
    const currentGuideState = guideState({ personVisible, isValid: isPoseValid });

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

    const viewTitle = activeCameraView === 'front' ? 'Front View' : 'Side View';
    const instructionText =
      activeCameraView === 'front'
        ? 'Stand facing the camera, arms out slightly in an A shape.'
        : 'Turn to your side, arms relaxed by your body.';

    return (
      <div
        ref={cameraContainerRef}
        className="relative w-full h-full min-h-screen bg-background text-foreground flex flex-col justify-between max-w-lg mx-auto overflow-hidden select-none font-sans"
      >
        {isScreenFlashing && (
          <div className="absolute inset-0 z-50 bg-white/90 animate-fade-in pointer-events-none" />
        )}

        {/* Video feed */}
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

        {/* Fixed Silhouette Guide */}
        <PoseGuideOverlay
          state={currentGuideState}
          viewMode={activeCameraView}
          containerRef={cameraContainerRef}
          videoRef={videoRef}
        />

        {notification && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-card/90 backdrop-blur-md border border-border px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2 animate-fade-in text-xs font-medium text-foreground">
            <Check className="w-3.5 h-3.5 text-primary" />
            <span>{notification}</span>
          </div>
        )}

        {/* Top Header: Cancel Button returns to hub */}
        <header className="px-5 pt-6 pb-2 flex items-center justify-between z-30 w-full">
          <button
            type="button"
            onClick={() => dispatch(cancelCameraAction())}
            className="w-11 h-11 rounded-full bg-card/80 backdrop-blur-md border border-border flex items-center justify-center text-foreground hover:bg-card transition-all cursor-pointer shadow-xs active:scale-95"
            aria-label="Cancel camera"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2]" />
          </button>

          <div className="px-4 py-2 rounded-full bg-primary/15 border border-primary/25 backdrop-blur-md flex items-center gap-2 text-xs font-semibold text-primary shadow-xs">
            <span>{viewTitle}</span>
          </div>

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
            {isFlashOn ? <Zap className="w-5 h-5 fill-current" /> : <ZapOff className="w-5 h-5 stroke-[2]" />}
          </button>
        </header>

        {/* Short Instruction Banner */}
        <div className="z-20 px-6 py-1 text-center">
          <p className="text-xs font-medium text-foreground/90 bg-card/75 backdrop-blur-md border border-border px-4 py-1.5 rounded-full inline-block shadow-xs">
            {instructionText}
          </p>
        </div>

        {/* Viewfinder Canvas Area with Silhouette */}
        <main
          className={`relative flex-1 flex flex-col items-center justify-center overflow-hidden px-4 z-10 my-1 transition-all duration-300 rounded-3xl ${frameOutlineClass}`}
        >
          {/* Corner Brackets */}
          <div className={`absolute top-2 left-6 w-9 h-9 border-t-[2.5px] border-l-[2.5px] rounded-tl-2xl pointer-events-none transition-colors duration-300 ${cornerColorClass}`} />
          <div className={`absolute top-2 right-6 w-9 h-9 border-t-[2.5px] border-r-[2.5px] rounded-tr-2xl pointer-events-none transition-colors duration-300 ${cornerColorClass}`} />
          <div className={`absolute bottom-24 left-6 w-9 h-9 border-b-[2.5px] border-l-[2.5px] rounded-bl-2xl pointer-events-none transition-colors duration-300 ${cornerColorClass}`} />
          <div className={`absolute bottom-24 right-6 w-9 h-9 border-b-[2.5px] border-r-[2.5px] rounded-br-2xl pointer-events-none transition-colors duration-300 ${cornerColorClass}`} />

          {/* Center Vertical Line */}
          <div className={`absolute inset-y-4 left-1/2 -translate-x-1/2 w-[1px] pointer-events-none transition-colors duration-300 ${isPoseValid ? 'bg-emerald-400/70' : 'bg-primary/30'}`} />

          {/* Countdown & Spinner Overlays */}
          <div className="relative w-full max-w-xs h-[480px] flex items-center justify-center pointer-events-none">
            {/* Countdown Overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/50 backdrop-blur-xs rounded-3xl animate-fade-in pointer-events-auto">
                <span className="text-8xl font-black text-primary font-display animate-ping select-none">
                  {countdown}
                </span>
              </div>
            )}

            {/* Capturing Spinner */}
            {isCapturing && (
              <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-background/60 backdrop-blur-xs rounded-3xl animate-fade-in pointer-events-auto">
                <RefreshCw className="w-10 h-10 text-primary animate-spin mb-2" />
                <span className="text-xs font-semibold text-foreground">Capturing photo...</span>
              </div>
            )}
          </div>

          {/* Pose Gating Pill */}
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
              {isPoseValid ? <Check className="w-4 h-4 stroke-[2.5]" /> : <User className="w-4 h-4 fill-current" />}
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

        {/* Shutter Bar */}
        <footer className="w-full rounded-t-[32px] bg-card border-t border-border px-8 pt-5 pb-8 flex items-center justify-between shadow-2xl z-30 relative">
          <div className="w-14 flex items-center justify-start">
            <button
              type="button"
              onClick={handleFlipCamera}
              className="w-11 h-11 rounded-2xl bg-secondary/50 hover:bg-secondary border border-border flex flex-col items-center justify-center text-foreground transition-all cursor-pointer shadow-xs active:scale-95 group"
              aria-label="Flip camera"
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:rotate-180 transition-all duration-300" />
            </button>
          </div>

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

          <div className="w-14 flex items-center justify-end">
            <div className="w-11 h-11 rounded-2xl bg-secondary/30 border border-border flex items-center justify-center text-muted-foreground">
              <Camera className="w-4 h-4" />
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // ==========================================
  // Render Step 5: Analyzing Screen (revamped)
  // ==========================================
  if (session.step === 'analyzing') {
    return (
      <ProcessingScreen
        heightCm={session.heightCm}
        front={session.front}
        side={session.side}
        onBackToPhotos={() => dispatch(goToStepAction('hub'))}
        onComplete={(res) => {
          setAnalysisResult(res);
          dispatch(goToStepAction('done'));
        }}
      />
    );
  }

  // ==========================================
  // Render Step 6: Done Screen
  // ==========================================
  if (session.step === 'done') {
    return (
      <div className="relative w-full min-h-screen bg-background text-foreground flex flex-col justify-between max-w-lg mx-auto p-6 font-sans">
        <header className="flex items-center justify-between pt-2 pb-2">
          <button
            type="button"
            onClick={() => dispatch(goToStepAction('hub'))}
            className="w-10 h-10 rounded-full bg-secondary/80 border border-border flex items-center justify-center text-foreground hover:bg-secondary transition-all cursor-pointer shadow-xs active:scale-95"
            aria-label="Back to hub"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-xs font-semibold text-emerald-500">
            Analysis Complete
          </div>
          <div className="w-10" />
        </header>

        <main className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full py-4 text-center">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-500 mb-4 shadow-inner">
            <Check className="w-8 h-8 stroke-[2.5]" />
          </div>

          <h1 className="text-2xl font-bold text-foreground tracking-tight">Your photos are ready</h1>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-xs leading-relaxed">
            Measurement calculation is the next step to be added.
          </p>

          <div className="mt-3 px-3 py-1 rounded-full bg-secondary border border-border text-xs font-medium text-foreground">
            Height: <span className="font-bold text-primary">{session.heightCm} cm</span>
          </div>

          {/* Computed Scale Info */}
          {analysisResult && (
            <div className="flex flex-col gap-1 mt-3 px-4 py-2 rounded-2xl bg-card border border-border text-[11px] text-muted-foreground">
              {analysisResult.frontScale && (
                <span>
                  Front scale:{' '}
                  <span className="font-bold text-foreground">
                    {analysisResult.frontScale.toFixed(4)} cm per pixel
                  </span>
                </span>
              )}
              {analysisResult.sideScale && (
                <span>
                  Side scale:{' '}
                  <span className="font-bold text-foreground">
                    {analysisResult.sideScale.toFixed(4)} cm per pixel
                  </span>
                </span>
              )}
            </div>
          )}

          {/* Thumbnails of both photos */}
          <div className="grid grid-cols-2 gap-3.5 w-full mt-5">
            <div className="flex flex-col items-center p-2.5 rounded-2xl bg-card border border-border shadow-xs">
              <span className="text-[11px] font-bold text-muted-foreground mb-2">Front View</span>
              <div className="w-full h-36 rounded-xl bg-black/40 overflow-hidden border border-border/60">
                {session.front?.previewUrl && (
                  <img
                    src={session.front.previewUrl}
                    alt="Front view"
                    className="w-full h-full object-contain"
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
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            </div>
          </div>

          {/* NEXT: measurement engine goes here */}

          <button
            type="button"
            onClick={onCaptured}
            className="w-full mt-8 h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm tracking-wide transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Proceed to Dashboard</span>
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
          All processing completed 100% on-device
        </footer>
      </div>
    );
  }

  return null;
};

export default CameraCaptureScreen;
