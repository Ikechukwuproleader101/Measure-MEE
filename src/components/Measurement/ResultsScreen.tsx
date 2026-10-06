import React from 'react';
import { Button } from '../ui/button';
import { ArrowLeft, ShieldCheck, Check } from 'lucide-react';

interface ResultsScreenProps {
  onBack: () => void;
  onViewDetails: () => void;
  onSaveToProject: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  onBack,
  onViewDetails,
  onSaveToProject,
}) => {
  return (
    <div className="relative w-full h-full min-h-screen bg-[#0A0A0E] text-white flex flex-col justify-between max-w-lg mx-auto pb-6">
      {/* Top Header */}
      <header className="px-6 pt-6 pb-2 flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-[#161622] border border-white/5 flex items-center justify-center text-white/80 hover:text-white hover:bg-[#1E1E2E] transition-all cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <span className="text-xs font-semibold text-[#8E8CA3]">Scan Results</span>
        <div className="w-10" />
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-2 flex flex-col items-center overflow-y-auto">
        <div className="w-full text-left">
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
            Measurement Complete!
          </h1>
          <p className="text-xs text-[#8E8CA3] mt-1 leading-relaxed">
            All contours extracted on-device. Triple-signal agreement achieved.
          </p>

          {/* High Confidence Badge matching App body measurement display screen.png */}
          <div className="mt-3.5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#27D07F]/15 border border-[#27D07F]/30 text-xs font-bold text-[#27D07F]">
            <ShieldCheck className="w-4 h-4" />
            <span>High Confidence</span>
            <span className="text-white/80 font-normal">| 98% agreement</span>
          </div>
        </div>

        {/* Body Diagram with Callout Markers matching App body measurement display screen.png */}
        <div className="relative w-full max-w-xs h-76 sm:h-84 my-4 flex items-center justify-center">
          {/* SVG Silhouette with Callouts */}
          <svg 
            viewBox="0 0 240 320" 
            className="w-full h-full drop-shadow-lg"
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Elegant Body Silhouette in Purple/White */}
            <path
              d="M120 28 C128 28 134 34 134 42 C134 50 128 56 120 56 C112 56 106 50 106 42 C106 34 112 28 120 28 Z
                 M114 58 L126 58 L148 70 L170 115 L162 120 L146 86 L144 140 L148 185 L144 285 L130 285 L125 180 L120 180 L115 180 L110 285 L96 285 L92 140 L94 86 L78 120 L70 115 L92 70 Z"
              fill="#B69EFF"
              opacity="0.9"
            />

            {/* Measurement Callout Lines & Points */}
            {/* Shoulder Width */}
            <circle cx="94" cy="72" r="3.5" fill="#27D07F" />
            <circle cx="146" cy="72" r="3.5" fill="#27D07F" />
            <line x1="94" y1="72" x2="146" y2="72" stroke="#27D07F" strokeWidth="1.5" strokeDasharray="3 2" />
            <line x1="94" y1="72" x2="55" y2="72" stroke="#27D07F" strokeWidth="1" />

            {/* Chest */}
            <circle cx="102" cy="100" r="3" fill="#FFFFFF" />
            <circle cx="138" cy="100" r="3" fill="#FFFFFF" />
            <line x1="102" y1="100" x2="138" y2="100" stroke="#FFFFFF" strokeWidth="1.2" strokeDasharray="2 2" />
            <line x1="102" y1="100" x2="50" y2="100" stroke="#FFFFFF" strokeWidth="1" />

            {/* Waist */}
            <circle cx="108" cy="130" r="3" fill="#27D07F" />
            <circle cx="132" cy="130" r="3" fill="#27D07F" />
            <line x1="108" y1="130" x2="132" y2="130" stroke="#27D07F" strokeWidth="1.2" />
            <line x1="132" y1="130" x2="185" y2="130" stroke="#27D07F" strokeWidth="1" />

            {/* Hips */}
            <circle cx="103" cy="160" r="3" fill="#FFFFFF" />
            <circle cx="137" cy="160" r="3" fill="#FFFFFF" />
            <line x1="103" y1="160" x2="137" y2="160" stroke="#FFFFFF" strokeWidth="1.2" />
            <line x1="137" y1="160" x2="190" y2="160" stroke="#FFFFFF" strokeWidth="1" />

            {/* Height indicator bracket */}
            <line x1="205" y1="28" x2="205" y2="285" stroke="#B69EFF" strokeWidth="1.5" strokeDasharray="3 2" />
            <line x1="200" y1="28" x2="210" y2="28" stroke="#B69EFF" strokeWidth="1.5" />
            <line x1="200" y1="285" x2="210" y2="285" stroke="#B69EFF" strokeWidth="1.5" />
          </svg>

          {/* HTML Overlay Callout Badges */}
          <div className="absolute left-0 top-14 text-left">
            <span className="text-[10px] text-[#8E8CA3] block">Shoulder</span>
            <span className="text-xs font-bold text-white bg-[#14141E] px-2 py-0.5 rounded-md border border-white/10">
              44 cm
            </span>
          </div>

          <div className="absolute left-0 top-24 text-left">
            <span className="text-[10px] text-[#8E8CA3] block">Chest</span>
            <span className="text-xs font-bold text-[#27D07F] bg-[#14141E] px-2 py-0.5 rounded-md border border-white/10">
              96 cm
            </span>
          </div>

          <div className="absolute right-0 top-32 text-right">
            <span className="text-[10px] text-[#8E8CA3] block">Waist</span>
            <span className="text-xs font-bold text-white bg-[#14141E] px-2 py-0.5 rounded-md border border-white/10">
              80 cm
            </span>
          </div>

          <div className="absolute right-0 top-44 text-right">
            <span className="text-[10px] text-[#8E8CA3] block">Hips</span>
            <span className="text-xs font-bold text-[#27D07F] bg-[#14141E] px-2 py-0.5 rounded-md border border-white/10">
              98 cm
            </span>
          </div>

          <div className="absolute right-1 bottom-10 text-right">
            <span className="text-[10px] text-[#B69EFF] block">Height</span>
            <span className="text-xs font-bold text-[#B69EFF] bg-[#14141E] px-2 py-0.5 rounded-md border border-[#B69EFF]/30">
              180 cm
            </span>
          </div>
        </div>
      </main>

      {/* Action Buttons */}
      <footer className="px-6 flex flex-col gap-2.5">
        <Button
          onClick={onSaveToProject}
          variant="default"
          className="w-full h-13 rounded-2xl bg-[#27D07F] hover:bg-[#22BD73] text-neutral-950 font-bold text-base flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#27D07F]/15"
        >
          <Check className="w-5 h-5 stroke-[2.5]" />
          <span>Save to Wedding Suit</span>
        </Button>

        <Button
          onClick={onViewDetails}
          variant="secondary"
          className="w-full h-12 rounded-2xl bg-[#14141E] hover:bg-[#1C1C2A] text-white border border-white/10 font-medium text-sm cursor-pointer"
        >
          View Croquis Canvas & Comment Pins
        </Button>
      </footer>
    </div>
  );
};
