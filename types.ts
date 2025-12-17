export enum Priority {
  P1 = 4, // Urgent
  P2 = 3, // High
  P3 = 2, // Medium
  P4 = 1  // Low (Normal)
}

export interface Task {
  id: string;
  content: string;
  description?: string;
  priority: Priority;
  dueString?: string; // Original text for due date
  dueDate?: string; // ISO string
  isCompleted: boolean;
  projectId: string;
  sectionId?: string;
  labels: string[];
  parentId?: string; // For subtasks
  createdAt: number;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  isFavorite: boolean;
  viewStyle: 'list' | 'board';
}

export interface Section {
  id: string;
  projectId: string;
  name: string;
  order: number;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  isSidebarOpen: boolean;
}