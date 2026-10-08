import React, { useState } from 'react';
import { Button } from '../ui/button';
import { ArrowLeft, MessageSquare, Plus } from 'lucide-react';

interface GarmentCanvasScreenProps {
  onBack: () => void;
  onOpenComments: () => void;
}

export const GarmentCanvasScreen: React.FC<GarmentCanvasScreenProps> = ({
  onBack,
  onOpenComments
}) => {
  const [tab, setTab] = useState<'canvas' | 'table'>('canvas');
  const [activePin, setActivePin] = useState<'shoulder' | 'chest' | 'waist'>('chest');

  const pinsData = {
    shoulder: {
      title: "Shoulder Seam",
      author: "Master Tailor",
      status: "Resolved",
      comment: "Slope angle is standard. Keep natural sleeve head padding.",
      time: "2h ago",
      resolved: true,
      val: "44.0 cm"
    },
    chest: {
      title: "Chest Circumference",
      author: "Master Tailor",
      status: "Pending review",
      comment: "Verify ease allowance (+4cm) for comfortable formal sitting.",
      time: "15m ago",
      resolved: false,
      val: "96.5 cm"
    },
    waist: {
      title: "Waist Line",
      author: "Ada Lovelace",
      status: "Resolved",
      comment: "Prefer slightly tapered English bespoke cut.",
      time: "1d ago",
      resolved: true,
      val: "80.2 cm"
    }
  };

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

        <h1 className="font-display font-bold text-base text-white">
          Jacket Measurement
        </h1>

        <button
          onClick={onOpenComments}
          className="w-10 h-10 rounded-full bg-[#161622] border border-white/5 flex items-center justify-center text-[#B69EFF] hover:text-white transition-colors cursor-pointer"
          aria-label="Comments"
        >
          <MessageSquare className="w-4 h-4" />
        </button>
      </header>

      {/* View Toggle: Canvas vs Table */}
      <div className="px-6 py-2">
        <div className="bg-[#14141E] p-1 rounded-2xl flex border border-white/5">
          <button
            onClick={() => setTab('canvas')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              tab === 'canvas'
                ? 'bg-[#27D07F] text-neutral-950 shadow-sm'
                : 'text-[#8E8CA3] hover:text-white'
            }`}
          >
            Canvas Diagram
          </button>
          <button
            onClick={() => setTab('table')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              tab === 'table'
                ? 'bg-[#27D07F] text-neutral-950 shadow-sm'
                : 'text-[#8E8CA3] hover:text-white'
            }`}
          >
            Metrics Table
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 px-6 py-2 flex flex-col justify-between overflow-y-auto">
        {tab === 'canvas' ? (
          <>
            {/* Dark background croquis with white outline per spec Part 2 line 82 */}
            <div className="relative w-full h-72 sm:h-80 rounded-3xl bg-[#12121A] border border-white/5 flex items-center justify-center p-4 my-2 overflow-hidden">
              {/* Construction Grid background (Prêt-à-Template style per spec) */}
              <div 
                className="absolute inset-0 opacity-15"
                style={{
                  backgroundImage: 'radial-gradient(circle, #B69EFF 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }}
              />

              {/* White Outline Croquis */}
              <svg 
                viewBox="0 0 200 280" 
                className="w-full h-full relative z-10" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Silhouette outline in clean white */}
                <path
                  d="M100 24 C107 24 112 29 112 36 C112 43 107 48 100 48 C93 48 88 43 88 36 C88 29 93 24 100 24 Z
                     M95 50 L105 50 L124 60 L142 98 L136 102 L122 74 L120 120 L123 160 L120 245 L108 245 L104 155 L100 155 L96 155 L92 245 L80 245 L77 160 L80 120 L78 74 L64 102 L58 98 L76 60 Z"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  fill="rgba(182, 158, 255, 0.08)"
                />

                {/* Construction grid lines per spec */}
                <line x1="78" y1="62" x2="122" y2="62" stroke="#FFFFFF" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.6" />
                <line x1="84" y1="88" x2="116" y2="88" stroke="#FFFFFF" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.6" />
                <line x1="88" y1="114" x2="112" y2="114" stroke="#FFFFFF" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.6" />
                <line x1="100" y1="50" x2="100" y2="245" stroke="#FFFFFF" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.4" />
              </svg>

              {/* Interactive Comment Pins matching spec:
                  - Brand purple accent for pending
                  - Muted gray-purple for resolved */}
              
              {/* Shoulder Pin (Resolved) */}
              <button
                onClick={() => setActivePin('shoulder')}
                className={`absolute top-18 left-[34%] z-20 w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  activePin === 'shoulder'
                    ? 'ring-4 ring-[#8E8CA3]/30 scale-110'
                    : 'hover:scale-105'
                } bg-[#66647A] text-white shadow-md`}
                aria-label="Shoulder measurement pin"
              >
                <span className="text-[10px] font-bold">1</span>
              </button>

              {/* Chest Pin (Pending review - Brand purple #B69EFF per spec) */}
              <button
                onClick={() => setActivePin('chest')}
                className={`absolute top-26 right-[34%] z-20 w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer animate-pulse ${
                  activePin === 'chest'
                    ? 'ring-4 ring-[#B69EFF]/40 scale-110'
                    : 'hover:scale-105'
                } bg-[#B69EFF] text-neutral-950 font-black shadow-md`}
                aria-label="Chest measurement pin"
              >
                <span className="text-[10px]">2</span>
              </button>

              {/* Waist Pin (Resolved) */}
              <button
                onClick={() => setActivePin('waist')}
                className={`absolute top-36 left-[46%] z-20 w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  activePin === 'waist'
                    ? 'ring-4 ring-[#8E8CA3]/30 scale-110'
                    : 'hover:scale-105'
                } bg-[#66647A] text-white shadow-md`}
                aria-label="Waist measurement pin"
              >
                <span className="text-[10px] font-bold">3</span>
              </button>
            </div>

            {/* Pin Details Drawer Card matching Code_Generated_Image (13).png */}
            <div className="bg-[#14141E] border border-white/5 rounded-2xl p-4 my-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">
                    {pinsData[activePin].title}
                  </span>
                  <span className="text-xs font-semibold text-[#27D07F]">
                    {pinsData[activePin].val}
                  </span>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    pinsData[activePin].resolved
                      ? 'bg-white/10 text-white/70'
                      : 'bg-[#B69EFF]/20 text-[#B69EFF]'
                  }`}
                >
                  {pinsData[activePin].status}
                </span>
              </div>

              <div className="flex items-start gap-2.5 mt-2 pt-2 border-t border-white/5">
                <div className="w-7 h-7 rounded-full bg-[#B69EFF]/20 text-[#B69EFF] flex items-center justify-center text-xs font-bold shrink-0">
                  T
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white/90">
                      {pinsData[activePin].author}
                    </span>
                    <span className="text-[10px] text-[#5A586D]">
                      {pinsData[activePin].time}
                    </span>
                  </div>
                  <p className="text-xs text-[#8E8CA3] mt-0.5 leading-relaxed">
                    {pinsData[activePin].comment}
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Table View */
          <div className="bg-[#14141E] border border-white/5 rounded-2xl p-4 my-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8E8CA3] mb-3">
              Garment Specifications
            </h3>
            <div className="divide-y divide-white/5 text-sm">
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-white/80">Shoulder Width</span>
                <span className="font-mono font-bold text-white">44.0 cm</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-white/80">Chest Circumference</span>
                <span className="font-mono font-bold text-[#27D07F]">96.5 cm</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-white/80">Waist Line</span>
                <span className="font-mono font-bold text-white">80.2 cm</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-white/80">Jacket Back Length</span>
                <span className="font-mono font-bold text-white">74.5 cm</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-white/80">Sleeve Outseam</span>
                <span className="font-mono font-bold text-white">63.0 cm</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom CTA to add pins/comments */}
      <footer className="px-6 pt-2">
        <Button
          onClick={onOpenComments}
          variant="outline"
          className="w-full h-12 rounded-full border-white/10 hover:border-[#27D07F]/40 bg-[#14141E] text-white flex items-center justify-center gap-2 cursor-pointer text-sm"
        >
          <Plus className="w-4 h-4 text-[#27D07F]" />
          <span>Add Comment Pin</span>
        </Button>
      </footer>
    </div>
  );
};
