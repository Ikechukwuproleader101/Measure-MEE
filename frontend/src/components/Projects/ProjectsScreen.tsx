import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  ChevronRight,
  Home,
  FolderKanban,
  User,
  CheckCircle2,
  Clock,
  Folder,
  AlertCircle,
  Archive,
  ArchiveRestore,
  X,
  RefreshCw,
} from 'lucide-react';
import {
  getProjects,
  createProject,
  updateProject,
  type ProjectItem,
} from '../../lib/api';
import { PillSpinner } from '../common/PillLoader';

interface ProjectsScreenProps {
  onBackToHome: () => void;
  onOpenProject: (projectId: string) => void;
  onShareLink: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  pending_review: 'Pending review',
  cutting: 'Cutting',
  fitting: 'Fitting',
  done: 'Done',
};

export const ProjectsScreen: React.FC<ProjectsScreenProps> = ({
  onBackToHome,
  onOpenProject,
  onShareLink,
}) => {
  const [filter, setFilter] = useState<'active' | 'archived'>('active');
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Create Project Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // State to track individual card archiving action
  const [archivingId, setArchivingId] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getProjects(filter === 'archived');
      setProjects(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unable to load projects';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

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
      // If we are currently on the active tab, prepend the new project immediately
      if (filter === 'active') {
        setProjects((prev) => [newProj, ...prev]);
      } else {
        // Switch to active tab so user sees their new project
        setFilter('active');
      }
      setNewProjectName('');
      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to create project';
      setModalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleArchive = async (
    e: React.MouseEvent,
    project: ProjectItem
  ) => {
    e.stopPropagation();
    if (archivingId) return;

    const nextArchived = !project.is_archived;
    setArchivingId(project.id);

    try {
      await updateProject(project.id, { is_archived: nextArchived });
      // Remove from current tab view
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to update project';
      alert(msg);
    } finally {
      setArchivingId(null);
    }
  };

  const getMeasurementSubtitle = (project: ProjectItem) => {
    const count = project.measurements?.[0]?.count ?? 0;
    return `${count} ${count === 1 ? 'Measurement' : 'Measurements'}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-emerald-500/15 text-emerald-400';
      case 'cutting':
        return 'bg-orange-500/15 text-orange-400';
      case 'fitting':
        return 'bg-indigo-500/15 text-indigo-400';
      default:
        return 'bg-primary/15 text-primary';
    }
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-background text-foreground flex flex-col justify-between max-w-lg mx-auto pb-20 select-none">
      {/* Header */}
      <header className="px-6 pt-6 pb-3 flex items-center justify-between">
        <h1 className="font-display font-extrabold text-2xl text-foreground">
          Your Projects
        </h1>
        <button
          onClick={() => {
            setNewProjectName('');
            setModalError(null);
            setIsModalOpen(true);
          }}
          className="w-10 h-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-md shadow-primary/20"
          aria-label="New Project"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>
      </header>

      {/* Filter Tabs */}
      <div className="px-6 py-2 flex items-center gap-2">
        <button
          onClick={() => setFilter('active')}
          className={`px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer border-0 shadow-sm ${
            filter === 'active'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('archived')}
          className={`px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer border-0 shadow-sm ${
            filter === 'archived'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          Archived
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 px-6 py-4 flex flex-col gap-3.5 overflow-y-auto">
        {/* 1. Loading State */}
        {isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
            <PillSpinner className="w-7 h-7 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground font-medium">
              Loading projects...
            </span>
          </div>
        )}

        {/* 2. Error State */}
        {!isLoading && errorMessage && (
          <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-destructive/15 border border-destructive/25 flex items-center justify-center text-destructive mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-sm font-bold text-foreground">
              Unable to load projects
            </h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
              {errorMessage}
            </p>
            <button
              onClick={fetchProjects}
              className="mt-4 px-4 py-2 rounded-full bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* 3. Empty State (New User / No Projects in this tab) */}
        {!isLoading && !errorMessage && projects.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
            {/* Spot left clean for user-provided illustration */}
            <div className="w-20 h-20 rounded-3xl bg-secondary/40 border border-border/50 flex items-center justify-center text-muted-foreground/60 mb-4 shadow-inner">
              <Folder className="w-10 h-10 stroke-[1.5]" />
            </div>
            <h2 className="text-base font-bold text-foreground">
              {filter === 'active' ? 'No projects yet' : 'No archived projects'}
            </h2>
            <p className="text-xs text-muted-foreground mt-1.5 max-w-xs leading-relaxed">
              {filter === 'active'
                ? 'Tap the + button above to create your first tailoring project.'
                : 'Projects you archive will appear here.'}
            </p>
            {filter === 'active' && (
              <button
                onClick={() => {
                  setNewProjectName('');
                  setModalError(null);
                  setIsModalOpen(true);
                }}
                className="mt-5 px-5 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs tracking-wide transition-all cursor-pointer shadow-md shadow-primary/20 flex items-center gap-1.5 active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Create Project</span>
              </button>
            )}
          </div>
        )}

        {/* 4. Populated State */}
        {!isLoading &&
          !errorMessage &&
          projects.length > 0 &&
          projects.map((project) => {
            const statusLabel =
              STATUS_LABELS[project.status] || 'Pending review';
            const progress = project.progress ?? 25;
            const isDone = project.status === 'done' || progress === 100;
            const folderColorClass = getStatusColor(project.status);

            return (
              <div
                key={project.id}
                onClick={() => onOpenProject(project.id)}
                className="rounded-2xl bg-card p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group text-card-foreground border-0 relative"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${folderColorClass}`}
                    >
                      <Folder className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-card-foreground group-hover:text-primary transition-colors truncate">
                        {project.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {getMeasurementSubtitle(project)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Archive / Restore Button */}
                    <button
                      type="button"
                      title={
                        project.is_archived
                          ? 'Restore to active'
                          : 'Archive project'
                      }
                      onClick={(e) => handleToggleArchive(e, project)}
                      disabled={archivingId === project.id}
                      className="w-8 h-8 rounded-full bg-secondary/40 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer disabled:opacity-50"
                    >
                      {project.is_archived ? (
                        <ArchiveRestore className="w-3.5 h-3.5" />
                      ) : (
                        <Archive className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </div>

                {/* Progress indicator */}
                <div className="mt-3.5 pt-3.5 border-t border-border/40">
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="text-muted-foreground flex items-center gap-1 font-medium">
                      {isDone ? (
                        <CheckCircle2 className="w-3 h-3 text-primary" />
                      ) : (
                        <Clock className="w-3 h-3 text-accent" />
                      )}
                      {statusLabel}
                    </span>
                    <span className="text-muted-foreground font-semibold">
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isDone ? 'bg-primary' : 'bg-accent'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
      </main>

      {/* Create Project Modal / Dialog */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in"
          onClick={() => !isSubmitting && setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-card border border-border p-6 shadow-2xl relative animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="font-bold text-base text-foreground">
                New Project
              </h2>
              <button
                type="button"
                onClick={() => !isSubmitting && setIsModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="projectNameInput"
                  className="block text-xs font-semibold text-foreground/80 mb-1.5"
                >
                  Project Name
                </label>
                <input
                  id="projectNameInput"
                  type="text"
                  autoFocus
                  required
                  maxLength={80}
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Wedding Suit"
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
                  onClick={() => setIsModalOpen(false)}
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
                  {isSubmitting && (
                    <PillSpinner className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>{isSubmitting ? 'Creating...' : 'Create'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-card/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.12)] px-6 py-3 flex items-center justify-around z-30 border-0">
        <button
          onClick={onBackToHome}
          className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium">Home</span>
        </button>

        <button className="flex flex-col items-center gap-1 text-primary cursor-pointer">
          <FolderKanban className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Projects</span>
        </button>

        <button
          onClick={onShareLink}
          className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </nav>
    </div>
  );
};
