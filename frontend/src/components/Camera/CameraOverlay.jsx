import React from 'react';
import { Check, AlertCircle, Loader2, Sparkles } from 'lucide-react';

/**
 * CameraOverlay Component
 * 
 * Renders dynamic SVG guidance lines, viewfinder bounding frames that transition
 * from neutral/amber to vibrant green upon valid A-pose / side hold, and real-time status pill.
 * 
 * @param {Object} props
 * @param {boolean} props.isReady - Whether pose detector model is loaded and ready
 * @param {boolean} props.isLoading - Whether model is currently initializing
 * @param {boolean} props.isValid - Whether pose satisfies validation criteria and stability
 * @param {string[]} props.reasons - Current validation hint reasons
 * @param {number} props.stabilityProgress - Progress (0..1) towards passing consecutive frames
 * @param {'front' | 'side'} props.viewMode - Current target pose mode
 * @param {Array<any> | null} props.landmarks - Raw landmarks for rendering guide hints
 */
export const CameraOverlay = ({
  isReady,
  isLoading,
  isValid,
  reasons = [],
  stabilityProgress = 0,
  viewMode = 'front',
  landmarks = null,
}) => {
  const currentHint = reasons.length > 0 ? reasons[0] : (isValid ? 'Ready to capture!' : 'Align with guide');

  // Compute status pill colors and icon
  const pillStyle = !isReady || isLoading
    ? 'bg-card/90 border-border text-muted-foreground'
    : isValid
    ? 'bg-emerald-500/90 border-emerald-400 text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400/50'
    : 'bg-card/90 border-amber-500/40 text-foreground shadow-md';

  // Outline border color dynamic styling
  const frameColorClass = isValid
    ? 'border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.45)]'
    : stabilityProgress > 0
    ? 'border-amber-400/80 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
    : 'border-white/20';

  const cornerColorClass = isValid
    ? 'border-emerald-400'
    : stabilityProgress > 0
    ? 'border-amber-400'
    : 'border-white/60';

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between overflow-hidden">
      {/* Dynamic Viewfinder Frame Outline */}
      <div className={`absolute inset-x-6 top-20 bottom-32 rounded-3xl border-2 transition-all duration-300 ease-out pointer-events-none flex flex-col justify-between p-4 overflow-hidden ${frameColorClass}`}>
        {/* Subtle glowing ambient pulse when pose is fully valid */}
        <div
          className={`absolute inset-0 rounded-3xl transition-opacity duration-300 pointer-events-none ${
            isValid
              ? 'opacity-100 bg-emerald-500/10 ring-4 ring-emerald-500/30'
              : stabilityProgress > 0
              ? 'opacity-100 bg-amber-500/5 ring-2 ring-amber-400/20'
              : 'opacity-0'
          }`}
        />

        {/* Framing Corner Brackets */}
        <div className={`absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 rounded-tl-2xl transition-colors duration-300 ${cornerColorClass}`} />
        <div className={`absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 rounded-tr-2xl transition-colors duration-300 ${cornerColorClass}`} />
        <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 rounded-bl-2xl transition-colors duration-300 ${cornerColorClass}`} />
        <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 rounded-br-2xl transition-colors duration-300 ${cornerColorClass}`} />

        {/* Geometric Silhouette Guidelines (Dynamic SVG) */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full opacity-25 pointer-events-none transition-all duration-300"
        >
          {/* Central Vertical Alignment Axis */}
          <line
            x1="50"
            y1="5"
            x2="50"
            y2="95"
            stroke={isValid ? '#10b981' : '#ffffff'}
            strokeWidth="0.5"
            strokeDasharray="2,2"
          />

          {viewMode === 'front' ? (
            /* Front A-Pose Reference Silhouette */
            <g stroke={isValid ? '#10b981' : '#ffffff'} strokeWidth="0.8" fill="none">
              {/* Head Reference */}
              <circle cx="50" cy="18" r="6" strokeDasharray="1.5,1.5" />
              {/* Shoulder Bar */}
              <line x1="38" y1="27" x2="62" y2="27" />
              {/* Torso Guidelines */}
              <line x1="38" y1="27" x2="42" y2="52" />
              <line x1="62" y1="27" x2="58" y2="52" />
              {/* Arms flared out ~35-40 deg (A-Pose) */}
              <line x1="38" y1="27" x2="22" y2="48" strokeDasharray="2,1.5" />
              <line x1="62" y1="27" x2="78" y2="48" strokeDasharray="2,1.5" />
              {/* Legs spread slightly */}
              <line x1="43" y1="52" x2="35" y2="92" strokeDasharray="2,1.5" />
              <line x1="57" y1="52" x2="65" y2="92" strokeDasharray="2,1.5" />
              {/* Ground line */}
              <line x1="30" y1="92" x2="70" y2="92" strokeWidth="0.6" strokeDasharray="1,1" />
            </g>
          ) : (
            /* Side Profile Reference Silhouette */
            <g stroke={isValid ? '#10b981' : '#ffffff'} strokeWidth="0.8" fill="none">
              {/* Head Profile */}
              <ellipse cx="50" cy="18" rx="5" ry="6" strokeDasharray="1.5,1.5" />
              {/* Spine Line */}
              <path d="M 50 25 Q 52 40 50 54 Q 48 70 50 92" strokeDasharray="2,1.5" />
              {/* Arm straight down */}
              <line x1="51" y1="28" x2="51" y2="52" />
              {/* Ground line */}
              <line x1="38" y1="92" x2="62" y2="92" strokeWidth="0.6" strokeDasharray="1,1" />
            </g>
          )}

          {/* Real-time skeleton points if landmarks are active */}
          {landmarks && (
            <g fill={isValid ? '#10b981' : '#f59e0b'} opacity="0.8">
              {/* Render key joints */}
              {[0, 11, 12, 13, 14, 15, 16, 23, 24, 27, 28].map((idx) => {
                const pt = landmarks[idx];
                if (!pt) return null;
                return (
                  <circle
                    key={idx}
                    cx={pt.x * 100}
                    cy={pt.y * 100}
                    r="1.2"
                  />
                );
              })}
            </g>
          )}
        </svg>
      </div>

      {/* Floating Status Pill & Live Guidance */}
      <div className="w-full flex flex-col items-center justify-end z-30 pb-36 px-6">
        <div
          className={`px-5 py-2.5 rounded-full border backdrop-blur-md transition-all duration-300 flex items-center gap-3 max-w-sm pointer-events-auto ${pillStyle}`}
        >
          {isLoading || !isReady ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
              <span className="text-xs font-semibold">Loading pose detection model...</span>
            </>
          ) : isValid ? (
            <>
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-white stroke-[3]" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold leading-tight">Pose Locked & Stable!</span>
                <span className="text-[11px] opacity-90 leading-tight">Tap shutter or wait for auto-capture</span>
              </div>
            </>
          ) : (
            <>
              {stabilityProgress > 0 ? (
                /* Stability Progress Indicator */
                <div className="relative w-6 h-6 shrink-0 flex items-center justify-center">
                  <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="opacity-20 text-amber-500"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeDasharray="56.5"
                      strokeDashoffset={56.5 * (1 - stabilityProgress)}
                      strokeLinecap="round"
                      className="text-amber-500 transition-all duration-150"
                    />
                  </svg>
                  <Sparkles className="w-3 h-3 text-amber-500 absolute inset-0 m-auto" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4 stroke-[2.5]" />
                </div>
              )}
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-foreground leading-tight">
                  {stabilityProgress > 0 ? 'Holding pose...' : (viewMode === 'front' ? 'A-Pose Guide' : 'Side Profile Guide')}
                </span>
                <span className="text-[11px] text-muted-foreground leading-tight">
                  {currentHint}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraOverlay;
