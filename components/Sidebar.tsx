import React, { useState } from 'react';
import { 
  Inbox, Calendar, CalendarDays, Hash, ChevronDown, ChevronRight, Plus, LayoutGrid, Search, User
} from 'lucide-react';
import { Project, Label } from '../types';

interface SidebarProps {
  projects: Project[];
  labels: Label[];
  activeView: string;
  onViewChange: (view: string) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
  onOpenSearch: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  projects, labels, activeView, onViewChange, isOpen, onCloseMobile, onOpenSearch 
}) => {
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(true);

  const navItemClass = (viewId: string) => `
    flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer select-none transition-colors mb-0.5
    ${activeView === viewId ? 'bg-red-50 text-red-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}
  `;

  const handleNav = (view: string) => {
    onViewChange(view);
    if (window.innerWidth < 768) onCloseMobile();
  };

  return (
    <aside 
      className={`
        fixed z-30 inset-y-0 left-0 bg-gray-50/50 border-r border-gray-200 w-[280px] 
        transform transition-transform duration-300 ease-in-out flex flex-col backdrop-blur-xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:bg-gray-50
      `}
    >
      {/* User Header */}
      <div className="p-4 flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 hover:bg-gray-200 p-1 rounded cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center border border-gray-200">
             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-full h-full rounded-full" />
          </div>
          <span className="text-sm font-semibold text-gray-800">My Workspace</span>
          <ChevronDown size={14} className="text-gray-500" />
        </div>
      </div>

      <div className="px-3 flex-1 overflow-y-auto custom-scrollbar">
        {/* Quick Add / Search */}
        <div className="mb-4 space-y-1">
          <div className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md cursor-pointer mb-2 font-medium transition-colors">
            <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white">
              <Plus size={16} />
            </div>
            <span>Add task</span>
          </div>
          
          <div 
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer mb-1"
          >
            <Search size={18} />
            <span>Search</span>
            <span className="ml-auto text-xs text-gray-400 border border-gray-200 rounded px-1">Cmd K</span>
          </div>
          
          <div onClick={() => handleNav('inbox')} className={navItemClass('inbox')}>
            <Inbox size={18} className={activeView === 'inbox' ? 'text-blue-500' : 'text-gray-500'} />
            <span>Inbox</span>
            <span className="ml-auto text-xs text-gray-400">4</span>
          </div>
          <div onClick={() => handleNav('today')} className={navItemClass('today')}>
            <Calendar size={18} className={activeView === 'today' ? 'text-green-600' : 'text-gray-500'} />
            <span>Today</span>
          </div>
          <div onClick={() => handleNav('upcoming')} className={navItemClass('upcoming')}>
            <CalendarDays size={18} className={activeView === 'upcoming' ? 'text-purple-600' : 'text-gray-500'} />
            <span>Upcoming</span>
          </div>
          <div onClick={() => handleNav('filters')} className={navItemClass('filters')}>
            <LayoutGrid size={18} className={activeView === 'filters' ? 'text-orange-500' : 'text-gray-500'} />
            <span>Filters & Labels</span>
          </div>
        </div>

        {/* Projects Section */}
        <div className="mt-6">
          <div 
            className="flex items-center justify-between px-3 py-2 text-gray-500 hover:text-gray-800 cursor-pointer group"
            onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
          >
            <div className="flex items-center gap-1 font-semibold text-xs text-gray-500 group-hover:text-gray-700">
              {isProjectsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              My Projects
            </div>
            <Plus size={16} className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-200 rounded" />
          </div>

          {isProjectsExpanded && (
            <div className="mt-1 space-y-0.5">
              {projects.map(project => (
                <div 
                  key={project.id} 
                  onClick={() => handleNav(`project:${project.id}`)}
                  className={navItemClass(`project:${project.id}`)}
                >
                  <Hash size={16} style={{ color: project.color }} />
                  <span className="truncate">{project.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Sync Status */}
      <div className="p-4 border-t border-gray-200 bg-gray-50/80">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-green-500"></div>
             <span>Sync active</span>
          </div>
          <span className="font-mono text-[10px] opacity-50">v2.4.0</span>
        </div>
      </div>
    </aside>
  );
};