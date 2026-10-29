import React, { useEffect } from 'react';

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
      className="fixed inset-0 z-50 w-screen h-[100dvh] min-h-[100dvh] flex items-center justify-center select-none cursor-pointer overflow-hidden m-0 p-0"
      style={{
        backgroundColor: '#CBA6F7',
        backgroundImage: `linear-gradient(rgba(203, 166, 247, 0.82), rgba(203, 166, 247, 0.82)), url('/images/splash-pattern.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onContinue?.();
        }
      }}
    >
      {/* Centered Wordmark */}
      <h1 
        className="text-white font-extrabold font-display tracking-tight text-center select-none"
        style={{
          fontSize: 'clamp(2rem, 5.5vw, 2.75rem)',
          transform: 'translateY(-1.5%)',
        }}
      >
        Measure Me
      </h1>
    </div>
  );
};
