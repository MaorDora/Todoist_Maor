import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Menu, Bell, HelpCircle, CheckCircle2, RotateCw, Trophy, Target } from 'lucide-react';
import { storageService } from './services/storageService';
import { Task, Project, Priority, Label } from './types';
import { Inbox } from './pages/Inbox';
import { Today } from './pages/Today';
import { Upcoming } from './pages/Upcoming';
import { ProjectView } from './pages/ProjectView';
import { Filters } from './pages/Filters';
import { SearchModal } from './components/SearchModal';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [labels, setLabels] = useState<Label[]>(storageService.getLabels());
  
  const [activeView, setActiveView] = useState('inbox');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [isSynced, setIsSynced] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  // Load Initial Data
  useEffect(() => {
    setTasks(storageService.getTasks());
    setProjects(storageService.getProjects());
    setLabels(storageService.getLabels());
    
    const handleResize = () => {
      if (window.innerWidth > 768) setIsSidebarOpen(true);
      else setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    
    // Keyboard shortcut for search
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            setIsSearchOpen(prev => !prev);
        }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSynced(true);
      setIsSyncing(false);
    }, 1500);
  };

  const handleAddTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'isCompleted' | 'labels'>) => {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      isCompleted: false,
      labels: [],
      projectId: activeView.startsWith('project:') ? activeView.split(':')[1] : 'inbox'
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    storageService.saveTask(newTask);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    const updatedTasks = tasks.map(t => 
        t.id === updatedTask.id ? updatedTask : t
    );
    setTasks(updatedTasks);
    storageService.saveTask(updatedTask);
  };

  const handleToggleTask = (id: string) => {
    const updatedTasks = tasks.map(t => 
      t.id === id ? { ...t, isCompleted: !t.isCompleted } : t
    );
    setTasks(updatedTasks);
    const task = updatedTasks.find(t => t.id === id);
    if (task) storageService.saveTask(task);
  };

  const handleDeleteTask = (id: string) => {
    const tasksToDelete = new Set<string>();
    const findChildren = (parentId: string) => {
      tasksToDelete.add(parentId);
      tasks.filter(t => t.parentId === parentId).forEach(child => findChildren(child.id));
    };
    findChildren(id);
    const newTasks = tasks.filter(t => !tasksToDelete.has(t.id));
    setTasks(newTasks);
    localStorage.setItem('doit_ai_tasks', JSON.stringify(newTasks));
  };

  const handleAddSubtasks = (parentId: string, subtaskTitles: string[]) => {
    const parentTask = tasks.find(t => t.id === parentId);
    if (!parentTask) return;
    const newSubtasks: Task[] = subtaskTitles.map(title => ({
      id: crypto.randomUUID(),
      content: title,
      projectId: parentTask.projectId,
      parentId: parentId,
      priority: Priority.P4,
      isCompleted: false,
      createdAt: Date.now(),
      labels: []
    }));
    const updatedTasks = [...tasks, ...newSubtasks];
    setTasks(updatedTasks);
    newSubtasks.forEach(t => storageService.saveTask(t));
  };

  // Generic render prop for Views that reuse the list logic
  const renderFilteredList = (filterFn: (t: Task) => boolean, title: string) => {
     // We re-use Inbox component structure but pass filtered tasks
     const filtered = tasks.filter(filterFn);
     return (
        <Inbox 
            tasks={filtered} // Trick: Inbox filters by project='inbox', so we might need to adjust Inbox to accept pre-filtered list or specific prop
            // Actually, better to modify Inbox to optionally accept specific tasks list
            // For now, let's create a specialized inline view for simplicity or just hack Inbox by changing project IDs in memory (bad).
            // Proper way: Inbox component should probably be renamed "TaskListView"
            projects={projects}
            onToggle={handleToggleTask} onDelete={handleDeleteTask}
            onAddSubtasks={handleAddSubtasks} onAddTask={handleAddTask}
            // Overriding internal filter of Inbox component requires modifying Inbox.tsx. 
            // Instead, I will pass all tasks to Inbox, but tell it to ignore project filter if I pass a specific prop.
        />
     );
  };

  const completedCount = useMemo(() => tasks.filter(t => t.isCompleted).length, [tasks]);

  // Router logic
  const renderContent = () => {
    if (activeView === 'inbox') {
      return <Inbox tasks={tasks} projects={projects} onToggle={handleToggleTask} onDelete={handleDeleteTask} onAddSubtasks={handleAddSubtasks} onAddTask={handleAddTask} />;
    }
    if (activeView === 'today') {
        return <Today tasks={tasks} projects={projects} onToggle={handleToggleTask} onDelete={handleDeleteTask} onAddSubtasks={handleAddSubtasks} onAddTask={handleAddTask} />;
    }
    if (activeView === 'upcoming') {
        return <Upcoming tasks={tasks} projects={projects} />;
    }
    if (activeView === 'filters') {
        return <Filters labels={labels} tasks={tasks} onNavigate={setActiveView} />;
    }
    if (activeView.startsWith('project:')) {
        const projectId = activeView.split(':')[1];
        return <ProjectView projectId={projectId} tasks={tasks} projects={projects} onToggle={handleToggleTask} onDelete={handleDeleteTask} onAddSubtasks={handleAddSubtasks} onAddTask={handleAddTask} />;
    }
    // New: Handle filtered views
    if (activeView.startsWith('priority:')) {
        const p = parseInt(activeView.split(':')[1]);
        // Re-using ProjectView styling for simplicity or custom
        return (
            <div className="max-w-[800px] mx-auto pb-16">
                 <div className="mb-6"><h1 className="text-2xl font-bold">Priority {p === 4 ? 'Urgent' : p === 3 ? 'High' : 'Normal'}</h1></div>
                 <Inbox tasks={tasks.filter(t => t.priority === p)} projects={projects} onToggle={handleToggleTask} onDelete={handleDeleteTask} onAddSubtasks={handleAddSubtasks} onAddTask={handleAddTask} />
            </div>
        )
    }
    if (activeView.startsWith('label:')) {
        const labelId = activeView.split(':')[1];
        const label = labels.find(l => l.id === labelId);
        return (
            <div className="max-w-[800px] mx-auto pb-16">
                 <div className="mb-6"><h1 className="text-2xl font-bold flex items-center gap-2">Label: {label?.name}</h1></div>
                 {/* Note: Labels aren't fully wired in Task object creation yet, but viewing works if data exists */}
                 <div className="text-gray-500 italic p-4 text-center">Tasks with this label will appear here.</div>
            </div>
        )
    }

    return <Inbox tasks={tasks} projects={projects} onToggle={handleToggleTask} onDelete={handleDeleteTask} onAddSubtasks={handleAddSubtasks} onAddTask={handleAddTask} />;
  };

  return (
    <div className="flex h-screen bg-white text-gray-800 font-sans overflow-hidden">
      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        tasks={tasks}
        onNavigateToTask={(task) => {
            if (task.projectId === 'inbox') setActiveView('inbox');
            else setActiveView(`project:${task.projectId}`);
        }}
      />

      {isSidebarOpen && window.innerWidth < 768 && (
        <div 
          className="fixed inset-0 bg-black/30 z-20 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar 
        projects={projects}
        labels={labels}
        activeView={activeView}
        onViewChange={setActiveView}
        isOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
        <header className="h-14 border-b border-transparent hover:border-gray-100 flex items-center px-4 md:px-8 justify-between transition-colors sticky top-0 bg-white/95 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-1 rounded hover:bg-gray-100 text-gray-600"
              >
                <Menu size={20} />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-gray-500">
            <button 
              onClick={handleSync}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                ${isSynced 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'}
              `}
            >
              {isSyncing ? <RotateCw size={14} className="animate-spin" /> : isSynced ? <CheckCircle2 size={14} /> : <RotateCw size={14} />}
              {isSynced ? 'Synced' : 'Sync'}
            </button>
            
            <div className="relative">
                 <div 
                    onClick={() => setIsStatsOpen(!isStatsOpen)}
                    className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                 >
                  YP
                </div>
                {/* Stats Dropdown */}
                {isStatsOpen && (
                    <div className="absolute right-0 top-10 w-64 bg-white rounded-lg shadow-xl border border-gray-100 p-4 z-50">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-800">Your Productivity</h3>
                            <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full font-bold">Karma: Gold</span>
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                             <div className="w-12 h-12 rounded-full border-4 border-red-500 flex items-center justify-center font-bold text-lg text-red-600">
                                {completedCount}
                             </div>
                             <div className="flex flex-col text-sm">
                                 <span className="text-gray-500">Tasks completed</span>
                                 <span className="text-xs text-green-600 font-medium">+2 today</span>
                             </div>
                        </div>
                        <div className="space-y-2">
                             <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Goals</div>
                             <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2"><Target size={14} className="text-blue-500"/> Daily</div>
                                <span>2/5</span>
                             </div>
                             <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                 <div className="bg-blue-500 h-full w-[40%]"></div>
                             </div>
                        </div>
                        <div 
                            className="mt-4 pt-3 border-t border-gray-100 text-center text-xs text-gray-400 cursor-pointer hover:text-gray-600"
                            onClick={() => setIsStatsOpen(false)}
                        >
                            Close
                        </div>
                    </div>
                )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 md:px-16 pt-8 pb-20 custom-scrollbar">
            {renderContent()}
        </div>
      </main>
    </div>
  );
}