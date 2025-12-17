import React, { useState } from 'react';
import { Task, Project, Priority } from '../types';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, 
  parseISO, addWeeks, subWeeks, addDays, subDays 
} from 'date-fns';
import './Upcoming.css';

interface UpcomingProps {
  tasks: Task[];
  projects: Project[];
}

type ViewMode = 'month' | 'week' | 'day';

export const Upcoming: React.FC<UpcomingProps> = ({ tasks, projects }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  // Navigation Logic
  const next = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const prev = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const goToToday = () => setCurrentDate(new Date());

  // Data helpers
  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => {
        if (task.isCompleted) return false;
        if (task.dueDate) {
            return isSameDay(parseISO(task.dueDate), day);
        }
        if (isToday(day) && task.dueString?.toLowerCase().includes('today')) return true;
        return false;
    });
  };

  const getProjectColor = (projectId: string) => {
      return projects.find(p => p.id === projectId)?.color || '#ccc';
  };
  
  const getPriorityBorder = (p: Priority) => {
     // matching TaskItem logic
     switch(p) {
        case Priority.P1: return '2px solid #DC4C3E';
        case Priority.P2: return '2px solid #E8A87C';
        case Priority.P3: return '2px solid #4169E1';
        default: return '1px solid #e5e7eb';
     }
  };

  // View Renders
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="calendar-grid">
        {weekDays.map(day => <div key={day} className="calendar-day-header">{day}</div>)}
        {calendarDays.map((day, idx) => {
          const dayTasks = getTasksForDay(day);
          const isCurrentMonth = isSameMonth(day, monthStart);
          return (
            <div 
                key={idx} 
                className={`calendar-day-cell ${isToday(day) ? 'is-today' : ''} ${!isCurrentMonth ? 'bg-gray-50 opacity-50' : ''}`}
                onClick={() => { setCurrentDate(day); setViewMode('day'); }} // Quick nav to day
            >
              <div className="day-number">{format(day, 'd')}</div>
              <div className="flex flex-col gap-1 overflow-hidden">
                {dayTasks.slice(0, 4).map(task => (
                    <div 
                        key={task.id} 
                        className="calendar-task-dot"
                        style={{ borderLeftColor: getProjectColor(task.projectId) }}
                        title={task.content}
                    >
                        {task.content}
                    </div>
                ))}
                {dayTasks.length > 4 && <div className="text-[10px] text-gray-400 pl-1">+{dayTasks.length - 4} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const startDate = startOfWeek(currentDate);
    const endDate = endOfWeek(currentDate);
    const weekDays = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="week-grid">
        {weekDays.map((day, idx) => {
          const dayTasks = getTasksForDay(day);
          return (
             <div key={idx} className={`week-column ${isToday(day) ? 'bg-blue-50/30' : ''}`}>
                <div className="week-column-header">
                   <div className="text-xs text-gray-500 font-semibold uppercase">{format(day, 'EEE')}</div>
                   <div className={`text-lg font-bold w-8 h-8 flex items-center justify-center rounded-full mx-auto ${isToday(day) ? 'bg-red-600 text-white' : 'text-gray-800'}`}>
                      {format(day, 'd')}
                   </div>
                </div>
                <div className="week-column-content">
                    {dayTasks.map(task => (
                         <div 
                            key={task.id} 
                            className="bg-white p-2 rounded shadow-sm border text-xs"
                            style={{ borderLeft: `3px solid ${getProjectColor(task.projectId)}` }}
                         >
                            <div className="font-medium text-gray-800 line-clamp-2">{task.content}</div>
                         </div>
                    ))}
                    {dayTasks.length === 0 && (
                        <div className="text-[10px] text-center text-gray-300 mt-4">No tasks</div>
                    )}
                </div>
             </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
     const dayTasks = getTasksForDay(currentDate);
     
     return (
        <div className="day-view-container">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">{format(currentDate, 'EEEE')}</h2>
                    <p className="text-gray-500">{format(currentDate, 'MMMM do, yyyy')}</p>
                </div>
                <div className="text-sm font-medium bg-gray-100 px-3 py-1 rounded-full text-gray-600">
                    {dayTasks.length} tasks
                </div>
            </div>

            <div className="space-y-2">
                {dayTasks.length > 0 ? (
                    dayTasks.map(task => (
                        <div key={task.id} className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                            <div 
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5`}
                                style={{ borderColor: getProjectColor(task.projectId) }}
                            >
                                <div className="w-2.5 h-2.5 rounded-full bg-gray-100 opacity-0 hover:opacity-100 transition-opacity"></div>
                            </div>
                            <div className="flex-1">
                                <div className="text-base font-medium text-gray-800">{task.content}</div>
                                {task.description && <div className="text-sm text-gray-500 mt-1">{task.description}</div>}
                                <div className="flex items-center gap-2 mt-2">
                                     <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">
                                        {projects.find(p => p.id === task.projectId)?.name}
                                     </span>
                                     <span className="text-xs font-mono text-gray-400">P{5 - task.priority}</span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Check size={32} className="text-gray-300" />
                        </div>
                        <p>No tasks scheduled for this day.</p>
                        <button className="mt-4 text-red-600 text-sm font-medium hover:underline">Add a task</button>
                    </div>
                )}
            </div>
        </div>
     );
  };

  const getHeaderTitle = () => {
      if (viewMode === 'month') return format(currentDate, 'MMMM yyyy');
      if (viewMode === 'week') {
          const start = startOfWeek(currentDate);
          const end = endOfWeek(currentDate);
          return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
      }
      return format(currentDate, 'MMMM yyyy'); // Day view title handled inside component or generic
  };

  return (
    <div className="upcoming-container">
      <div className="calendar-header">
        <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-800 min-w-[200px]">
              {getHeaderTitle()}
            </h1>
            <div className="view-switcher">
                <button 
                    onClick={() => setViewMode('month')} 
                    className={`view-btn ${viewMode === 'month' ? 'active' : ''}`}
                >Month</button>
                <button 
                    onClick={() => setViewMode('week')} 
                    className={`view-btn ${viewMode === 'week' ? 'active' : ''}`}
                >Week</button>
                <button 
                    onClick={() => setViewMode('day')} 
                    className={`view-btn ${viewMode === 'day' ? 'active' : ''}`}
                >Day</button>
            </div>
        </div>
        
        <div className="flex items-center gap-1 bg-gray-100 rounded-md p-1">
          <button onClick={prev} className="p-1 hover:bg-white rounded shadow-sm transition-all"><ChevronLeft size={18} /></button>
          <button onClick={goToToday} className="text-xs font-semibold px-2">Today</button>
          <button onClick={next} className="p-1 hover:bg-white rounded shadow-sm transition-all"><ChevronRight size={18} /></button>
        </div>
      </div>

      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'day' && renderDayView()}
    </div>
  );
};