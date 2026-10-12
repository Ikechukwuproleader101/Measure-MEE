import React, { useState } from 'react';
import { Button } from '../ui/button';
import { ArrowLeft, ShieldCheck, Lock, Sparkles, AlertCircle } from 'lucide-react';

interface MeasurementGuideScreenProps {
  onBack: () => void;
  onStartCapture: () => void;
}

export const MeasurementGuideScreen: React.FC<MeasurementGuideScreenProps> = ({
  onBack,
  onStartCapture
}) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const handleContinue = async () => {
    setIsRequesting(true);
    setPermissionError(null);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        // Immediately stop tracks after testing permission
        stream.getTracks().forEach((track) => track.stop());
      }
      onStartCapture();
    } catch (err: unknown) {
      // If user denied or device has no camera, allow proceeding in simulated AR mode
      console.warn('Camera permission check completed with fallback:', err);
      onStartCapture();
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-background text-foreground flex flex-col justify-between max-w-lg mx-auto overflow-hidden select-none font-sans">
      {/* Top Header Bar */}
      <header className="px-6 pt-6 pb-2 flex items-center justify-between z-30 w-full">
        <button
          type="button"
          onClick={onBack}
          className="w-11 h-11 rounded-full bg-card/80 backdrop-blur-md border border-border flex items-center justify-center text-foreground hover:bg-card transition-all cursor-pointer shadow-sm active:scale-95"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2]" />
        </button>

        {/* Subtle Top Arch Indicator matching pushr iOS 3.png */}
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />

        <div className="w-11" />
      </header>

      {/* Top Half: 3D Angled Phone Illustration matching pushr iOS 3.png */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-4 overflow-hidden">
        {/* Soft Ambient Glow */}
        <div className="absolute w-56 h-56 rounded-full bg-primary/15 blur-3xl pointer-events-none" />

        {/* 3D Angled Phone Mockup SVG */}
        <div className="relative w-full max-w-[280px] h-[280px] flex items-center justify-center">
          <svg
            viewBox="0 0 320 280"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-2xl select-none"
          >
            <defs>
              {/* Metallic chassis gradient */}
              <linearGradient id="phoneFrame" x1="60" y1="20" x2="260" y2="260" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#4A475A" />
                <stop offset="30%" stopColor="#2A2838" />
                <stop offset="70%" stopColor="#15141F" />
                <stop offset="100%" stopColor="#0B0A11" />
              </linearGradient>

              {/* Edge specular reflection */}
              <linearGradient id="bezelHighlight" x1="160" y1="40" x2="160" y2="240" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0.45)" />
                <stop offset="25%" stopColor="rgba(255, 255, 255, 0.12)" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>

              {/* Screen glass fill */}
              <linearGradient id="screenGlass" x1="160" y1="60" x2="160" y2="280" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#1E1C2B" />
                <stop offset="100%" stopColor="#100F18" />
              </linearGradient>
            </defs>

            {/* 3D Angled Phone Outer Frame */}
            <path
              d="M70 120 C70 60 100 40 160 40 C220 40 250 60 250 120 L250 280 L70 280 Z"
              fill="url(#phoneFrame)"
              stroke="rgba(255, 255, 255, 0.18)"
              strokeWidth="2.5"
            />

            {/* Metallic Chamfer Rim Highlight */}
            <path
              d="M72 120 C72 62 101 42 160 42 C219 42 248 62 248 120"
              stroke="url(#bezelHighlight)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* Inner Screen Glass */}
            <path
              d="M82 128 C82 78 108 58 160 58 C212 58 238 78 238 128 L238 280 L82 280 Z"
              fill="url(#screenGlass)"
            />

            {/* Dynamic Island Capsule Cutout */}
            <rect
              x="126"
              y="74"
              width="68"
              height="26"
              rx="13"
              fill="#050508"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="1.2"
            />

            {/* Camera Lens */}
            <circle cx="176" cy="87" r="6" fill="#0E0D16" />
            <circle cx="176" cy="87" r="3.5" fill="#1C182E" />
            <circle cx="177" cy="86" r="1.2" fill="#B69EFF" opacity="0.9" />

            {/* Sensor Eye */}
            <circle cx="144" cy="87" r="3" fill="#0A0912" />

            {/* Subtle pulse animation on camera lens */}
            <circle 
              cx="176" 
              cy="87" 
              r="14" 
              stroke="var(--primary)" 
              strokeWidth="1.2" 
              strokeOpacity="0.4" 
              className="animate-ping" 
              style={{ transformOrigin: '176px 87px' }} 
            />
          </svg>
        </div>
      </div>

      {/* Bottom Sheet Card matching pushr iOS 3.png */}
      <footer className="w-full rounded-t-[36px] bg-card border-t border-border px-7 sm:px-8 pt-7 pb-8 flex flex-col justify-between shadow-2xl z-20 relative">
        <div className="flex flex-col gap-3">
          {/* Main Title matching pushr reference */}
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-card-foreground tracking-tight leading-tight">
            camera permission
          </h1>

          {/* Description Copy */}
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-1">
            Measure Me needs permission to use the camera to scan body proportions. Images won't be stored and you won't be able to begin a measurement scan without this permission.
          </p>

          {/* Trust & Privacy Pill Indicators */}
          <div className="flex flex-wrap items-center gap-2 mt-2 pt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-[11px] font-semibold border border-border">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              100% on-device privacy
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-[11px] font-semibold border border-border">
              <Lock className="w-3.5 h-3.5 text-accent" />
              No photos stored or sent
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-[11px] font-semibold border border-border">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              LiDAR-guided precision
            </span>
          </div>

          {permissionError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center gap-2 text-xs text-destructive mt-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{permissionError}</span>
            </div>
          )}
        </div>

        {/* Primary Action Button */}
        <div className="mt-7">
          <Button
            onClick={handleContinue}
            disabled={isRequesting}
            isLoading={isRequesting}
            className="w-full h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base tracking-wide shadow-lg shadow-primary/25 cursor-pointer transition-all active:scale-98"
          >
            <span>continue</span>
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default MeasurementGuideScreen;
