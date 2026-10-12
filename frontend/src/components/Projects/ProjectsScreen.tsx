import React, { useState } from 'react';
import { 
  Plus, 
  ChevronRight, 
  Home, 
  FolderKanban, 
  User, 
  CheckCircle2, 
  Clock, 
  Folder
} from 'lucide-react';

interface ProjectsScreenProps {
  onBackToHome: () => void;
  onOpenProject: (projectId: string) => void;
  onShareLink: () => void;
}

export const ProjectsScreen: React.FC<ProjectsScreenProps> = ({
  onBackToHome,
  onOpenProject,
  onShareLink
}) => {
  const [filter, setFilter] = useState<'active' | 'archived'>('active');

  const projects = [
    {
      id: 'wedding-suit',
      title: 'Wedding Suit',
      subtitle: '4 Measurements • 3 options',
      folderColor: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
      progress: 50,
      stage: 'Cutting',
      statusColor: 'text-primary',
      badge: 'Active'
    },
    {
      id: 'casual-fit',
      title: 'Casual Fit',
      subtitle: '2 Measurements • Completed',
      folderColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
      progress: 100,
      stage: 'Done',
      statusColor: 'text-primary',
      badge: 'Completed'
    },
    {
      id: 'traditional-attire',
      title: 'Traditional Attire',
      subtitle: '1 Garment • In review',
      folderColor: 'bg-accent/15 text-accent border-accent/20',
      progress: 25,
      stage: 'Pending review',
      statusColor: 'text-accent',
      badge: 'Pending'
    }
  ];

  return (
    <div className="relative w-full h-full min-h-screen bg-background text-foreground flex flex-col justify-between max-w-lg mx-auto pb-20">
      {/* Header */}
      <header className="px-6 pt-6 pb-3 flex items-center justify-between">
        <h1 className="font-display font-extrabold text-2xl text-foreground">Your Projects</h1>
        <button
          onClick={() => alert('New Project Dialog')}
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
          className={`px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            filter === 'active'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('archived')}
          className={`px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            filter === 'archived'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border'
          }`}
        >
          Archived
        </button>
      </div>

      {/* Projects List */}
      <main className="flex-1 px-6 py-4 flex flex-col gap-3.5 overflow-y-auto">
        {projects.map((project) => (
          <div
            key={project.id}
            onClick={() => onOpenProject(project.id)}
            className="rounded-2xl bg-card border border-border p-4 hover:border-primary/30 transition-all cursor-pointer group text-card-foreground"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${project.folderColor}`}>
                  <Folder className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-card-foreground group-hover:text-primary transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{project.subtitle}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>

            {/* Progress indicator */}
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="text-muted-foreground flex items-center gap-1">
                  {project.progress === 100 ? (
                    <CheckCircle2 className="w-3 h-3 text-primary" />
                  ) : (
                    <Clock className="w-3 h-3 text-accent" />
                  )}
                  {project.stage}
                </span>
                <span className="text-muted-foreground font-medium">{project.progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    project.progress === 100 ? 'bg-primary' : 'bg-accent'
                  }`}
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-card/95 backdrop-blur-md border-t border-border px-6 py-2.5 flex items-center justify-around z-30">
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
