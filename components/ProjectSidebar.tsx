import React from 'react';
import { Project } from '../types';
import { PlusIcon } from './icons/PlusIcon';

interface ProjectSidebarProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onNewProjectClick: () => void;
}

const ProjectSidebar: React.FC<ProjectSidebarProps> = ({ projects, activeProjectId, onSelectProject, onNewProjectClick }) => {
  return (
    <aside className="w-64 bg-gray-800 flex flex-col p-4 border-r border-gray-700">
      <h2 className="text-lg font-semibold text-gray-300 mb-4">Projects</h2>
      <nav className="flex-1 space-y-2">
        {projects.map(project => (
          <button
            key={project.id}
            onClick={() => onSelectProject(project.id)}
            className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
              project.id === activeProjectId
                ? 'bg-cyan-600 text-white font-semibold'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {project.name}
          </button>
        ))}
      </nav>
      <button
        onClick={onNewProjectClick}
        className="mt-4 flex items-center justify-center gap-2 w-full px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors text-gray-300"
      >
        <PlusIcon />
        New Project
      </button>
    </aside>
  );
};

export default ProjectSidebar;
