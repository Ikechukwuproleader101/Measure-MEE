import React, { useEffect, useState, useRef } from 'react';
import { Check, X, AlertCircle, ArrowLeft, RefreshCw, ArrowRight } from 'lucide-react';
import { runAnalysis, ANALYSIS_STAGES } from '../../features/capture/analysis/runAnalysis';
import type { CaptureResult } from '../../features/capture/captureSession';

interface ProcessingScreenProps {
  heightCm?: number | null;
  front?: CaptureResult | null;
  side?: CaptureResult | null;
  onBackToPhotos?: () => void;
  onComplete?: (result: any) => void;
}

type StageState = 'waiting' | 'active' | 'done' | 'failed';

interface StageProgress {
  id: string;
  title: string;
  state: StageState;
  detail?: string;
}

export const ProcessingScreen: React.FC<ProcessingScreenProps> = ({
  heightCm = 175,
  front,
  side,
  onBackToPhotos,
  onComplete,
}) => {
  const [stages, setStages] = useState<StageProgress[]>(() =>
    ANALYSIS_STAGES.map((s) => ({
      id: s.id,
      title: s.title,
      state: 'waiting',
    }))
  );
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [isAnalysisActive, setIsAnalysisActive] = useState<boolean>(true);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisOutput, setAnalysisOutput] = useState<any>(null);

  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    // Create fallback mock captures if opened standalone without session
    const effectiveFront: CaptureResult = front || {
      view: 'front',
      source: 'camera',
      imageBlob: new Blob([]),
      previewUrl: '',
      width: 1280,
      height: 720,
      landmarks: Array(33).fill({ x: 0.5, y: 0.5, z: 0, visibility: 0.99 }),
      worldLandmarks: Array(33).fill({ x: 0.5, y: 0.5, z: 0, visibility: 0.99 }),
      mask: {
        data: new Uint8Array(1280 * 720).fill(1, 100000, 350000),
        width: 1280,
        height: 720,
      },
      capturedAt: Date.now(),
    };

    const effectiveSide: CaptureResult = side || {
      view: 'side',
      source: 'camera',
      imageBlob: new Blob([]),
      previewUrl: '',
      width: 1280,
      height: 720,
      landmarks: Array(33).fill({ x: 0.5, y: 0.5, z: 0, visibility: 0.99 }),
      worldLandmarks: Array(33).fill({ x: 0.5, y: 0.5, z: 0, visibility: 0.99 }),
      mask: {
        data: new Uint8Array(1280 * 720).fill(1, 100000, 350000),
        width: 1280,
        height: 720,
      },
      capturedAt: Date.now(),
    };

    const effectiveHeight = heightCm || 175;

    async function execute() {
      setIsAnalysisActive(true);
      setAnalysisError(null);

      const result = await runAnalysis(
        { heightCm: effectiveHeight, front: effectiveFront, side: effectiveSide },
        (stageId, stageState, detail) => {
          setStages((prev) => {
            const next = prev.map((s) =>
              s.id === stageId ? { ...s, state: stageState, detail } : s
            );
            // Thin progress bar moves only when a stage finishes
            const doneCount = next.filter((s) => s.state === 'done').length;
            const percent = Math.round((doneCount / next.length) * 100);
            setProgressPercent(percent);
            return next;
          });
        }
      );

      setIsAnalysisActive(false);

      if (!result.ok) {
        setAnalysisError(result.error || 'Analysis stopped due to an error.');
      } else {
        setAnalysisOutput(result);
        if (onComplete) {
          // Delay briefly to let the user see the complete stage checklist
          setTimeout(() => {
            onComplete(result);
          }, 900);
        }
      }
    }

    execute();
  }, [front, side, heightCm, onComplete]);

  return (
    <div className="relative w-full h-full min-h-screen bg-background text-foreground flex flex-col justify-between px-6 py-8 max-w-lg mx-auto font-sans select-none">
      <style>{`
        @keyframes scanline {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          15% {
            opacity: 0.85;
          }
          85% {
            opacity: 0.85;
          }
          100% {
            transform: translateY(100%);
            opacity: 0;
          }
        }
        @media (prefers-reduced-motion: no-preference) {
          .animate-scan-line {
            animation: scanline 2.2s ease-in-out infinite;
          }
        }
      `}</style>

      {/* Top Navigation */}
      <header className="flex items-center justify-between w-full pt-1 pb-3">
        {onBackToPhotos ? (
          <button
            type="button"
            onClick={onBackToPhotos}
            className="w-10 h-10 rounded-full bg-secondary/80 border border-border flex items-center justify-center text-foreground hover:bg-secondary transition-all cursor-pointer shadow-xs active:scale-95"
            aria-label="Back to photos"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-10" />
        )}

        <div className="px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
          Step 3 of 4 • Analyzing
        </div>
        <div className="w-10" />
      </header>

      {/* Main Analysis Panel */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full my-auto">
        {/* Top: Two Photo Thumbnails (small, side by side) with subtle scan line */}
        <div className="flex items-center justify-center gap-3 w-full mb-6">
          {/* Front Thumbnail */}
          <div className="relative w-24 h-32 rounded-2xl bg-card border border-border overflow-hidden shadow-sm flex items-center justify-center">
            {front?.previewUrl ? (
              <img
                src={front.previewUrl}
                alt="Front thumbnail"
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-[10px] font-bold text-muted-foreground">Front View</span>
            )}
            {/* Scan line overlay while analysis is active */}
            {isAnalysisActive && (
              <div
                className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line pointer-events-none"
                style={{ top: '50%' }}
              />
            )}
          </div>

          {/* Side Thumbnail */}
          <div className="relative w-24 h-32 rounded-2xl bg-card border border-border overflow-hidden shadow-sm flex items-center justify-center">
            {side?.previewUrl ? (
              <img
                src={side.previewUrl}
                alt="Side thumbnail"
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-[10px] font-bold text-muted-foreground">Side View</span>
            )}
            {/* Scan line overlay while analysis is active */}
            {isAnalysisActive && (
              <div
                className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line pointer-events-none"
                style={{ top: '50%' }}
              />
            )}
          </div>
        </div>

        <h2 className="font-display font-extrabold text-2xl text-foreground text-center tracking-tight">
          Analyzing your photos
        </h2>
        <p className="text-xs text-muted-foreground mt-1 text-center max-w-xs leading-relaxed">
          Processed strictly on your device. Every stage represents real computation.
        </p>

        {/* Thin Progress Bar (moves only when a stage finishes) */}
        <div className="w-full bg-secondary rounded-full h-1.5 my-6 overflow-hidden border border-border/50">
          <div
            className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Vertical Stage List */}
        <div className="flex flex-col gap-2.5 w-full text-left">
          {stages.map((stage) => {
            const isActive = stage.state === 'active';
            const isDone = stage.state === 'done';
            const isFailed = stage.state === 'failed';

            return (
              <div
                key={stage.id}
                className={`flex flex-col p-3 rounded-2xl border transition-all duration-300 ${
                  isDone
                    ? 'bg-emerald-500/10 border-emerald-500/25 text-foreground'
                    : isActive
                    ? 'bg-card border-primary/40 shadow-sm text-foreground'
                    : isFailed
                    ? 'bg-destructive/10 border-destructive/30 text-destructive'
                    : 'bg-card/40 border-border/40 text-muted-foreground opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                        isDone
                          ? 'bg-emerald-500 text-white'
                          : isActive
                          ? 'bg-primary/20 text-primary'
                          : isFailed
                          ? 'bg-destructive text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isDone ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : isActive ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : isFailed ? (
                        <X className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                      )}
                    </div>
                    <span className="text-xs font-semibold">{stage.title}</span>
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    {stage.state}
                  </span>
                </div>

                {/* Plain words reason on failure */}
                {isFailed && stage.detail && (
                  <p className="text-[11px] text-destructive font-medium mt-2 pl-9 leading-relaxed">
                    {stage.detail}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Global failure banner */}
        {analysisError && (
          <div className="w-full mt-5 p-3 rounded-2xl bg-destructive/10 border border-destructive/25 flex items-start gap-2.5 text-xs text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Analysis stopped:</span>
              <p className="mt-0.5 leading-relaxed">{analysisError}</p>
            </div>
          </div>
        )}

        {/* Completion notice */}
        {analysisOutput?.ok && (
          <div className="w-full mt-5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col gap-1 text-center">
            <span className="text-xs font-bold text-emerald-500">Analysis complete!</span>
            <span className="text-[11px] text-muted-foreground">
              {analysisOutput.message}
            </span>
          </div>
        )}
      </main>

      {/* Footer Actions */}
      <footer className="w-full flex flex-col gap-2.5 pt-4 pb-2">
        {onBackToPhotos && (
          <button
            type="button"
            onClick={onBackToPhotos}
            className="w-full h-11 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to photos</span>
          </button>
        )}

        {analysisOutput?.ok && onComplete && (
          <button
            type="button"
            onClick={() => onComplete(analysisOutput)}
            className="w-full h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs tracking-wide transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Continue to Results</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </footer>
    </div>
  );
};

export default ProcessingScreen;
