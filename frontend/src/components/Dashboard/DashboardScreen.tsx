import React from 'react';
import { Mascot } from '../common/Mascot';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Camera, 
  ChevronRight, 
  Home, 
  FolderKanban, 
  User, 
  Share2, 
  Sparkles,
  ArrowRight,
  Clock,
  LogOut
} from 'lucide-react';

interface DashboardScreenProps {
  onStartMeasurement: () => void;
  onOpenProjects: () => void;
  onOpenProjectDetails: (projectId: string) => void;
  onShareLink: () => void;
  onSignOut?: () => void;
  userName?: string;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onStartMeasurement,
  onOpenProjects,
  onOpenProjectDetails,
  onShareLink,
  onSignOut,
  userName = "Ada"
}) => {
  return (
    <div className="relative w-full h-full min-h-screen bg-[#0A0A0E] text-white flex flex-col justify-between max-w-lg mx-auto pb-20">
      {/* Top Header */}
      <header className="px-6 pt-5 pb-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Mascot size={26} color="purple" />
          <span className="font-display font-bold text-lg tracking-tight text-white">
            Measure <span className="text-[#27D07F]">Me</span>
          </span>
        </div>

        {/* Tailor/Client Profile & Share link button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onShareLink}
            className="w-9 h-9 rounded-full bg-[#161624] border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:border-[#27D07F]/40 transition-colors cursor-pointer"
            title="Share client link"
            aria-label="Share client link"
          >
            <Share2 className="w-4 h-4 text-[#27D07F]" />
          </button>

          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#B69EFF] to-[#27D07F] p-0.5">
            <div className="w-full h-full rounded-full bg-[#14141E] flex items-center justify-center font-bold text-xs text-white">
              {userName.slice(0, 2).toUpperCase()}
            </div>
          </div>

          {onSignOut && (
            <button
              onClick={onSignOut}
              className="w-9 h-9 rounded-full bg-[#161624] border border-white/10 flex items-center justify-center text-white/60 hover:text-red-400 hover:border-red-500/40 transition-colors cursor-pointer ml-1"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-6 py-3 flex flex-col gap-5 overflow-y-auto">
        {/* Welcome Greeting matching App onboarding 4.png */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display flex items-center gap-2">
            Hello, {userName} <span className="animate-pulse">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8E8CA3] mt-1 font-medium">
            Good to see you! Ready for your next bespoke fitting.
          </p>
        </div>

        {/* Hero Card: Start a new measurement */}
        <div className="relative rounded-3xl bg-gradient-to-br from-[#8C6BFA] to-[#B69EFF] p-6 text-neutral-950 overflow-hidden shadow-xl shadow-[#8C6BFA]/20 group">
          {/* Background pattern */}
          <div className="absolute right-0 bottom-0 top-0 w-44 pointer-events-none flex items-center justify-end pr-2 opacity-95">
            <img
              src="/images/illustrations/man-standing.png"
              alt="Scan Model"
              className="h-44 object-contain drop-shadow-md transform transition-transform group-hover:scale-105"
            />
          </div>

          <div className="relative z-10 max-w-[62%]">
            <Badge variant="secondary" className="bg-black/20 text-neutral-950 border-black/10 font-bold mb-2">
              <Sparkles className="w-3 h-3" />
              Camera Capture
            </Badge>

            <h2 className="text-xl sm:text-2xl font-black leading-tight font-display tracking-tight text-neutral-950">
              Start a new measurement
            </h2>

            <p className="text-xs text-neutral-900/80 font-medium mt-1 leading-relaxed">
              Capture your 3D contours in under 15 seconds.
            </p>

            <Button
              onClick={onStartMeasurement}
              variant="default"
              size="sm"
              className="mt-4 bg-[#0A0A0E] hover:bg-neutral-900 text-white rounded-full text-xs font-bold px-4 py-2 flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-[#27D07F]" />
              <span>Launch Scan</span>
              <ArrowRight className="w-3 h-3 text-white/60 ml-0.5" />
            </Button>
          </div>
        </div>

        {/* Infrastructure Stat recap per brief Part 2 line 81 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#14141E] border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-xs text-[#8E8CA3] font-medium">Pending Reviews</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-white font-display">2</span>
              <span className="text-[11px] text-[#B69EFF]">Garments</span>
            </div>
            <span className="text-[10px] text-[#5A586D] mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#27D07F]" /> Updated 20m ago
            </span>
          </div>

          <div className="bg-[#14141E] border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-xs text-[#8E8CA3] font-medium">Link Status</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-[#27D07F] font-display">46h</span>
              <span className="text-[11px] text-white/70">Remaining</span>
            </div>
            <button 
              onClick={onShareLink}
              className="text-[10px] text-[#27D07F] hover:underline mt-1 font-semibold text-left cursor-pointer"
            >
              Share link →
            </button>
          </div>
        </div>

        {/* Your Projects Section matching App onboarding 4.png */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-base text-white">Your Projects</h3>
            <button
              onClick={onOpenProjects}
              className="text-xs font-semibold text-[#27D07F] hover:underline cursor-pointer"
            >
              See all
            </button>
          </div>

          {/* Active Project Card */}
          <div 
            onClick={() => onOpenProjectDetails('wedding-suit')}
            className="rounded-2xl bg-[#14141E] border border-white/5 p-4 hover:border-white/15 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center text-orange-400">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-white group-hover:text-[#B69EFF] transition-colors">
                    Wedding Suit
                  </h4>
                  <p className="text-xs text-[#8E8CA3]">4 Measurements • 3 options</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
            </div>

            {/* Stepper progress */}
            <div className="mt-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between text-[11px] text-[#8E8CA3] mb-1.5">
                <span className="text-[#27D07F] font-semibold">Cutting stage</span>
                <span>Step 2 of 4</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="w-[50%] h-full bg-[#27D07F] rounded-full" />
              </div>
              <div className="flex justify-between text-[10px] text-[#5A586D] mt-2">
                <span className="text-white/80 font-medium">Review</span>
                <span className="text-[#27D07F] font-bold">Cutting</span>
                <span>Fitting</span>
                <span>Done</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-[#0A0A0E]/95 backdrop-blur-md border-t border-white/10 px-6 py-2.5 flex items-center justify-around z-30">
        <button className="flex flex-col items-center gap-1 text-[#27D07F] cursor-pointer">
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Home</span>
        </button>

        <button 
          onClick={onOpenProjects}
          className="flex flex-col items-center gap-1 text-[#8E8CA3] hover:text-white transition-colors cursor-pointer"
        >
          <FolderKanban className="w-5 h-5" />
          <span className="text-[10px] font-medium">Projects</span>
        </button>

        <button 
          onClick={onShareLink}
          className="flex flex-col items-center gap-1 text-[#8E8CA3] hover:text-white transition-colors cursor-pointer"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </nav>
    </div>
  );
};
