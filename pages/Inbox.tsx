import React, { useState, useRef, useEffect } from 'react';
import { Task, Project, Section } from '../types';
import { TaskItem } from '../components/TaskItem';
import { AddTask } from '../components/AddTask';
import { MoreHorizontal, Edit2, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import { firestoreService } from '../services/firestoreService';
import './Inbox.css';

// --- רכיב עזר לניהול Section בודד ---
interface InboxSectionProps {
    section: Section;
    tasks: Task[];
    projects: Project[];
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onAddSubtasks: (parentId: string, subtasks: string[]) => void;
    onAddTask: (task: any) => void;
    onDeleteSection: (id: string) => void;
}

const InboxSection: React.FC<InboxSectionProps> = ({
    section, tasks, projects, onToggle, onDelete, onAddSubtasks, onAddTask, onDeleteSection
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // סגירת תפריט בלחיצה מחוץ לרכיב
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        if (isMenuOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

    return (
        <div className="section-wrapper group/section">
            {/* כותרת ה-Section עם הקו המפריד (מנוהל ב-CSS) */}
            <div className="section-header">
                <div
                    className="section-title-area"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <span className={`section-arrow ${isExpanded ? 'expanded' : ''}`}>
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </span>
                    <h3 className="section-name">{section.name}</h3>
                    <span className="section-count">{tasks.length}</span>
                </div>

                {/* תפריט 3 נקודות */}
                <div className="relative" ref={menuRef}>
                    <button
                        className={`section-menu-trigger ${isMenuOpen ? 'force-visible' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsMenuOpen(!isMenuOpen);
                        }}
                    >
                        <MoreHorizontal size={18} />
                    </button>

                    {isMenuOpen && (
                        <div className="section-context-menu">
                            <button className="menu-item"><Edit2 size={14} /> Edit</button>
                            <div className="menu-divider"></div>
                            <button
                                onClick={() => onDeleteSection(section.id)}
                                className="menu-item delete"
                            >
                                <Trash2 size={14} /> Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* תוכן ה-Section (משימות + הוספה) - מופיע רק אם פתוח */}
            {isExpanded && (
                <div className="section-content">
                    <div className="space-y-1 mb-2">
                        {tasks.map(task => (
                            <TaskItem
                                key={task.id}
                                task={task}
                                allTasks={tasks}
                                projects={projects}
                                onToggle={onToggle}
                                onDelete={onDelete}
                                onAddSubtasks={onAddSubtasks}
                                onUpdate={() => { }}
                            />
                        ))}
                    </div>
                    <div className="pl-0">
                        <AddTask onAdd={onAddTask} defaultProjectId="inbox" defaultSectionId={section.id} />
                    </div>
                </div>
            )}
        </div>
    );
};

// --- הרכיב הראשי ---

interface InboxProps {
    tasks: Task[];
    projects: Project[];
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onAddSubtasks: (parentId: string, subtasks: string[]) => void;
    onAddTask: (task: any) => void;
}

export const Inbox: React.FC<InboxProps> = ({ tasks, projects, onToggle, onDelete, onAddSubtasks, onAddTask }) => {
    const [sections, setSections] = useState<Section[]>([]);
    const [isAddingSection, setIsAddingSection] = useState(false);
    const [newSectionName, setNewSectionName] = useState('');

    useEffect(() => {
        const loadSections = async () => {
            const fetchedSections = await firestoreService.getSections('inbox');
            setSections(fetchedSections);
        };
        loadSections();
    }, []);

    const handleAddSection = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSectionName.trim()) return;

        const newSection: Section = {
            id: crypto.randomUUID(),
            projectId: 'inbox',
            name: newSectionName,
            order: sections.length
        };

        setSections([...sections, newSection]);
        setNewSectionName('');
        setIsAddingSection(false);
        await firestoreService.addSection(newSection);
    };

    const deleteSection = async (secId: string) => {
        setSections(sections.filter(s => s.id !== secId));
        await firestoreService.deleteSection(secId);
    };

    // סינון משימות
    const inboxTasks = tasks.filter(t => t.projectId === 'inbox' && !t.parentId);
    const unsectionedTasks = inboxTasks.filter(t => !t.sectionId);

    // רכיב טופס הוספת סקשן
    const AddSectionForm = () => (
        <form onSubmit={handleAddSection} className="add-section-form animate-in fade-in zoom-in-95 duration-200">
            <input
                autoFocus
                type="text"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="Name this section"
                className="section-input"
            />
            <div className="flex gap-2 mt-2">
                <button type="submit" disabled={!newSectionName.trim()} className="btn-add">Add section</button>
                <button type="button" onClick={() => { setIsAddingSection(false); setNewSectionName(''); }} className="btn-cancel">Cancel</button>
            </div>
        </form>
    );

    // כפתור טריגר להוספת סקשן
    const AddSectionTrigger = () => (
        <div
            className="add-section-trigger"
            onClick={() => setIsAddingSection(true)}
        >
            <div className="trigger-line"></div>
            <span className="trigger-text">Add section</span>
            <div className="trigger-line"></div>
        </div>
    );

    return (
        <div className="inbox-container">
            <div className="inbox-header">
                <h1 className="inbox-title">Inbox</h1>
            </div>

            {/* משימות ללא Section (תמיד למעלה) */}
            <div className="space-y-1">
                {unsectionedTasks.map(task => (
                    <TaskItem
                        key={task.id}
                        task={task}
                        allTasks={tasks}
                        projects={projects}
                        onToggle={onToggle}
                        onDelete={onDelete}
                        onAddSubtasks={onAddSubtasks}
                        onUpdate={() => { }}
                    />
                ))}
            </div>

            <div className="mt-2 mb-4">
                <AddTask onAdd={onAddTask} defaultProjectId="inbox" />
            </div>

            {/* הוספת סקשן מעל הסקשן הראשון אם יש סקשנים - עם מרווח גדול יותר */}
            {sections.length > 0 && !isAddingSection && (
                <div className="opacity-0 hover:opacity-100 transition-opacity relative z-10 my-4">
                    <AddSectionTrigger />
                </div>
            )}

            {/* רשימת ה-Sections */}
            <div className="space-y-4">
                {sections.map(section => {
                    const sectionTasks = inboxTasks.filter(t => t.sectionId === section.id);
                    return (
                        <InboxSection
                            key={section.id}
                            section={section}
                            tasks={sectionTasks}
                            projects={projects}
                            onToggle={onToggle}
                            onDelete={onDelete}
                            onAddSubtasks={onAddSubtasks}
                            onAddTask={onAddTask}
                            onDeleteSection={deleteSection}
                        />
                    )
                })}
            </div>

            {/* הוספת Section בתחתית */}
            <div className="mt-6 pb-20">
                {!isAddingSection ? (
                    <AddSectionTrigger />
                ) : (
                    <AddSectionForm />
                )}
            </div>

            {/* Empty State */}
            {inboxTasks.length === 0 && sections.length === 0 && !isAddingSection && (
                <div className="empty-state">
                    <p className="text-gray-500 font-medium">All clear! Relax and recharge.</p>
                </div>
            )}
        </div>
    );
};