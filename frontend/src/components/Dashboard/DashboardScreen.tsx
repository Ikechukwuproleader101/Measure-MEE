import React, { useState, useEffect, useCallback } from 'react';
import { Mascot } from '../common/Mascot';
import { 
  ChevronRight, 
  Home, 
  FolderKanban, 
  User, 
  Share2, 
  Clock,
  LogOut,
  Plus,
  AlertCircle,
  RefreshCw,
  Folder,
  X
} from 'lucide-react';
import { DashboardBanner } from './DashboardBanner';
import { getCurrentProject, createProject, type ProjectItem } from '../../lib/api';
import { PillSpinner } from '../common/PillLoader';

interface DashboardScreenProps {
  onStartMeasurement: () => void;
  onOpenProjects: () => void;
  onOpenProjectDetails: (projectId: string) => void;
  onShareLink: () => void;
  onSignOut?: () => void;
  userName?: string;
}

const STAGE_CONFIG: Record<
  ProjectItem['status'],
  { stageLabel: string; stepText: string; activeIdx: number }
> = {
  pending_review: { stageLabel: 'Review stage', stepText: 'Step 1 of 4', activeIdx: 0 },
  cutting: { stageLabel: 'Cutting stage', stepText: 'Step 2 of 4', activeIdx: 1 },
  fitting: { stageLabel: 'Fitting stage', stepText: 'Step 3 of 4', activeIdx: 2 },
  done: { stageLabel: 'Done', stepText: 'Step 4 of 4', activeIdx: 3 },
};

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onStartMeasurement,
  onOpenProjects,
  onOpenProjectDetails,
  onShareLink,
  onSignOut,
  userName = "Ada"
}) => {
  const firstName = userName.trim().split(/\s+/)[0] || userName;

  const [project, setProject] = useState<ProjectItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Create Project Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchCurrentProject = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getCurrentProject();
      setProject(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to load project';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentProject();
  }, [fetchCurrentProject]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newProjectName.trim();
    if (!trimmed || isSubmitting) return;

    if (trimmed.length > 80) {
      setModalError('Project name must be 80 characters or fewer');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      const newProj = await createProject(trimmed);
      setProject(newProj);
      setNewProjectName('');
      setIsCreateModalOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create project';
      setModalError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Hello, {firstName} <span className="animate-pulse">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium">
            Good to see you! Ready for your next bespoke fitting.
          </p>
        </div>

        {/* Rotating Carousel Banner */}
        <DashboardBanner onStartMeasurement={onStartMeasurement} />

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
            {/* Hide See all in empty state */}
            {(isLoading || errorMessage || project !== null) && (
              <button
                type="button"
                onClick={onOpenProjects}
                className="text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                See all
              </button>
            )}
          </div>

          {/* 1. Loading State */}
          {isLoading && (
            <div className="rounded-2xl bg-card p-5 shadow-sm border-0 animate-pulse">
              <div className="flex items-center justify-between gap-4 mb-3.5">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-muted shrink-0" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="h-3 w-20 bg-muted rounded" />
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
              </div>
              <div className="mt-3 pt-3 border-t border-border/40 space-y-2">
                <div className="flex justify-between">
                  <div className="h-3 w-24 bg-muted rounded" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
                <div className="w-full h-2 bg-muted rounded-full" />
              </div>
            </div>
          )}

          {/* 2. Error State */}
          {!isLoading && errorMessage && (
            <div className="rounded-2xl bg-card p-5 shadow-sm border border-destructive/20 text-center flex flex-col items-center justify-center gap-3 animate-fade-in">
              <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Unable to load project</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{errorMessage}</p>
              </div>
              <button
                type="button"
                onClick={fetchCurrentProject}
                className="mt-1 px-4 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* 3. Empty State (No current project) */}
          {!isLoading && !errorMessage && !project && (
            <div className="rounded-2xl bg-card p-6 shadow-sm border-0 text-center flex flex-col items-center justify-center gap-3 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground">
                <Folder className="w-6 h-6 stroke-[1.5]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">No projects yet</h4>
                <p className="text-xs text-muted-foreground mt-0.5 max-w-xs">
                  Tap below to create your first tailoring project.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNewProjectName('');
                  setModalError(null);
                  setIsCreateModalOpen(true);
                }}
                className="mt-2 px-4 py-2 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs tracking-wide transition-all cursor-pointer shadow-sm flex items-center gap-1.5 active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Create Project</span>
              </button>
            </div>
          )}

          {/* 4. Populated State: Has Current Project */}
          {!isLoading && !errorMessage && project && (() => {
            const stage = STAGE_CONFIG[project.status] || STAGE_CONFIG.pending_review;
            const garmentCount = project.measurements?.[0]?.count ?? 0;
            const subtitle = garmentCount === 1 ? '1 garment' : `${garmentCount} garments`;
            const progress = project.progress ?? 25;

            return (
              <div 
                onClick={() => onOpenProjectDetails(project.id)}
                className="rounded-2xl bg-card p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group border-0"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onOpenProjectDetails(project.id);
                  }
                }}
              >
                <div className="flex items-center justify-between gap-4 mb-3.5">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <FolderKanban className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-card-foreground group-hover:text-primary transition-colors">
                        {project.name}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>

                {/* Stepper Progress */}
                <div className="mt-3 pt-3 border-t border-border/40">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
                    <span className="text-primary font-semibold">{stage.stageLabel}</span>
                    <span>{stage.stepText}</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-500" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
                    {['Review', 'Cutting', 'Fitting', 'Done'].map((label, idx) => (
                      <span 
                        key={label}
                        className={
                          idx === stage.activeIdx
                            ? 'text-primary font-bold'
                            : idx < stage.activeIdx
                            ? 'text-foreground font-semibold'
                            : 'text-muted-foreground'
                        }
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </main>

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in"
          onClick={() => !isSubmitting && setIsCreateModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-card border border-border p-6 shadow-2xl relative animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="font-bold text-base text-foreground">New Project</h2>
              <button
                type="button"
                onClick={() => !isSubmitting && setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="homeProjectNameInput" className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Project Name
                </label>
                <input
                  id="homeProjectNameInput"
                  type="text"
                  autoFocus
                  required
                  maxLength={80}
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Ada's Lace"
                  disabled={isSubmitting}
                  className="w-full h-11 px-3.5 rounded-xl bg-secondary/60 border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                />
                <span className="block text-[10px] text-muted-foreground text-right mt-1">
                  {newProjectName.length}/80
                </span>
              </div>

              {modalError && (
                <div className="p-2.5 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 h-10 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newProjectName.trim() || isSubmitting}
                  className="flex-1 h-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all cursor-pointer shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {isSubmitting && <PillSpinner className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
