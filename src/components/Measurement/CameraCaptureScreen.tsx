import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Zap, CheckCircle2, ShieldCheck } from 'lucide-react';

interface CameraCaptureScreenProps {
  onBack: () => void;
  onCaptured: () => void;
}

export const CameraCaptureScreen: React.FC<CameraCaptureScreenProps> = ({
  onBack,
  onCaptured
}) => {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCalibrated, setIsCalibrated] = useState(false);

  useEffect(() => {
    // Simulate smart calibration locking after 1.2s
    const timer = setTimeout(() => {
      setIsCalibrated(true);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  const handleTrigger = () => {
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 700);
      return () => clearTimeout(timer);
    } else {
      onCaptured();
    }
  }, [countdown, onCaptured]);

  return (
    <div className="relative w-full h-full min-h-screen bg-black text-white flex flex-col justify-between max-w-lg mx-auto overflow-hidden select-none">
      {/* Top Controls Overlay */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between z-20">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition-colors cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs font-semibold">
          <span className={`w-2 h-2 rounded-full ${isCalibrated ? 'bg-[#27D07F] animate-ping' : 'bg-amber-400'}`} />
          <span className={isCalibrated ? 'text-[#27D07F]' : 'text-amber-300'}>
            {isCalibrated ? 'Triple Signal Locked (98%)' : 'Aligning door frame...'}
          </span>
        </div>

        <button
          onClick={() => alert('Flash toggled')}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
          aria-label="Flash"
        >
          <Zap className="w-4 h-4" />
        </button>
      </div>

      {/* Viewfinder Canvas Area */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden px-4">
        {/* Background dark grid simulating AR scanner */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30" 
          style={{ backgroundImage: 'radial-gradient(circle at center, rgba(39, 208, 127, 0.15) 0, transparent 70%)' }}
        />

        {/* Dynamic Pose Silhouette matching App scannong camera screen.png */}
        <div className="relative w-full max-w-xs h-[480px] flex items-center justify-center">
          {/* Scanning frame border */}
          <div className="absolute inset-0 border-2 border-dashed border-[#27D07F]/40 rounded-3xl" />

          {/* Corner Brackets */}
          <div className="absolute top-2 left-2 w-8 h-8 border-t-3 border-l-3 border-[#27D07F] rounded-tl-xl" />
          <div className="absolute top-2 right-2 w-8 h-8 border-t-3 border-r-3 border-[#27D07F] rounded-tr-xl" />
          <div className="absolute bottom-2 left-2 w-8 h-8 border-b-3 border-l-3 border-[#27D07F] rounded-bl-xl" />
          <div className="absolute bottom-2 right-2 w-8 h-8 border-b-3 border-r-3 border-[#27D07F] rounded-br-xl" />

          {/* Model Graphic */}
          <img
            src="/images/illustrations/man-lidar-scan.png"
            alt="Scanning Pose Model"
            className="h-full object-contain drop-shadow-2xl z-10"
            onError={(e) => {
              e.currentTarget.src = '/images/illustrations/man-standing.png';
            }}
          />

          {/* Live Gating Tag Floating on the Right matching App scannong camera screen.png */}
          <div className="absolute top-12 right-2 z-20 bg-[#B69EFF] text-neutral-950 font-bold px-2.5 py-1 rounded-xl text-[10px] shadow-lg flex items-center gap-1.5 animate-bounce">
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-950" />
            <span>LiDAR + Door ✓</span>
          </div>

          {/* Center Countdown Overlay if triggering */}
          {countdown !== null && countdown > 0 && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-xs rounded-3xl">
              <span className="text-7xl font-black text-[#27D07F] font-display animate-ping">
                {countdown}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Shutter Controls */}
      <div className="px-6 pb-10 pt-4 flex items-center justify-between z-20">
        <button
          onClick={onBack}
          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer"
          aria-label="Cancel"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Shutter Button matching App scannong camera screen.png */}
        <button
          onClick={handleTrigger}
          disabled={countdown !== null}
          className="w-20 h-20 rounded-full border-4 border-white/30 p-1 flex items-center justify-center active:scale-95 transition-transform cursor-pointer group"
          aria-label="Capture"
        >
          <div className="w-full h-full rounded-full bg-[#27D07F] group-hover:bg-[#22BD73] transition-colors shadow-lg shadow-[#27D07F]/40 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-neutral-950 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </button>

        <button
          onClick={() => alert('Camera switched')}
          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer"
          aria-label="Switch Camera"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
