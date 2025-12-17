import {
    collection,
    doc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where
} from "firebase/firestore";
import { db } from "./firebase";
import { Task, Project, Label, Section } from "../types";

const TASKS_COLLECTION = "tasks";
const PROJECTS_COLLECTION = "projects";
const LABELS_COLLECTION = "labels";
const SECTIONS_COLLECTION = "sections";

const DEFAULT_LABELS: Label[] = [
    { id: 'urgent', name: 'Urgent', color: '#DC4C3E' },
    { id: 'marketing', name: 'Marketing', color: '#E8A87C' },
];

export const firestoreService = {
    // --- TASKS ---
    getTasks: async (): Promise<Task[]> => {
        const q = query(collection(db, TASKS_COLLECTION));
        const snapshot = await getDocs(q);
        // התיקון: (doc.data() as any)
        return snapshot.docs.map(doc => ({ ...(doc.data() as any), id: doc.id } as Task));
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
        // התיקון: (doc.data() as any)
        return snapshot.docs.map(doc => ({ ...(doc.data() as any), id: doc.id } as Project));
    },

    addProject: async (project: Project) => {
        const { id, ...data } = project;
        await setDoc(doc(db, PROJECTS_COLLECTION, id), data);
    },

    // --- SECTIONS ---
    getSections: async (projectId?: string): Promise<Section[]> => {
        let q;
        if (projectId) {
            q = query(collection(db, SECTIONS_COLLECTION), where("projectId", "==", projectId));
        } else {
            q = query(collection(db, SECTIONS_COLLECTION));
        }
        const snapshot = await getDocs(q);

        // התיקון: (doc.data() as any)
        return snapshot.docs
            .map(doc => ({ ...(doc.data() as any), id: doc.id } as Section))
            .sort((a, b) => a.order - b.order);
    },

    addSection: async (section: Section) => {
        const { id, ...data } = section;
        await setDoc(doc(db, SECTIONS_COLLECTION, id), data);
    },

    deleteSection: async (sectionId: string) => {
        await deleteDoc(doc(db, SECTIONS_COLLECTION, sectionId));
    },

    // --- LABELS ---
    getLabels: async (): Promise<Label[]> => {
        const snapshot = await getDocs(collection(db, LABELS_COLLECTION));
        // התיקון: (doc.data() as any)
        const labels = snapshot.docs.map(doc => ({ ...(doc.data() as any), id: doc.id } as Label));
        return labels.length > 0 ? labels : DEFAULT_LABELS;
    }
};