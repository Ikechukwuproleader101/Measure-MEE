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
    <div className="relative w-full h-full min-h-screen bg-background text-foreground flex flex-col justify-between max-w-lg mx-auto pb-24 font-sans select-none">
      {/* Top Header - Clean, Flat, No Harsh Borders */}
      <header className="px-6 pt-5 pb-3 flex items-center justify-between z-10 w-full">
        <div className="flex items-center gap-2.5">
          <Mascot size={26} color="purple" />
          <span className="font-display font-bold text-lg tracking-tight text-foreground">
            Measure <span className="text-primary">Me</span>
          </span>
        </div>

        {/* Tailor/Client Profile & Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onShareLink}
            className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center text-foreground hover:bg-muted transition-colors cursor-pointer active:scale-95"
            title="Share client link"
            aria-label="Share client link"
          >
            <Share2 className="w-4 h-4 text-primary" />
          </button>

          {/* User Avatar Badge - Flat Solid Color (No Gradients) */}
          <div 
            className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center font-bold text-xs text-primary shrink-0 select-none shadow-sm"
            aria-label={`Logged in as ${userName}`}
          >
            {userName.slice(0, 2).toUpperCase()}
          </div>

          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer active:scale-95 ml-0.5"
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
        {/* Welcome Greeting */}
        <div className="pt-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-display flex items-center gap-2">
            Hello, {userName} <span className="animate-pulse">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium">
            Good to see you! Ready for your next bespoke fitting.
          </p>
        </div>

        {/* Hero Card: Flat Solid Color (No Gradients, No Harsh Borders) */}
        <div className="relative rounded-3xl bg-primary p-6 text-primary-foreground overflow-hidden shadow-md shadow-primary/20 group">
          {/* Background Illustration */}
          <div className="absolute right-0 bottom-0 top-0 w-44 pointer-events-none flex items-center justify-end pr-2 opacity-95">
            <img
              src="/images/illustrations/man-standing.png"
              alt="Scan Model"
              className="h-44 object-contain drop-shadow-md transform transition-transform group-hover:scale-105"
            />
          </div>

          <div className="relative z-10 max-w-[62%]">
            <Badge 
              variant="secondary" 
              className="bg-black/20 text-white border-0 font-bold mb-2.5 rounded-full px-3 py-1 inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3 h-3" />
              Camera Capture
            </Badge>

            <h2 className="text-xl sm:text-2xl font-black leading-tight font-display tracking-tight text-white">
              Start a new measurement
            </h2>

            <p className="text-xs text-white/90 font-medium mt-1.5 leading-relaxed">
              Capture your 3D contours in under 15 seconds.
            </p>

            <Button
              onClick={onStartMeasurement}
              variant="secondary"
              size="sm"
              className="mt-5 h-11 bg-card hover:bg-card/90 text-card-foreground rounded-full text-xs font-bold px-5 py-2.5 flex items-center gap-2 shadow-sm cursor-pointer transition-all active:scale-95 border-0"
            >
              <Camera className="w-4 h-4 text-primary" />
              <span>Launch Scan</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-60 ml-0.5" />
            </Button>
          </div>
        </div>

        {/* Infrastructure Stat Cards - Flat, Elevated, No Borders, Fixed-Size Badges */}
        <div className="grid grid-cols-2 gap-3.5">
          {/* Stat 1: Pending Reviews */}
          <div className="bg-card rounded-2xl p-5 shadow-sm border-0 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-semibold">Pending Reviews</span>
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-card-foreground font-display">2</span>
                <span className="text-xs text-primary font-bold">Garments</span>
              </div>
              <span className="text-[11px] text-muted-foreground mt-1 block">
                Updated 20m ago
              </span>
            </div>
          </div>

          {/* Stat 2: Link Status */}
          <div className="bg-card rounded-2xl p-5 shadow-sm border-0 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-semibold">Link Status</span>
              <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0">
                <Share2 className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-primary font-display">46h</span>
                <span className="text-xs text-muted-foreground font-semibold">Remaining</span>
              </div>
              <button 
                type="button"
                onClick={onShareLink}
                className="text-[11px] text-primary hover:underline mt-1 font-semibold text-left cursor-pointer block"
              >
                Share client link →
              </button>
            </div>
          </div>
        </div>

        {/* Your Projects Section - Clean Flat Card & Consistent Badges */}
        <div>
          <div className="flex items-center justify-between mb-3 px-0.5">
            <h3 className="font-display font-bold text-base text-foreground">Your Projects</h3>
            <button
              type="button"
              onClick={onOpenProjects}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              See all
            </button>
          </div>

          {/* Active Project Card - Borderless, Soft Elevation, Fixed Icon Badge */}
          <div 
            onClick={() => onOpenProjectDetails('wedding-suit')}
            className="rounded-2xl bg-card p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group border-0"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onOpenProjectDetails('wedding-suit');
              }
            }}
          >
            <div className="flex items-center justify-between gap-4 mb-3.5">
              <div className="flex items-center gap-3.5">
                {/* Fixed-Size Circular Badge matching Principle 3 */}
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-card-foreground group-hover:text-primary transition-colors">
                    Wedding Suit
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">4 Measurements • 3 options</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>

            {/* Stepper Progress */}
            <div className="mt-3 pt-3 border-t border-border/40">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
                <span className="text-primary font-semibold">Cutting stage</span>
                <span>Step 2 of 4</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div className="w-[50%] h-full bg-primary rounded-full transition-all duration-500" />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
                <span className="text-foreground font-semibold">Review</span>
                <span className="text-primary font-bold">Cutting</span>
                <span>Fitting</span>
                <span>Done</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation Bar - Elevated, No Harsh Borders */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-card/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.12)] px-6 py-3 flex items-center justify-around z-30 border-0">
        <button 
          type="button"
          className="flex flex-col items-center gap-1 text-primary cursor-pointer active:scale-95 transition-transform"
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold">Home</span>
        </button>

        <button 
          type="button"
          onClick={onOpenProjects}
          className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer active:scale-95"
        >
          <FolderKanban className="w-5 h-5" />
          <span className="text-[10px] font-medium">Projects</span>
        </button>

        <button 
          type="button"
          onClick={onShareLink}
          className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer active:scale-95"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </nav>
    </div>
  );
};

export default DashboardScreen;
