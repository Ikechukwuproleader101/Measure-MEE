import React, { useEffect } from 'react';
import { Mascot } from '../common/Mascot';

interface SplashScreenProps {
  onContinue?: () => void;
  autoAdvance?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onContinue,
  autoAdvance = true 
}) => {
  useEffect(() => {
    if (!autoAdvance || !onContinue) return;
    const timer = setTimeout(() => {
      onContinue();
    }, 2400);

    return () => clearTimeout(timer);
  }, [autoAdvance, onContinue]);

  return (
    <div 
      onClick={onContinue}
      className="relative w-full h-full min-h-screen bg-[#B69EFF] flex flex-col items-center justify-center p-6 select-none cursor-pointer overflow-hidden transition-colors"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onContinue?.();
        }
      }}
    >
      {/* Main Mascot Emblem */}
      <div className="flex flex-col items-center justify-center gap-4 my-auto">
        <div className="p-4 rounded-3xl transition-transform duration-300 hover:scale-105">
          <Mascot 
            color="white" 
            className="w-32 h-32 md:w-40 md:h-40 drop-shadow-sm" 
          />
        </div>

        {/* Wordmark branding */}
        <div className="text-center mt-2">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-950 font-display">
            Measure <span className="text-white">Me</span>
          </h1>
          <p className="text-neutral-900/80 text-sm md:text-base font-medium tracking-wide mt-1.5">
            Tailored Fit, Anywhere
          </p>
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-10 flex flex-col items-center gap-2 text-neutral-900/60 text-xs">
        <div className="w-10 h-1 bg-black/20 rounded-full" />
        <span>Tap anywhere to continue</span>
      </div>
    </div>
  );
};
