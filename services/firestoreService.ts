import {
    collection,
    doc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query
} from "firebase/firestore";
import { db } from "./firebase";
import { Task, Project, Label } from "../types";

const TASKS_COLLECTION = "tasks";
const PROJECTS_COLLECTION = "projects";
const LABELS_COLLECTION = "labels";

// Default labels if none exist in DB
const DEFAULT_LABELS: Label[] = [
    { id: 'urgent', name: 'Urgent', color: '#DC4C3E' },
    { id: 'marketing', name: 'Marketing', color: '#E8A87C' },
];

export const firestoreService = {
    // --- TASKS ---
    getTasks: async (): Promise<Task[]> => {
        const q = query(collection(db, TASKS_COLLECTION));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Task));
    },

    addTask: async (task: Task) => {
        const { id, ...taskData } = task;
        await setDoc(doc(db, TASKS_COLLECTION, id), taskData);
    },

    updateTask: async (task: Task) => {
        const { id, ...taskData } = task;
        const taskRef = doc(db, TASKS_COLLECTION, id);
        await updateDoc(taskRef, taskData);
    },

    deleteTask: async (taskId: string) => {
        await deleteDoc(doc(db, TASKS_COLLECTION, taskId));
    },

    // --- PROJECTS ---
    getProjects: async (): Promise<Project[]> => {
        const snapshot = await getDocs(collection(db, PROJECTS_COLLECTION));
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Project));
    },

    addProject: async (project: Project) => {
        const { id, ...data } = project;
        await setDoc(doc(db, PROJECTS_COLLECTION, id), data);
    },

    // --- LABELS ---
    getLabels: async (): Promise<Label[]> => {
        const snapshot = await getDocs(collection(db, LABELS_COLLECTION));
        const labels = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Label));

        // If no labels in DB, return defaults
        return labels.length > 0 ? labels : DEFAULT_LABELS;
    }
};