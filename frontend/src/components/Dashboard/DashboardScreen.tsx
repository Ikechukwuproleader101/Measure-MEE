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
    <div className="relative w-full h-full min-h-screen bg-background text-foreground flex flex-col justify-between max-w-lg mx-auto pb-20">
      {/* Top Header */}
      <header className="px-6 pt-5 pb-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Mascot size={26} color="purple" />
          <span className="font-display font-bold text-lg tracking-tight text-foreground">
            Measure <span className="text-primary">Me</span>
          </span>
        </div>

        {/* Tailor/Client Profile & Share link button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onShareLink}
            className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center text-foreground/80 hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer"
            title="Share client link"
            aria-label="Share client link"
          >
            <Share2 className="w-4 h-4 text-primary" />
          </button>

          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-accent p-0.5">
            <div className="w-full h-full rounded-full bg-card flex items-center justify-center font-bold text-xs text-card-foreground">
              {userName.slice(0, 2).toUpperCase()}
            </div>
          </div>

          {onSignOut && (
            <button
              onClick={onSignOut}
              className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors cursor-pointer ml-1"
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
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-display flex items-center gap-2">
            Hello, {userName} <span className="animate-pulse">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium">
            Good to see you! Ready for your next bespoke fitting.
          </p>
        </div>

        {/* Hero Card: Start a new measurement */}
        <div className="relative rounded-3xl bg-gradient-to-br from-primary to-accent p-6 text-primary-foreground overflow-hidden shadow-xl shadow-primary/20 group">
          {/* Background pattern */}
          <div className="absolute right-0 bottom-0 top-0 w-44 pointer-events-none flex items-center justify-end pr-2 opacity-95">
            <img
              src="/images/illustrations/man-standing.png"
              alt="Scan Model"
              className="h-44 object-contain drop-shadow-md transform transition-transform group-hover:scale-105"
            />
          </div>

          <div className="relative z-10 max-w-[62%]">
            <Badge variant="secondary" className="bg-black/20 text-white border-black/10 font-bold mb-2">
              <Sparkles className="w-3 h-3" />
              Camera Capture
            </Badge>

            <h2 className="text-xl sm:text-2xl font-black leading-tight font-display tracking-tight text-white">
              Start a new measurement
            </h2>

            <p className="text-xs text-white/90 font-medium mt-1 leading-relaxed">
              Capture your 3D contours in under 15 seconds.
            </p>

            <Button
              onClick={onStartMeasurement}
              variant="secondary"
              size="sm"
              className="mt-4 bg-card hover:bg-card/90 text-card-foreground rounded-full text-xs font-bold px-4 py-2 flex items-center gap-1.5 shadow-md cursor-pointer border border-border/40"
            >
              <Camera className="w-3.5 h-3.5 text-primary" />
              <span>Launch Scan</span>
              <ArrowRight className="w-3 h-3 opacity-60 ml-0.5" />
            </Button>
          </div>
        </div>

        {/* Infrastructure Stat recap */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-xs text-muted-foreground font-medium">Pending Reviews</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-card-foreground font-display">2</span>
              <span className="text-[11px] text-primary">Garments</span>
            </div>
            <span className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-primary" /> Updated 20m ago
            </span>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-xs text-muted-foreground font-medium">Link Status</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-primary font-display">46h</span>
              <span className="text-[11px] text-muted-foreground">Remaining</span>
            </div>
            <button 
              onClick={onShareLink}
              className="text-[10px] text-primary hover:underline mt-1 font-semibold text-left cursor-pointer"
            >
              Share link →
            </button>
          </div>
        </div>

        {/* Your Projects Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-base text-foreground">Your Projects</h3>
            <button
              onClick={onOpenProjects}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              See all
            </button>
          </div>

          {/* Active Project Card */}
          <div 
            onClick={() => onOpenProjectDetails('wedding-suit')}
            className="rounded-2xl bg-card border border-border p-4 hover:border-primary/30 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center text-primary">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-card-foreground group-hover:text-primary transition-colors">
                    Wedding Suit
                  </h4>
                  <p className="text-xs text-muted-foreground">4 Measurements • 3 options</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>

            {/* Stepper progress */}
            <div className="mt-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
                <span className="text-primary font-semibold">Cutting stage</span>
                <span>Step 2 of 4</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="w-[50%] h-full bg-primary rounded-full" />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
                <span className="text-foreground font-medium">Review</span>
                <span className="text-primary font-bold">Cutting</span>
                <span>Fitting</span>
                <span>Done</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-card/95 backdrop-blur-md border-t border-border px-6 py-2.5 flex items-center justify-around z-30">
        <button className="flex flex-col items-center gap-1 text-primary cursor-pointer">
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Home</span>
        </button>

        <button 
          onClick={onOpenProjects}
          className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <FolderKanban className="w-5 h-5" />
          <span className="text-[10px] font-medium">Projects</span>
        </button>

        <button 
          onClick={onShareLink}
          className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </nav>
    </div>
  );
};
