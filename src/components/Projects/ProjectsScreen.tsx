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
      statusColor: 'text-[#27D07F]',
      badge: 'Active'
    },
    {
      id: 'casual-fit',
      title: 'Casual Fit',
      subtitle: '2 Measurements • Completed',
      folderColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
      progress: 100,
      stage: 'Done',
      statusColor: 'text-[#27D07F]',
      badge: 'Completed'
    },
    {
      id: 'traditional-attire',
      title: 'Traditional Attire',
      subtitle: '1 Garment • In review',
      folderColor: 'bg-[#B69EFF]/15 text-[#B69EFF] border-[#B69EFF]/20',
      progress: 25,
      stage: 'Pending review',
      statusColor: 'text-[#B69EFF]',
      badge: 'Pending'
    }
  ];

  return (
    <div className="relative w-full h-full min-h-screen bg-[#0A0A0E] text-white flex flex-col justify-between max-w-lg mx-auto pb-20">
      {/* Header */}
      <header className="px-6 pt-6 pb-3 flex items-center justify-between">
        <h1 className="font-display font-extrabold text-2xl text-white">Your Projects</h1>
        <button
          onClick={() => alert('New Project Dialog')}
          className="w-10 h-10 rounded-full bg-[#27D07F] hover:bg-[#22BD73] text-neutral-950 flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-md shadow-[#27D07F]/20"
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
              ? 'bg-[#27D07F] text-neutral-950'
              : 'bg-[#14141E] text-[#8E8CA3] hover:text-white border border-white/5'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('archived')}
          className={`px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            filter === 'archived'
              ? 'bg-[#27D07F] text-neutral-950'
              : 'bg-[#14141E] text-[#8E8CA3] hover:text-white border border-white/5'
          }`}
        >
          Archived
        </button>
      </div>

      {/* Projects List matching App projects screen.png */}
      <main className="flex-1 px-6 py-4 flex flex-col gap-3.5 overflow-y-auto">
        {projects.map((project) => (
          <div
            key={project.id}
            onClick={() => onOpenProject(project.id)}
            className="rounded-2xl bg-[#14141E] border border-white/5 p-4 hover:border-white/20 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${project.folderColor}`}>
                  <Folder className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-white group-hover:text-[#27D07F] transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-xs text-[#8E8CA3] mt-0.5">{project.subtitle}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white transition-colors" />
            </div>

            {/* Progress indicator */}
            <div className="mt-3 pt-3 border-t border-white/5">
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="text-[#8E8CA3] flex items-center gap-1">
                  {project.progress === 100 ? (
                    <CheckCircle2 className="w-3 h-3 text-[#27D07F]" />
                  ) : (
                    <Clock className="w-3 h-3 text-[#B69EFF]" />
                  )}
                  {project.stage}
                </span>
                <span className="text-white/60 font-medium">{project.progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    project.progress === 100 ? 'bg-[#27D07F]' : 'bg-orange-400'
                  }`}
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-[#0A0A0E]/95 backdrop-blur-md border-t border-white/10 px-6 py-2.5 flex items-center justify-around z-30">
        <button 
          onClick={onBackToHome}
          className="flex flex-col items-center gap-1 text-[#8E8CA3] hover:text-white cursor-pointer"
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium">Home</span>
        </button>

        <button className="flex flex-col items-center gap-1 text-[#27D07F] cursor-pointer">
          <FolderKanban className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Projects</span>
        </button>

        <button 
          onClick={onShareLink}
          className="flex flex-col items-center gap-1 text-[#8E8CA3] hover:text-white cursor-pointer"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </nav>
    </div>
  );
};
