import React, { useState, useRef, useEffect } from 'react';
import { Check, Edit2, MoreHorizontal, Calendar, Sparkles, ChevronRight, ChevronDown, Share2, Hash, Save, X, Trash2, ArrowUp, ArrowDown, Flag } from 'lucide-react';
import { Task, Priority, Project } from '../types';
import { generateSubtasks } from '../services/geminiService';
import { addDays, format, nextMonday } from 'date-fns';

interface TaskItemProps {
  task: Task;
  allTasks: Task[]; 
  projects: Project[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAddSubtasks: (parentId: string, subtasks: string[]) => void;
  onUpdate: (task: Task) => void;
  level?: number;
}

export const TaskItem: React.FC<TaskItemProps> = ({ 
  task, allTasks, projects, onToggle, onDelete, onAddSubtasks, onUpdate, level = 0 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  
  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(task.content);
  const editInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Find children
  const subtasks = allTasks.filter(t => t.parentId === task.id);
  const project = projects.find(p => p.id === task.projectId);

  useEffect(() => {
    if (isEditing) editInputRef.current?.focus();
  }, [isEditing]);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
              setShowMenu(false);
          }
      };
      if (showMenu) document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const getPriorityColor = (p: Priority) => {
    switch(p) {
      case Priority.P1: return 'border-red-500 bg-red-50 text-red-600';
      case Priority.P2: return 'border-orange-400 bg-orange-50 text-orange-500';
      case Priority.P3: return 'border-blue-400 bg-blue-50 text-blue-500';
      default: return 'border-gray-400 hover:border-gray-500 text-gray-400';
    }
  };

  const handleAISubtasks = async () => {
    setIsGenerating(true);
    const generated = await generateSubtasks(task.content);
    if (generated.length > 0) {
      onAddSubtasks(task.id, generated);
      setIsExpanded(true);
    }
    setIsGenerating(false);
  };

  const saveEdit = () => {
    if (editContent.trim() !== '') {
      onUpdate({ ...task, content: editContent });
    } else {
      setEditContent(task.content); 
    }
    setIsEditing(false);
  };

  const handleUpdatePriority = (p: Priority) => {
      onUpdate({ ...task, priority: p });
      setShowMenu(false);
  };
  
  const handleUpdateDate = (date: Date, label: string) => {
      onUpdate({ ...task, dueDate: date.toISOString(), dueString: label });
      setShowMenu(false);
  }

