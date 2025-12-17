import React, { useState, useEffect } from 'react';
import { Task, Project, Section } from '../types';
import { TaskItem } from '../components/TaskItem';
import { AddTask } from '../components/AddTask';
import { MoreHorizontal, Edit2, Trash2, Copy, ArrowRight } from 'lucide-react';
import { firestoreService } from '../services/firestoreService';
import './Inbox.css';

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

    // Fetch sections for Inbox on mount
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

        // אופטימיסטי
        setSections([...sections, newSection]);
        setNewSectionName('');
        setIsAddingSection(false);

        // שמירה בשרת
        await firestoreService.addSection(newSection);
    };

    const deleteSection = async (secId: string) => {
        // אופטימיסטי
        setSections(sections.filter(s => s.id !== secId));
        // מחיקה בשרת
        await firestoreService.deleteSection(secId);
    };

    // Group tasks
    const inboxTasks = tasks.filter(t => t.projectId === 'inbox' && !t.parentId);
    const unsectionedTasks = inboxTasks.filter(t => !t.sectionId);

    return (
        <div className="inbox-container">
            <div className="inbox-header">
                <h1 className="inbox-title">Inbox</h1>
            </div>

            {/* Unsectioned Tasks */}
            <div className="space-y-1 mb-6">
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

            <div className="mt-2 mb-6">
                <AddTask onAdd={onAddTask} defaultProjectId="inbox" />
            </div>

            {/* Sections */}
            <div className="space-y-8">
                {sections.map(section => {
                    const sectionTasks = inboxTasks.filter(t => t.sectionId === section.id);
                    return (
                        <div key={section.id} className="group/section">
                            <div className="flex items-center justify-between mb-2 pb-1 border-b border-gray-100 group-hover/section:border-gray-200 transition-colors">
                                <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                                    {section.name}
                                    <span className="text-gray-400 font-normal text-xs">{sectionTasks.length}</span>
                                </h3>
                                <div className="opacity-0 group-hover/section:opacity-100 transition-opacity relative group/menu">
                                    <button className="p-1 hover:bg-gray-100 rounded text-gray-400">
                                        <MoreHorizontal size={16} />
                                    </button>
                                    {/* Section Context Menu */}
                                    <div className="absolute right-0 top-6 w-48 bg-white shadow-xl border border-gray-100 rounded-lg hidden group-hover/menu:block z-10 py-1">
                                        <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-xs text-gray-700 flex items-center gap-2"><Edit2 size={12} /> Edit</button>
                                        <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-xs text-gray-700 flex items-center gap-2"><Copy size={12} /> Duplicate</button>
                                        <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-xs text-gray-700 flex items-center gap-2"><ArrowRight size={12} /> Move to...</button>
                                        <div className="border-t border-gray-100 my-1"></div>
                                        <button onClick={() => deleteSection(section.id)} className="w-full text-left px-4 py-2 hover:bg-red-50 text-xs text-red-600 flex items-center gap-2"><Trash2 size={12} /> Delete</button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1 mb-2">
                                {sectionTasks.map(task => (
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
                    )
                })}
            </div>

            {/* Add Section Trigger & Form */}
            <div className="mt-6 pb-20">
                {!isAddingSection ? (
                    <div
                        className="group relative flex items-center justify-center py-4 cursor-pointer"
                        onClick={() => setIsAddingSection(true)}
                    >
                        {/* Hit area */}
                        <div className="absolute inset-x-0 h-8 -mt-4 z-0"></div>

                        {/* Visual Line & Text */}
                        <div className="w-full flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                            <div className="h-[1px] bg-[#db4c3f] flex-1"></div>
                            <span className="text-[#db4c3f] text-[13px] font-bold">Add section</span>
                            <div className="h-[1px] bg-[#db4c3f] flex-1"></div>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleAddSection} className="animate-in fade-in zoom-in-95 duration-200">
                        <input
                            autoFocus
                            type="text"
                            value={newSectionName}
                            onChange={(e) => setNewSectionName(e.target.value)}
                            placeholder="Name this section"
                            className="w-full text-[14px] border border-gray-300 rounded-[5px] px-3 py-2 outline-none focus:border-gray-400 placeholder:text-gray-400 font-normal"
                        />
                        <div className="flex gap-3 mt-3">
                            <button
                                type="submit"
                                disabled={!newSectionName.trim()}
                                className="bg-[#db4c3f] hover:bg-[#b03d32] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-bold px-3 py-1.5 rounded-[4px] transition-colors"
                            >
                                Add section
                            </button>
                            <button
                                type="button"
                                onClick={() => { setIsAddingSection(false); setNewSectionName(''); }}
                                className="text-[#555] hover:bg-gray-100 text-[13px] font-bold px-3 py-1.5 rounded-[4px] transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Bottom spacer if empty */}
            {inboxTasks.length === 0 && sections.length === 0 && !isAddingSection && (
                <div className="empty-state">
                    <div className="w-48 h-48 mb-4">
                        <img src="https://illustrations.popsy.co/amber/surr-getting-things-done.svg" alt="Empty State" />
                    </div>
                    <p className="text-gray-500 font-medium">All clear! Relax and recharge.</p>
                </div>
            )}
        </div>
    );
};