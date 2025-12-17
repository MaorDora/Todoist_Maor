import React, { useState, useRef, useEffect } from 'react';
import { Zap, Calendar, Flag, X, Clock, MoreHorizontal, Tag, MapPin, AlarmClock, Inbox, ChevronDown, Check } from 'lucide-react';
import { Priority, Task, Project, Section } from '../types';
import { parseTaskNaturalLanguage } from '../services/geminiService';
import { addDays, format, nextMonday, setHours, setMinutes, isSameDay, isToday, isTomorrow } from 'date-fns';
import { storageService } from '../services/storageService';

interface AddTaskProps {
  onAdd: (task: Omit<Task, 'id' | 'createdAt' | 'isCompleted' | 'labels'>) => void;
  defaultProjectId: string;
  defaultSectionId?: string;
}

export const AddTask: React.FC<AddTaskProps> = ({ onAdd, defaultProjectId, defaultSectionId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [description, setDescription] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  
  // State
  const [selectedPriority, setSelectedPriority] = useState<Priority | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [hasTime, setHasTime] = useState(false);
  
  // Project/Section Selection
  const [selectedProject, setSelectedProject] = useState<string>(defaultProjectId);
  const [selectedSection, setSelectedSection] = useState<string | undefined>(defaultSectionId);
  
  // Data for selector
  const [projects, setProjects] = useState<Project[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  // Popovers
  const [activePopover, setActivePopover] = useState<'date' | 'priority' | 'more' | 'project' | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
     if (isOpen) {
         setProjects(storageService.getProjects());
         // Fetch all sections for simplicty or fetch on demand
         // For now, let's just get sections for the selected project when needed or all
         // Getting all sections to map them in dropdown
         setSections(storageService.getSections());
     }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setActivePopover(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsLoadingAI(true);
    
    const parsed = await parseTaskNaturalLanguage(input);
    
    const finalPriority = selectedPriority ?? parsed.priority;
    
    let finalDueDate = parsed.dueDate;
    let finalDueString = parsed.dueString;

    if (selectedDate) {
        finalDueDate = selectedDate.toISOString();
        if (isToday(selectedDate)) finalDueString = 'Today';
        else if (isTomorrow(selectedDate)) finalDueString = 'Tomorrow';
        else finalDueString = format(selectedDate, 'MMM d');
        
        if (hasTime) {
            finalDueString += ` at ${format(selectedDate, 'HH:mm')}`;
        }
    }

    onAdd({
      content: parsed.content,
      description: description || parsed.description,
      projectId: selectedProject,
      sectionId: selectedSection,
      priority: finalPriority,
      dueString: finalDueString,
      dueDate: finalDueDate,
    });

    setInput('');
    setDescription('');
    setSelectedPriority(null);
    setSelectedDate(null);
    setHasTime(false);
    setIsOpen(false);
    setIsLoadingAI(false);
  };

  const handleDateSelect = (date: Date | null) => {
    if (date) {
        let newDate = date;
        if (selectedDate && hasTime) {
            newDate = setHours(newDate, selectedDate.getHours());
            newDate = setMinutes(newDate, selectedDate.getMinutes());
        }
        setSelectedDate(newDate);
    } else {
        setSelectedDate(null);
        setHasTime(false);
    }
    setActivePopover(null);
  };

  const setSpecificTime = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const baseDate = selectedDate || new Date();
      const newDate = setHours(setMinutes(baseDate, minutes), hours);
      setSelectedDate(newDate);
      setHasTime(true);
  };

  const getDateLabel = () => {
      if (!selectedDate) return 'Today';
      if (isToday(selectedDate)) return hasTime ? `Today ${format(selectedDate, 'HH:mm')}` : 'Today';
      if (isTomorrow(selectedDate)) return hasTime ? `Tomorrow ${format(selectedDate, 'HH:mm')}` : 'Tomorrow';
      return hasTime ? format(selectedDate, 'MMM d HH:mm') : format(selectedDate, 'MMM d');
  };

  const getDateColorClass = () => {
      if (!selectedDate) return 'text-gray-500 border-gray-200 hover:bg-gray-100';
      return 'text-green-600 bg-green-50 border-green-200 hover:bg-green-100';
  };
  
  const getProjectName = () => {
      const proj = projects.find(p => p.id === selectedProject);
      const sec = sections.find(s => s.id === selectedSection);
      if (sec && sec.projectId === selectedProject) {
          return `${proj?.name} / ${sec.name}`;
      }
      return proj?.name || 'Inbox';
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-gray-500 hover:text-red-600 font-medium text-sm px-0 py-2 rounded-md transition-colors w-full group"
      >
        <div className="w-5 h-5 rounded-full bg-transparent group-hover:bg-red-600 flex items-center justify-center text-red-600 group-hover:text-white transition-colors">
           <span className="text-xl leading-none mb-0.5">+</span>
        </div>
        <span className="group-hover:text-red-700">Add task</span>
      </button>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="border border-gray-200 rounded-xl p-4 bg-white shadow-lg ring-1 ring-gray-100 relative mb-4 animate-in fade-in zoom-in-95 duration-200">
      
      {/* Inputs */}
      <div className="flex flex-col gap-1 mb-3">
        <input
          autoFocus
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Task name"
          className="text-base font-semibold text-gray-800 outline-none placeholder:text-gray-400 w-full bg-transparent"
          disabled={isLoadingAI}
        />
        <input 
          type="text" 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description" 
          className="text-xs text-gray-500 outline-none w-full bg-transparent font-medium"
        />
      </div>
      
      {/* Chips Row */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
          {/* Date Chip */}
          <div className="relative">
             <button
                type="button"
                onClick={() => setActivePopover(activePopover === 'date' ? null : 'date')}
                className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-medium transition-colors ${getDateColorClass()}`}
             >
                <Calendar size={14} />
                {getDateLabel()}
                {selectedDate && (
                    <div 
                        onClick={(e) => { e.stopPropagation(); setSelectedDate(null); setHasTime(false); }}
                        className="hover:bg-green-200 rounded-full p-0.5"
                    >
                        <X size={10} />
                    </div>
                )}
             </button>
             {activePopover === 'date' && (
                 <div className="absolute top-8 left-0 w-60 bg-white border border-gray-200 shadow-xl rounded-lg z-20 py-1 flex flex-col">
                    <button type="button" onClick={() => handleDateSelect(new Date())} className="px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-xs text-gray-700">
                        <Calendar size={14} className="text-green-600"/> Today <span className="ml-auto text-gray-400">{format(new Date(), 'EEE')}</span>
                    </button>
                    <button type="button" onClick={() => handleDateSelect(addDays(new Date(), 1))} className="px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-xs text-gray-700">
                        <div className="w-3.5 h-3.5 text-center leading-3 font-bold text-orange-500 text-[10px]">S</div> Tomorrow <span className="ml-auto text-gray-400">{format(addDays(new Date(), 1), 'EEE')}</span>
                    </button>
                    <button type="button" onClick={() => handleDateSelect(nextMonday(new Date()))} className="px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-xs text-gray-700">
                        <div className="w-3.5 h-3.5 text-center leading-3 font-bold text-purple-500 text-[10px]">W</div> Next Week <span className="ml-auto text-gray-400">{format(nextMonday(new Date()), 'MMM d')}</span>
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <div className="px-3 py-2">
                        <div className="text-[10px] font-bold text-gray-400 mb-1 uppercase">Time</div>
                        {!hasTime ? (
                            <button 
                                type="button" 
                                onClick={() => { setSpecificTime('09:00'); }} 
                                className="text-xs border border-gray-200 rounded px-2 py-1 w-full text-left hover:border-gray-400"
                            >
                                + Add time
                            </button>
                        ) : (
                            <div className="flex items-center gap-1">
                                <input 
                                    type="time" 
                                    value={selectedDate ? format(selectedDate, 'HH:mm') : ''}
                                    onChange={(e) => setSpecificTime(e.target.value)}
                                    className="text-xs border border-gray-200 rounded px-2 py-1 w-full"
                                />
                                <button type="button" onClick={() => setHasTime(false)} className="text-red-500 hover:bg-red-50 p-1 rounded"><X size={14}/></button>
                            </div>
                        )}
                    </div>
                 </div>
             )}
          </div>

          {/* Priority Chip */}
          <div className="relative">
             <button
                type="button"
                onClick={() => setActivePopover(activePopover === 'priority' ? null : 'priority')}
                className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-medium transition-colors ${selectedPriority ? 'bg-gray-50 border-gray-300 text-gray-700' : 'text-gray-500 border-gray-200 hover:bg-gray-100'}`}
             >
                <Flag size={14} className={
                    selectedPriority === Priority.P1 ? 'text-red-600 fill-red-600' : 
                    selectedPriority === Priority.P2 ? 'text-orange-500 fill-orange-500' : 
                    selectedPriority === Priority.P3 ? 'text-blue-500 fill-blue-500' : ''
                } />
                {selectedPriority ? `P${5 - selectedPriority}` : 'Priority'}
                {selectedPriority && (
                    <div onClick={(e) => { e.stopPropagation(); setSelectedPriority(null); }} className="hover:bg-gray-200 rounded-full p-0.5">
                        <X size={10} />
                    </div>
                )}
             </button>
             {activePopover === 'priority' && (
                 <div className="absolute top-8 left-0 w-32 bg-white border border-gray-200 shadow-xl rounded-lg z-20 py-1 flex flex-col">
                    <button type="button" onClick={() => { setSelectedPriority(Priority.P1); setActivePopover(null); }} className="px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-xs text-gray-700"><Flag size={14} className="text-red-600"/> Priority 1</button>
                    <button type="button" onClick={() => { setSelectedPriority(Priority.P2); setActivePopover(null); }} className="px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-xs text-gray-700"><Flag size={14} className="text-orange-500"/> Priority 2</button>
                    <button type="button" onClick={() => { setSelectedPriority(Priority.P3); setActivePopover(null); }} className="px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-xs text-gray-700"><Flag size={14} className="text-blue-500"/> Priority 3</button>
                    <button type="button" onClick={() => { setSelectedPriority(Priority.P4); setActivePopover(null); }} className="px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-xs text-gray-700"><Flag size={14} className="text-gray-500"/> Priority 4</button>
                 </div>
             )}
          </div>

          {/* Reminders Chip */}
          <button type="button" className="flex items-center gap-1.5 px-2 py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-100 text-xs font-medium transition-colors">
            <AlarmClock size={14} /> Reminders
          </button>

          {/* More Chip */}
          <div className="relative">
            <button 
                type="button" 
                onClick={() => setActivePopover(activePopover === 'more' ? null : 'more')}
                className="flex items-center px-1.5 py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors"
            >
                <MoreHorizontal size={14} />
            </button>
            {activePopover === 'more' && (
                <div className="absolute top-8 left-0 w-40 bg-white border border-gray-200 shadow-xl rounded-lg z-20 py-1 flex flex-col">
                     <button className="px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-xs text-gray-700"><Tag size={14}/> Labels</button>
                     <button className="px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-xs text-gray-700"><MapPin size={14}/> Location</button>
                </div>
            )}
          </div>
      </div>

      <div className="border-t border-gray-100 pt-3 flex items-center justify-between gap-2">
          {/* Project Selector */}
          <div className="relative">
             <button 
                type="button"
                onClick={() => setActivePopover(activePopover === 'project' ? null : 'project')}
                className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-gray-100 text-xs font-medium text-gray-600 transition-colors"
             >
                <Inbox size={14} /> 
                {getProjectName()}
                <ChevronDown size={12} />
             </button>
             
             {activePopover === 'project' && (
                <div className="absolute top-8 left-0 w-56 bg-white border border-gray-200 shadow-xl rounded-lg z-20 py-1 max-h-60 overflow-y-auto">
                    <input type="text" placeholder="Type a project name" className="mx-2 mb-2 px-2 py-1 border border-gray-200 rounded text-xs w-[calc(100%-16px)] outline-none focus:border-gray-400" autoFocus />
                    {projects.map(proj => {
                        const projSections = sections.filter(s => s.projectId === proj.id);
                        return (
                            <div key={proj.id}>
                                <button 
                                    type="button"
                                    onClick={() => { setSelectedProject(proj.id); setSelectedSection(undefined); setActivePopover(null); }}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-xs text-gray-700 group"
                                >
                                    <Inbox size={14} className={proj.id === 'inbox' ? 'text-blue-500' : 'text-gray-400'} /> 
                                    {proj.name}
                                    {selectedProject === proj.id && !selectedSection && <Check size={12} className="ml-auto text-red-600"/>}
                                </button>
                                {/* Sections */}
                                {projSections.map(sec => (
                                    <button 
                                        key={sec.id}
                                        type="button"
                                        onClick={() => { setSelectedProject(proj.id); setSelectedSection(sec.id); setActivePopover(null); }}
                                        className="w-full text-left pl-8 pr-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 text-xs text-gray-600"
                                    >
                                        <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                                        {sec.name}
                                        {selectedSection === sec.id && <Check size={12} className="ml-auto text-red-600"/>}
                                    </button>
                                ))}
                            </div>
                        );
                    })}
                </div>
             )}
          </div>

          <div className="flex items-center gap-2">
            <button 
                type="button" 
                onClick={() => setIsOpen(false)} 
                className="px-3 py-1.5 text-xs font-bold bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
            >
                Cancel
            </button>
            <button 
                type="submit" 
                disabled={!input.trim() || isLoadingAI}
                className={`
                px-3 py-1.5 text-xs font-bold rounded text-white flex items-center gap-1 transition-all shadow-sm
                ${!input.trim() || isLoadingAI ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 hover:shadow'}
                `}
            >
                {isLoadingAI ? <Zap size={12} className="animate-spin text-yellow-300" /> : 'Add Task'}
            </button>
          </div>
      </div>

    </form>
  );
};