import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { PillSpinner } from '../common/PillLoader';

interface ProcessingScreenProps {
  onComplete: () => void;
}

export const ProcessingScreen: React.FC<ProcessingScreenProps> = ({ onComplete }) => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    "Measuring depth signals",
    "Fitting door-frame reference",
    "Extracting body contours",
    "Compiling bespoke geometry"
  ];

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(stepInterval);
          setTimeout(onComplete, 800);
          return prev;
        }
      });
    }, 700);

    return () => clearInterval(stepInterval);
  }, [onComplete, steps.length]);

  return (
    <div className="relative w-full h-full min-h-screen bg-background text-foreground flex flex-col justify-between items-center px-6 py-10 max-w-lg mx-auto text-center">
      {/* Top spacing */}
      <div className="w-full" />

      {/* Main Center Animation */}
      <div className="flex flex-col items-center justify-center my-auto">
        <div className="relative w-44 h-44 flex items-center justify-center mb-6">
          {/* Animated glow */}
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />

          {/* Orbit Illustration */}
          <img
            src="/images/illustrations/ghost-gyro-orbit.png"
            alt="Analyzing in progress"
            className="w-36 h-36 object-contain relative z-10 animate-bounce"
            style={{ animationDuration: '2.5s' }}
            onError={(e) => {
              e.currentTarget.src = '/images/illustrations/mascot-waving.png';
            }}
          />
        </div>

        <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground">
          Analyzing your body...
        </h2>
        <p className="text-xs text-muted-foreground mt-2 max-w-xs leading-relaxed">
          Processed strictly on-device. Photos never leave your phone and are deleted immediately.
        </p>

        {/* Progress Step Indicators */}
        <div className="mt-8 flex flex-col gap-2.5 w-full max-w-xs text-left">
          {steps.map((label, idx) => {
            const isFinished = idx < activeStep;
            const isCurrent = idx === activeStep;

            return (
              <div
                key={idx}
                className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-300 ${
                  isFinished
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : isCurrent
                    ? 'bg-card border-border text-foreground shadow-sm'
                    : 'bg-transparent border-transparent text-muted-foreground'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isFinished
                      ? 'bg-primary text-primary-foreground'
                      : isCurrent
                      ? 'bg-muted text-foreground'
                      : 'bg-muted/40 text-muted-foreground'
                  }`}
                >
                  {isFinished ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : isCurrent ? (
                    <PillSpinner size="xs" className="border-primary" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <span className="text-xs font-medium">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom privacy badge */}
      <div className="text-[11px] text-muted-foreground">
        Triple Signal Agreement Confirmed
      </div>
    </div>
  );
};
