import React, { useState, useEffect, useRef } from 'react';
import { X, Zap, ZapOff, User, Image as ImageIcon, RefreshCw, Check } from 'lucide-react';
import { usePoseValidation } from '../../features/capture/usePoseValidation';

interface CameraCaptureScreenProps {
  onBack: () => void;
  onCaptured: () => void;
}

export const CameraCaptureScreen: React.FC<CameraCaptureScreenProps> = ({
  onBack,
  onCaptured
}) => {
  const [viewMode, setViewMode] = useState<'front' | 'side'>('front');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isScreenFlashing, setIsScreenFlashing] = useState(false);
  const [capturedViews, setCapturedViews] = useState<{ front: boolean; side: boolean }>({
    front: false,
    side: false
  });
  const [hasCameraStream, setHasCameraStream] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Real-time on-device MediaPipe Pose detection & A-pose validation
  const {
    isValid: isPoseValid,
    hint: poseHint,
    isReady: isPoseReady,
    error: poseError,
  } = usePoseValidation({
    videoRef,
    canvasRef,
    enabled: hasCameraStream,
  });

  const isPersonInView = isPoseReady && !isPoseValid && poseHint !== 'Step into the camera view' && poseHint !== 'Getting ready...';
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

  // Initialize webcam feed if supported
  useEffect(() => {
    let isMounted = true;

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
            height: { ideal: 720 }
          },
          audio: false
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
  }, [facingMode]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 2400);
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

  const handleTrigger = () => {
    if (!isPoseValid || countdown !== null) return;
    setCountdown(3);
  };

  const executeCapture = () => {
    if (!isPoseValid) return;
    // Trigger shutter screen flash
    setIsScreenFlashing(true);
    setTimeout(() => setIsScreenFlashing(false), 200);

    if (viewMode === 'front') {
      const nextViews = { ...capturedViews, front: true };
      setCapturedViews(nextViews);

      if (!nextViews.side) {
        showNotification('Front view saved! Turn for Side view');
        setViewMode('side');
      } else {
        showNotification('All views captured!');
        setTimeout(onCaptured, 600);
      }
    } else {
      const nextViews = { ...capturedViews, side: true };
      setCapturedViews(nextViews);

      if (!nextViews.front) {
        showNotification('Side view saved! Turn for Front view');
        setViewMode('front');
      } else {
        showNotification('All views captured!');
        setTimeout(onCaptured, 600);
      }
    }
  };

  // Countdown timer effect
  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 700);
      return () => clearTimeout(timer);
    } else {
      setCountdown(null);
      executeCapture();
    }
  }, [countdown]);

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      showNotification('Photo imported from gallery');
      setTimeout(onCaptured, 700);
    }
  };

  const stepNumber = viewMode === 'front' ? 1 : 2;
  const currentViewLabel = viewMode === 'front' ? 'Front View' : 'Side View';

  return (
    <div className="relative w-full h-full min-h-screen bg-background text-foreground flex flex-col justify-between max-w-lg mx-auto overflow-hidden select-none font-sans">
      {/* Hidden File Input for Gallery */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Screen Shutter Flash Overlay */}
      {isScreenFlashing && (
        <div className="absolute inset-0 z-50 bg-white/90 animate-fade-in pointer-events-none" />
      )}

      {/* Real Video Stream Background (if available) */}
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
          className="w-11 h-11 rounded-full bg-card/80 backdrop-blur-md border border-border flex items-center justify-center text-foreground hover:bg-card transition-all cursor-pointer shadow-sm active:scale-95"
          aria-label="Close capture"
        >
          <X className="w-5 h-5 stroke-[2]" />
        </button>

        {/* Center: Step & View Indicator Badge */}
        <div className="px-4 py-2 rounded-full bg-primary/15 border border-primary/25 backdrop-blur-md flex items-center gap-2 text-xs font-semibold text-primary shadow-sm">
          <span>Step {stepNumber} of 2</span>
          <span className="w-1 h-1 rounded-full bg-primary" />
          <span>{currentViewLabel}</span>
        </div>

        {/* Right: Flash Toggle Button */}
        <button
          type="button"
          onClick={handleToggleFlash}
          className={`w-11 h-11 rounded-full backdrop-blur-md border flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 ${
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

      {/* Viewfinder Canvas Area with Anatomical Silhouette */}
      <main className={`relative flex-1 flex flex-col items-center justify-center overflow-hidden px-4 z-10 my-1 transition-all duration-300 rounded-3xl ${frameOutlineClass}`}>
        {/* Corner Brackets */}
        <div className={`absolute top-2 left-6 w-9 h-9 border-t-[2.5px] border-l-[2.5px] rounded-tl-2xl pointer-events-none transition-colors duration-300 ${cornerColorClass}`} />
        <div className={`absolute top-2 right-6 w-9 h-9 border-t-[2.5px] border-r-[2.5px] rounded-tr-2xl pointer-events-none transition-colors duration-300 ${cornerColorClass}`} />
        <div className={`absolute bottom-24 left-6 w-9 h-9 border-b-[2.5px] border-l-[2.5px] rounded-bl-2xl pointer-events-none transition-colors duration-300 ${cornerColorClass}`} />
        <div className={`absolute bottom-24 right-6 w-9 h-9 border-b-[2.5px] border-r-[2.5px] rounded-br-2xl pointer-events-none transition-colors duration-300 ${cornerColorClass}`} />

        {/* Center Vertical Hairline Alignment Line */}
        <div className={`absolute inset-y-4 left-1/2 -translate-x-1/2 w-[1px] pointer-events-none transition-colors duration-300 ${isPoseValid ? 'bg-emerald-400/70' : 'bg-primary/30'}`} />

        {/* Dashed Anatomical Silhouette (SVG) */}
        <div className="relative w-full max-w-xs h-[480px] flex items-center justify-center">
          {viewMode === 'front' ? (
            /* Front View Dashed Body Contour */
            <svg
              viewBox="0 0 340 560"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`w-full h-full max-h-[490px] select-none pointer-events-none drop-shadow-md transition-colors duration-300 ${isPoseValid ? 'text-emerald-400' : 'text-primary'}`}
            >
              {/* Center vertical reference line */}
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

              {/* Shoulder level horizontal tick marks */}
              <line x1="135" y1="92" x2="147" y2="92" stroke="currentColor" strokeWidth="2" className="opacity-80" />
              <line x1="193" y1="92" x2="205" y2="92" stroke="currentColor" strokeWidth="2" className="opacity-80" />

              {/* Head Outline (dashed oval) */}
              <path
                d="M170 54 C153 54 143 68 143 88 C143 108 153 124 170 124 C187 124 197 108 197 88 C197 68 187 54 170 54 Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeDasharray="5 4"
                className="opacity-85"
              />

              {/* Neck & Body Contour (dashed outline) */}
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
              className="w-full h-full max-h-[490px] select-none pointer-events-none drop-shadow-md text-primary"
            >
              {/* Center vertical reference line */}
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

              {/* Head Profile (dashed) */}
              <path
                d="M172 54 C158 54 148 66 146 82 C145 92 140 98 135 102 C140 106 148 108 152 118 C155 125 162 126 170 126 C182 126 192 114 192 90 C192 68 184 54 172 54 Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeDasharray="5 4"
                className="opacity-85"
              />

              {/* Body Contour Profile (dashed) */}
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

              {/* Arm in Profile along side */}
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

          {/* Countdown Center Overlay */}
          {countdown !== null && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/50 backdrop-blur-xs rounded-3xl animate-fade-in">
              <span className="text-8xl font-black text-primary font-display animate-ping select-none">
                {countdown}
              </span>
            </div>
          )}
        </div>

        {/* Gating Instruction Pill */}
        <div className="mt-auto mb-3 px-5 py-2 rounded-full bg-card/90 backdrop-blur-md border border-border shadow-lg flex items-center gap-3 animate-fade-in z-20">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
            isPoseValid
              ? 'bg-emerald-500/20 text-emerald-400'
              : isPersonInView
              ? 'bg-red-500/20 text-red-400'
              : 'bg-primary/20 text-primary'
          }`}>
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

        {/* Front / Side View Switcher Segmented Control */}
        <div 
          className="mb-2 p-1 rounded-full bg-card/90 backdrop-blur-md border border-border shadow-md flex items-center gap-1 z-20"
          role="tablist"
          aria-label="Capture view angle"
        >
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'front'}
            onClick={() => setViewMode('front')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'front'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="w-3.5 h-3.5 fill-current" />
            <span>Front</span>
            {capturedViews.front && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground ml-0.5" />
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'side'}
            onClick={() => setViewMode('side')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'side'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="w-3.5 h-3.5 -scale-x-100 fill-current" />
            <span>Side</span>
            {capturedViews.side && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground ml-0.5" />
            )}
          </button>
        </div>
      </main>

      {/* Bottom Sheet / Shutter Bar with Gallery & Camera Controls */}
      <footer className="w-full rounded-t-[32px] bg-card border-t border-border px-8 pt-5 pb-8 flex items-center justify-between shadow-2xl z-30 relative">
        {/* Left: Camera Flip Action */}
        <div className="w-14 flex items-center justify-start">
          <button
            type="button"
            onClick={handleFlipCamera}
            className="w-11 h-11 rounded-2xl bg-secondary/50 hover:bg-secondary border border-border flex flex-col items-center justify-center text-foreground transition-all cursor-pointer shadow-sm active:scale-95 group"
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
            onClick={handleTrigger}
            disabled={!isPoseValid || countdown !== null}
            className={`w-20 h-20 rounded-full border-4 p-1.5 flex items-center justify-center active:scale-95 transition-all cursor-pointer group shadow-lg ${
              isPoseValid
                ? 'border-emerald-500/80 hover:border-emerald-400 shadow-emerald-500/20'
                : 'border-primary/35 opacity-50 cursor-not-allowed shadow-none'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label="Capture photo"
          >
            <div className={`w-full h-full rounded-full transition-colors shadow-inner flex items-center justify-center ${
              isPoseValid ? 'bg-emerald-500 group-hover:bg-emerald-400' : 'bg-primary/50'
            }`} />
          </button>
        </div>

        {/* Right: Gallery Button */}
        <div className="w-14 flex items-center justify-end">
          <button
            type="button"
            onClick={handleGalleryClick}
            className="w-14 h-14 rounded-2xl bg-secondary/50 hover:bg-secondary border border-border flex flex-col items-center justify-center gap-1 text-foreground transition-all cursor-pointer shadow-sm active:scale-95 group"
            aria-label="Pick photo from gallery"
          >
            <ImageIcon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-semibold text-muted-foreground leading-none">
              Gallery
            </span>
          </button>
        </div>
      </footer>
    </div>
  );
};
