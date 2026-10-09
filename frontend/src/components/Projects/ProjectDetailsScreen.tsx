import React from 'react';
import { Button } from '../ui/button';
import { 
  ArrowLeft, 
  ChevronRight, 
  Plus, 
  Share2, 
  MessageSquare
} from 'lucide-react';

interface ProjectDetailsScreenProps {
  onBack: () => void;
  onSelectGarment: (garmentId: string) => void;
  onAddMeasurement: () => void;
  onOpenComments: () => void;
  onShareLink: () => void;
}

export const ProjectDetailsScreen: React.FC<ProjectDetailsScreenProps> = ({
  onBack,
  onSelectGarment,
  onAddMeasurement,
  onOpenComments,
  onShareLink,
}) => {
  const garments = [
    {
      id: 'jacket',
      name: 'Jacket',
      status: 'Cutting',
      statusBg: 'bg-amber-500/20 text-amber-400',
      dotColor: 'bg-amber-400',
      imageSrc: '/images/illustrations/suit-jacket.png',
      measurementsCount: 6,
      commentsCount: 2
    },
    {
      id: 'trousers',
      name: 'Trousers',
      status: 'Fitting',
      statusBg: 'bg-[#B69EFF]/20 text-[#B69EFF]',
      dotColor: 'bg-[#B69EFF]',
      imageSrc: '/images/illustrations/suit-trousers-pair.png',
      measurementsCount: 4,
      commentsCount: 1
    },
    {
      id: 'waistcoat',
      name: 'Waistcoat',
      status: 'Pending',
      statusBg: 'bg-emerald-500/20 text-emerald-400',
      dotColor: 'bg-emerald-400',
      imageSrc: '/images/illustrations/suit-full.png',
      measurementsCount: 5,
      commentsCount: 0
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

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenComments}
            className="w-10 h-10 rounded-full bg-[#161622] border border-white/5 flex items-center justify-center text-white/80 hover:text-[#B69EFF] transition-colors cursor-pointer"
            aria-label="Comments"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <button
            onClick={onShareLink}
            className="w-10 h-10 rounded-full bg-[#161622] border border-white/5 flex items-center justify-center text-white/80 hover:text-[#27D07F] transition-colors cursor-pointer"
            aria-label="Share Link"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-2 flex flex-col gap-5 overflow-y-auto">
        {/* Project Title & Stepper matching App project item screen.png */}
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
            Wedding Suit
          </h1>
          <p className="text-xs text-[#8E8CA3] mt-1">
            Measurements • 3 garments
          </p>

          {/* Stepper pills */}
          <div className="mt-4 p-3 bg-[#14141E] border border-white/5 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-orange-400">Step 2: Cutting</span>
              <span className="text-[11px] text-[#8E8CA3]">In progress</span>
            </div>

            {/* Stepper bar */}
            <div className="flex items-center gap-1.5">
              <div className="flex-1 h-2 rounded-full bg-[#27D07F]" />
              <div className="flex-1 h-2 rounded-full bg-orange-400" />
              <div className="flex-1 h-2 rounded-full bg-white/10" />
              <div className="flex-1 h-2 rounded-full bg-white/10" />
            </div>

            <div className="flex justify-between text-[10px] text-[#5A586D] mt-2 font-medium">
              <span className="text-white/80">Review</span>
              <span className="text-orange-400 font-bold">Cutting</span>
              <span>Fitting</span>
              <span>Done</span>
            </div>
          </div>
        </div>

        {/* Garments List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-base text-white">Garments</h2>
            <span className="text-xs text-[#8E8CA3]">Select to view canvas</span>
          </div>

          <div className="flex flex-col gap-3">
            {garments.map((garment) => (
              <div
                key={garment.id}
                onClick={() => onSelectGarment(garment.id)}
                className="rounded-2xl bg-[#14141E] border border-white/5 p-4 flex items-center justify-between hover:border-white/20 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-13 h-13 rounded-xl bg-[#1A1A28] border border-white/5 flex items-center justify-center p-2 group-hover:scale-105 transition-transform">
                    <img
                      src={garment.imageSrc}
                      alt={garment.name}
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm text-white group-hover:text-[#27D07F] transition-colors">
                      {garment.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${garment.statusBg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${garment.dotColor}`} />
                        {garment.status}
                      </span>
                      <span className="text-[11px] text-[#5A586D]">
                        {garment.measurementsCount} pts
                      </span>
                      {garment.commentsCount > 0 && (
                        <span className="text-[11px] text-[#B69EFF]">
                          • {garment.commentsCount} comments
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* CTA Button matching App project item screen.png */}
      <footer className="px-6 pt-3">
        <Button
          onClick={onAddMeasurement}
          variant="default"
          className="w-full h-13 rounded-full bg-[#27D07F] hover:bg-[#22BD73] text-neutral-950 font-bold text-base flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#27D07F]/15"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>Add measurement</span>
        </Button>
      </footer>
    </div>
  );
};
