import React from 'react';
import { Task, Project } from '../types';
import { TaskItem } from '../components/TaskItem';
import { AddTask } from '../components/AddTask';
import { CheckCircle2, Hash } from 'lucide-react';
import './ProjectView.css';

interface ProjectViewProps {
  projectId: string;
  tasks: Task[];
  projects: Project[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAddSubtasks: (parentId: string, subtasks: string[]) => void;
  onAddTask: (task: any) => void;
}

export const ProjectView: React.FC<ProjectViewProps> = ({ 
  projectId, tasks, projects, onToggle, onDelete, onAddSubtasks, onAddTask 
}) => {
  const project = projects.find(p => p.id === projectId);
  const rootTasks = tasks.filter(t => t.projectId === projectId && !t.parentId);

  if (!project) return <div>Project not found</div>;

  return (
    <div className="project-container">
      <div className="project-header">
        <h1 className="project-title">
             <span style={{ color: project.color }}>#</span>
             {project.name}
        </h1>
        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
          <CheckCircle2 size={12} />
          {rootTasks.filter(t => !t.isCompleted).length} tasks
        </div>
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
           <p className="text-gray-500 font-medium">This project is empty.</p>
        </div>
      )}

      <div className="mt-4">
        <AddTask onAdd={onAddTask} defaultProjectId={projectId} />
      </div>
    </div>
  );
};