import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { 
  ArrowLeft, 
  ChevronRight, 
  Plus, 
  Share2, 
  MessageSquare,
  AlertCircle,
  Scissors,
  X
} from 'lucide-react';
import { getProject, addProjectMeasurement, type ProjectDetail } from '../../lib/api';
import { PillSpinner } from '../common/PillLoader';

interface ProjectDetailsScreenProps {
  projectId?: string;
  onBack: () => void;
  onSelectGarment: (garmentId: string) => void;
  onAddMeasurement?: () => void;
  onOpenComments: () => void;
  onShareLink: () => void;
}

const STEPS: { key: ProjectDetail['status']; label: string; stepNum: number }[] = [
  { key: 'pending_review', label: 'Review', stepNum: 1 },
  { key: 'cutting', label: 'Cutting', stepNum: 2 },
  { key: 'fitting', label: 'Fitting', stepNum: 3 },
  { key: 'done', label: 'Done', stepNum: 4 },
];

export const ProjectDetailsScreen: React.FC<ProjectDetailsScreenProps> = ({
  projectId,
  onBack,
  onSelectGarment,
  onOpenComments,
  onShareLink,
}) => {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Add Measurement Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMeasurementDescription, setNewMeasurementDescription] = useState('');
  const [isSubmittingMeasurement, setIsSubmittingMeasurement] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    if (!projectId) {
      setIsLoading(false);
      setError('Project not found');
      return;
    }

    setIsLoading(true);
    setError(null);

    getProject(projectId)
      .then((data) => {
        if (!isCancelled) {
          setProject(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(err?.message || 'Project not found');
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [projectId]);

  const handleAddMeasurementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMeasurementDescription.trim();
    if (!trimmed || isSubmittingMeasurement || !projectId) return;

    if (trimmed.length > 80) {
      setModalError('Description must be 80 characters or fewer');
      return;
    }

    setIsSubmittingMeasurement(true);
    setModalError(null);

    try {
      const newMeasurement = await addProjectMeasurement(projectId, trimmed);
      setProject((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          measurements: [...(prev.measurements || []), newMeasurement],
        };
      });
      setNewMeasurementDescription('');
      setIsAddModalOpen(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to add measurement';
      setModalError(message);
    } finally {
      setIsSubmittingMeasurement(false);
    }
  };

  if (error || (!isLoading && !project)) {
    return (
      <div className="relative w-full h-full min-h-screen bg-background text-foreground flex flex-col justify-between max-w-lg mx-auto pb-6">
        <header className="px-6 pt-6 pb-2 flex items-center justify-between">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground/80 hover:text-foreground hover:bg-muted transition-all cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 px-6 py-12 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-full bg-muted/60 border border-border flex items-center justify-center text-muted-foreground mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h1 className="font-display font-bold text-xl sm:text-2xl text-foreground">
            Project not found
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs">
            This project could not be found or you do not have permission to view it.
          </p>
          <Button onClick={onBack} variant="outline" className="mt-6 rounded-xl cursor-pointer">
            Back to projects
          </Button>
        </main>
      </div>
    );
  }

  const measurements = project?.measurements || [];
  const garmentCount = measurements.length;
  const subtitleText = garmentCount === 1 ? '1 garment' : `${garmentCount} garments`;

  const currentStepIdx = project
    ? Math.max(0, STEPS.findIndex((s) => s.key === project.status))
    : 0;
  const currentStep = STEPS[currentStepIdx] || STEPS[0];
  const isCompleted = project?.status === 'done';

  return (
    <div className="relative w-full h-full min-h-screen bg-background text-foreground flex flex-col justify-between max-w-lg mx-auto pb-6">
      {/* Top Header */}
      <header className="px-6 pt-6 pb-2 flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground/80 hover:text-foreground hover:bg-muted transition-all cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenComments}
            className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground/80 hover:text-primary transition-colors cursor-pointer"
            aria-label="Comments"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <button
            onClick={onShareLink}
            className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground/80 hover:text-primary transition-colors cursor-pointer"
            aria-label="Share Link"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-2 flex flex-col gap-5 overflow-y-auto">
        {/* Project Title & Stepper */}
        <div>
          {isLoading ? (
            <div>
              <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
              <div className="h-4 w-24 bg-muted animate-pulse rounded mt-2" />
              <div className="mt-4 p-4 bg-card border border-border rounded-2xl animate-pulse h-24" />
            </div>
          ) : (
            <div>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground">
                {project?.name}
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                {subtitleText}
              </p>

              {/* Stepper pills */}
              <div className="mt-4 p-3 bg-card border border-border rounded-2xl text-card-foreground">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-primary">
                    Step {currentStep.stepNum}: {currentStep.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {isCompleted ? 'Completed' : 'In progress'}
                  </span>
                </div>

                {/* Stepper bar */}
                <div className="flex items-center gap-1.5">
                  {STEPS.map((step, idx) => (
                    <div
                      key={step.key}
                      className={`flex-1 h-2 rounded-full transition-colors ${
                        idx <= currentStepIdx ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex justify-between text-[10px] text-muted-foreground mt-2 font-medium">
                  {STEPS.map((step, idx) => {
                    const isCurrent = idx === currentStepIdx;
                    const isPast = idx < currentStepIdx;
                    return (
                      <span
                        key={step.key}
                        className={
                          isCurrent
                            ? 'text-primary font-bold'
                            : isPast
                            ? 'text-foreground font-medium'
                            : 'text-muted-foreground'
                        }
                      >
                        {step.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Garments List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-base text-foreground">Garments</h2>
            {!isLoading && measurements.length > 0 && (
              <span className="text-xs text-muted-foreground">Select to view canvas</span>
            )}
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-2xl bg-card border border-border p-4 flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-muted" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-28 bg-muted rounded" />
                      <div className="h-3 w-14 bg-muted rounded" />
                    </div>
                  </div>
                  <div className="w-4 h-4 bg-muted rounded-full" />
                </div>
              ))}
            </div>
          ) : measurements.length === 0 ? (
            <div className="rounded-2xl bg-card border border-border p-8 text-center flex flex-col items-center justify-center gap-2 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground mb-1">
                <Scissors className="w-5 h-5 stroke-[1.5]" />
              </div>
              <h3 className="font-bold text-sm text-foreground">No garments yet</h3>
              <p className="text-xs text-muted-foreground max-w-xs">
                Tap Add measurement to add your first one.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {measurements.map((m) => {
                const ptCount = Object.keys(m.data || {}).length;
                return (
                  <div
                    key={m.id}
                    onClick={() => onSelectGarment(m.id)}
                    className="rounded-2xl bg-card border border-border p-4 flex items-center justify-between hover:border-primary/30 transition-all cursor-pointer group text-card-foreground"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-muted border border-border flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                        <Scissors className="w-5 h-5 stroke-[1.5]" />
                      </div>

                      <div>
                        <h3 className="font-semibold text-sm text-card-foreground group-hover:text-primary transition-colors">
                          {m.description}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {ptCount} pts
                        </p>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* CTA Button */}
      <footer className="px-6 pt-3">
        <Button
          onClick={() => {
            setNewMeasurementDescription('');
            setModalError(null);
            setIsAddModalOpen(true);
          }}
          variant="default"
          className="w-full h-13 cursor-pointer"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>Add measurement</span>
        </Button>
      </footer>

      {/* Add Measurement Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in"
          onClick={() => !isSubmittingMeasurement && setIsAddModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-card border border-border p-6 shadow-2xl relative animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="font-bold text-base text-foreground">
                Add Measurement
              </h2>
              <button
                type="button"
                onClick={() => !isSubmittingMeasurement && setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMeasurementSubmit} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="measurementDescriptionInput"
                  className="block text-xs font-semibold text-foreground/80 mb-1.5"
                >
                  What is this for?
                </label>
                <input
                  id="measurementDescriptionInput"
                  type="text"
                  autoFocus
                  required
                  maxLength={80}
                  value={newMeasurementDescription}
                  onChange={(e) => setNewMeasurementDescription(e.target.value)}
                  placeholder="e.g. Gown, Jacket, Trousers"
                  disabled={isSubmittingMeasurement}
                  className="w-full h-11 px-3.5 rounded-xl bg-secondary/60 border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                />
                <span className="block text-[10px] text-muted-foreground text-right mt-1">
                  {newMeasurementDescription.length}/80
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
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmittingMeasurement}
                  className="flex-1 h-10 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newMeasurementDescription.trim() || isSubmittingMeasurement}
                  className="flex-1 h-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all cursor-pointer shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {isSubmittingMeasurement && (
                    <PillSpinner className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>Create</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
