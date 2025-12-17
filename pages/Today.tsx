import React from 'react';
import { Task, Project } from '../types';
import { TaskItem } from '../components/TaskItem';
import { AddTask } from '../components/AddTask';
import { CheckCircle2 } from 'lucide-react';
import { isToday, parseISO } from 'date-fns';
import './Today.css';

interface TodayProps {
  tasks: Task[];
  projects: Project[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAddSubtasks: (parentId: string, subtasks: string[]) => void;
  onAddTask: (task: any) => void;
}

export const Today: React.FC<TodayProps> = ({ tasks, projects, onToggle, onDelete, onAddSubtasks, onAddTask }) => {
  const rootTasks = tasks.filter(t => {
    if (t.parentId) return false;
    const isDueStringToday = t.dueString?.toLowerCase().includes('today');
    const isIsoToday = t.dueDate ? isToday(parseISO(t.dueDate)) : false;
    return isDueStringToday || isIsoToday;
  });

  return (
    <div className="today-container">
      <div className="today-header">
        <h1 className="today-title">Today</h1>
        <span className="today-date">{new Date().toDateString()}</span>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-4">
        <CheckCircle2 size={12} />
        {rootTasks.filter(t => !t.isCompleted).length} tasks
      </div>

      <div className="space-y-1">
        {rootTasks.map(task => (
          <TaskItem 
            key={task.id} 
            task={task} 
            allTasks={tasks}
            projects={projects}
            onToggle={onToggle}
            onDelete={onDelete}
            onAddSubtasks={onAddSubtasks}
            onUpdate={() => {}}
          />
        ))}
      </div>

      {rootTasks.length === 0 && (
         <div className="py-12 flex flex-col items-center justify-center text-center opacity-60">
            <p className="text-gray-500 font-medium">No tasks for today. Enjoy your day!</p>
         </div>
      )}

      <div className="mt-4">
        <AddTask onAdd={onAddTask} defaultProjectId="inbox" />
      </div>
    </div>
  );
};