  return (
    <div className="flex flex-col select-none relative">
      {/* Main Task Row */}
      <div 
        className={`
          group flex items-start gap-3 py-2.5 border-b border-gray-100 hover:bg-gray-50 
          transition-colors relative
          ${level > 0 ? 'ml-6 border-b-0' : ''}
        `}
        style={{ paddingLeft: level > 0 ? '0' : undefined }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Drag Handle / Nesting Indicator area */}
        <div className="absolute left-[-24px] top-3 opacity-0 group-hover:opacity-50 cursor-grab">
           <div className="grid grid-cols-2 gap-[2px]">
             {[1,2,3,4,5,6].map(i => <div key={i} className="w-[3px] h-[3px] bg-gray-600 rounded-full"></div>)}
           </div>
        </div>

        {/* Checkbox */}
        <button 
          onClick={() => onToggle(task.id)}
          className={`
            mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border items-center justify-center flex transition-all cursor-pointer
            ${task.isCompleted ? 'bg-gray-400 border-gray-400' : getPriorityColor(task.priority)}
          `}
        >
          {task.isCompleted && <Check size={12} className="text-white" />}
          {!task.isCompleted && (
            <div className={`w-full h-full rounded-full opacity-0 hover:opacity-100 flex items-center justify-center bg-black/5`}>
              <Check size={12} className="text-gray-500" />
            </div>
          )}
        </button>

        {/* Content Area */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input 
                ref={editInputRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); else if (e.key === 'Escape') setIsEditing(false); }}
                className="flex-1 text-[15px] p-1 border border-blue-400 rounded outline-none"
              />
              <button onClick={saveEdit} className="text-green-600 hover:bg-green-100 p-1 rounded"><Save size={14}/></button>
              <button onClick={() => setIsEditing(false)} className="text-red-600 hover:bg-red-100 p-1 rounded"><X size={14}/></button>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between cursor-pointer" onClick={() => setIsEditing(true)}>
                <span className={`text-[15px] leading-5 ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                  {task.content}
                </span>
                
                {project && !task.isCompleted && (
                  <div className="flex items-center gap-1 text-xs text-gray-400 whitespace-nowrap ml-4 hover:text-gray-600 cursor-pointer">
                    <span>{project.name}</span>
                    <Hash size={12} style={{ color: project.color }} />
                  </div>
                )}
              </div>

              {/* Metadata Row */}
              <div className="flex items-center gap-3 mt-1 min-h-[16px]">
                {/* Subtask toggle */}
                {subtasks.length > 0 && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800"
                  >
                    <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-[9px] font-bold">{subtasks.length}</span>
                    </div>
                    {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </button>
                )}

                {/* Due Date */}
                {task.dueString && (
                  <span className={`text-xs flex items-center gap-1 ${task.isCompleted ? 'text-gray-400' : 'text-red-600'}`}>
                    <Calendar size={12} /> {task.dueString}
                  </span>
                )}
                
                {task.description && (
                  <span className="text-xs text-gray-400 truncate max-w-[150px]">{task.description}</span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        {!isEditing && (
          <div className={`flex items-center gap-1 transition-opacity ${isHovered || showMenu ? 'opacity-100' : 'opacity-0'}`}>
             <button 
              onClick={() => setIsEditing(true)}
              className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
            >
              <Edit2 size={16} />
            </button>
             
             {/* Context Menu Trigger */}
             <div className="relative">
                <button 
                  onClick={() => setShowMenu(!showMenu)}
                  className={`p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all ${showMenu ? 'bg-gray-100 text-gray-700' : ''}`}
                >
                  <MoreHorizontal size={16} />
                </button>
                
                {/* Context Menu Dropdown */}
                {showMenu && (
                    <div ref={menuRef} className="absolute right-0 top-8 w-56 bg-white rounded-lg shadow-xl border border-gray-100 z-50 py-1 flex flex-col text-sm animate-in fade-in zoom-in-95 duration-100">
                        <button onClick={() => { setIsEditing(true); setShowMenu(false); }} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700">
                            <Edit2 size={14} /> Edit task
                        </button>
                        <button onClick={() => { handleAISubtasks(); setShowMenu(false); }} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700">
                            <Sparkles size={14} className="text-purple-500" /> AI Break down
                        </button>
                        <div className="border-t border-gray-100 my-1"></div>
                        <div className="px-4 py-1 text-xs text-gray-400 font-semibold uppercase">Schedule</div>
                        <div className="flex items-center justify-between px-2">
                             <button onClick={() => handleUpdateDate(new Date(), 'Today')} className="flex-1 p-2 hover:bg-gray-50 rounded flex flex-col items-center gap-1 text-gray-600 text-xs">
                                 <Calendar size={14} className="text-green-600"/> Today
                             </button>
                             <button onClick={() => handleUpdateDate(addDays(new Date(), 1), 'Tomorrow')} className="flex-1 p-2 hover:bg-gray-50 rounded flex flex-col items-center gap-1 text-gray-600 text-xs">
                                 <div className="text-orange-500 font-bold">S</div> Tomorrow
                             </button>
                             <button onClick={() => handleUpdateDate(nextMonday(new Date()), 'Next Week')} className="flex-1 p-2 hover:bg-gray-50 rounded flex flex-col items-center gap-1 text-gray-600 text-xs">
                                 <div className="text-purple-500 font-bold">W</div> Next Wk
                             </button>
                        </div>
                        <div className="border-t border-gray-100 my-1"></div>
                        <div className="px-4 py-1 text-xs text-gray-400 font-semibold uppercase">Priority</div>
                        <div className="flex px-2 gap-1 pb-2">
                            <button onClick={() => handleUpdatePriority(Priority.P1)} className="flex-1 hover:bg-red-50 p-1 rounded flex justify-center"><Flag size={16} className="text-red-600 fill-red-600"/></button>
                            <button onClick={() => handleUpdatePriority(Priority.P2)} className="flex-1 hover:bg-orange-50 p-1 rounded flex justify-center"><Flag size={16} className="text-orange-500 fill-orange-500"/></button>
                            <button onClick={() => handleUpdatePriority(Priority.P3)} className="flex-1 hover:bg-blue-50 p-1 rounded flex justify-center"><Flag size={16} className="text-blue-500 fill-blue-500"/></button>
                            <button onClick={() => handleUpdatePriority(Priority.P4)} className="flex-1 hover:bg-gray-50 p-1 rounded flex justify-center"><Flag size={16} className="text-gray-400"/></button>
                        </div>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button onClick={() => { onDelete(task.id); setShowMenu(false); }} className="flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-600">
                            <Trash2 size={14} /> Delete task
                        </button>
                    </div>
                )}
             </div>
          </div>
        )}
      </div>

      {/* Recursive Render for Subtasks */}
      {isExpanded && subtasks.length > 0 && (
        <div className="flex flex-col">
          {subtasks.map(sub => (
             <TaskItem 
               key={sub.id}
               task={sub}
               allTasks={allTasks}
               projects={projects}
               onToggle={onToggle}
               onDelete={onDelete}
               onAddSubtasks={onAddSubtasks}
               onUpdate={onUpdate}
               level={level + 1}
             />
          ))}
        </div>
      )}
    </div>
  );
};