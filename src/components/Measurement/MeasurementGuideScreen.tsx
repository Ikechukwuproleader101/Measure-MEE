import React from 'react';
import { Button } from '../ui/button';
import { ArrowLeft, CheckCircle2, Shield, Eye, Smartphone, Sparkles } from 'lucide-react';

interface MeasurementGuideScreenProps {
  onBack: () => void;
  onStartCapture: () => void;
}

export const MeasurementGuideScreen: React.FC<MeasurementGuideScreenProps> = ({
  onBack,
  onStartCapture
}) => {
  const steps = [
    {
      icon: <Eye className="w-4 h-4 text-[#27D07F]" />,
      title: "Full body in frame",
      desc: "Place phone at waist height, step back ~2.5m so feet and head fit."
    },
    {
      icon: <Shield className="w-4 h-4 text-[#B69EFF]" />,
      title: "Door-frame reference calibration",
      desc: "Stand near a standard interior door for triple-signal precision."
    },
    {
      icon: <Smartphone className="w-4 h-4 text-[#27D07F]" />,
      title: "LiDAR & depth-guided gating",
      desc: "Camera only triggers when alignment confidence reaches 95%+."
    },
    {
      icon: <Sparkles className="w-4 h-4 text-[#B69EFF]" />,
      title: "100% on-device privacy",
      desc: "Photos never leave your phone. Discarded immediately after contour extraction."
    }
  ];

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

        <span className="text-xs font-semibold text-[#8E8CA3]">Calibration Guide</span>
        <div className="w-10" />
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-2 flex flex-col gap-4 overflow-y-auto">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
            Ready to measure?
          </h1>
          <p className="text-xs text-[#8E8CA3] mt-1 leading-relaxed">
            Ensure you have well-lit space and stand within the guidelines.
          </p>
        </div>

        {/* Central Graphic matching App about to scan Screen3.png */}
        <div className="my-1 w-full h-56 rounded-3xl bg-[#14141E] border border-white/5 flex items-center justify-center p-3 relative overflow-hidden group">
          <div className="absolute inset-0 bg-radial from-[#27D07F]/10 via-transparent to-transparent opacity-60" />

          {/* Guide Corner Brackets */}
          <div className="absolute top-4 left-6 w-8 h-8 border-t-2 border-l-2 border-[#27D07F] rounded-tl-lg" />
          <div className="absolute top-4 right-6 w-8 h-8 border-t-2 border-r-2 border-[#27D07F] rounded-tr-lg" />
          <div className="absolute bottom-4 left-6 w-8 h-8 border-b-2 border-l-2 border-[#27D07F] rounded-bl-lg" />
          <div className="absolute bottom-4 right-6 w-8 h-8 border-b-2 border-r-2 border-[#27D07F] rounded-br-lg" />

          <img
            src="/images/illustrations/man-green-frame.png"
            alt="Standing Guide Reference"
            className="h-full object-contain relative z-10 drop-shadow-md"
            onError={(e) => {
              e.currentTarget.src = '/images/illustrations/man-standing.png';
            }}
          />
        </div>

        {/* 4 Checklist Steps */}
        <div className="flex flex-col gap-2.5">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 rounded-2xl bg-[#14141E]/80 border border-white/5"
            >
              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                {step.icon}
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                  {step.title}
                  <CheckCircle2 className="w-3 h-3 text-[#27D07F]" />
                </h4>
                <p className="text-[11px] text-[#8E8CA3] mt-0.5 leading-snug">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* CTA Button */}
      <footer className="px-6 pt-3">
        <Button
          onClick={onStartCapture}
          variant="default"
          className="w-full h-13 rounded-full bg-[#27D07F] hover:bg-[#22BD73] text-neutral-950 font-bold text-base flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#27D07F]/15"
        >
          <span>Start Camera Capture</span>
        </Button>
      </footer>
    </div>
  );
};
