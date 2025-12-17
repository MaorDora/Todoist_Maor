import { Task, Project, Label, Priority, Section } from "../types";

// NOTE: This service simulates a Firebase connection. 
// Since we cannot securely access the user's Firebase config in this environment,
// we default to localStorage for immediate functionality.

const TASKS_KEY = 'doit_ai_tasks';
const PROJECTS_KEY = 'doit_ai_projects';
const LABELS_KEY = 'doit_ai_labels';
const SECTIONS_KEY = 'doit_ai_sections';

// Initial Mock Data
const DEFAULT_PROJECTS: Project[] = [
  { id: 'inbox', name: 'Inbox', color: '#808080', isFavorite: false, viewStyle: 'list' },
  { id: 'personal', name: 'Personal', color: '#DC4C3E', isFavorite: true, viewStyle: 'list' },
  { id: 'work', name: 'Work', color: '#4169E1', isFavorite: true, viewStyle: 'board' },
];

const DEFAULT_LABELS: Label[] = [
  { id: 'urgent', name: 'Urgent', color: '#DC4C3E' },
  { id: 'marketing', name: 'Marketing', color: '#E8A87C' },
];

const DEFAULT_SECTIONS: Section[] = [
  { id: 'bot', projectId: 'inbox', name: 'ניהול בוט', order: 0 },
  { id: 'general', projectId: 'inbox', name: 'כללי', order: 1 }
];

export const storageService = {
  // TASKS
  getTasks: (): Task[] => {
    const stored = localStorage.getItem(TASKS_KEY);
    return stored ? JSON.parse(stored) : [];
  },
  
  saveTask: (task: Task) => {
    const tasks = storageService.getTasks();
    const index = tasks.findIndex(t => t.id === task.id);
    if (index >= 0) {
      tasks[index] = task;
    } else {
      tasks.push(task);
    }
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  },

  deleteTask: (taskId: string) => {
    const tasks = storageService.getTasks().filter(t => t.id !== taskId);
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  },

  // PROJECTS
  getProjects: (): Project[] => {
    const stored = localStorage.getItem(PROJECTS_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_PROJECTS;
  },

  saveProject: (project: Project) => {
    const projects = storageService.getProjects();
    const index = projects.findIndex(p => p.id === project.id);
    if (index >= 0) projects[index] = project;
    else projects.push(project);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  },

  // SECTIONS
  getSections: (projectId?: string): Section[] => {
    const stored = localStorage.getItem(SECTIONS_KEY);
    const sections: Section[] = stored ? JSON.parse(stored) : DEFAULT_SECTIONS;
    if (projectId) return sections.filter(s => s.projectId === projectId).sort((a, b) => a.order - b.order);
    return sections;
  },

  saveSection: (section: Section) => {
    const sections = storageService.getSections(); // get all
    const index = sections.findIndex(s => s.id === section.id);
    if (index >= 0) sections[index] = section;
    else sections.push(section);
    localStorage.setItem(SECTIONS_KEY, JSON.stringify(sections));
  },

  deleteSection: (sectionId: string) => {
      const sections = storageService.getSections().filter(s => s.id !== sectionId);
      localStorage.setItem(SECTIONS_KEY, JSON.stringify(sections));
  },

  // LABELS
  getLabels: (): Label[] => {
    const stored = localStorage.getItem(LABELS_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_LABELS;
  }
};