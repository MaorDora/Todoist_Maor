import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Calendar, ArrowRight } from 'lucide-react';
import { Task } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onNavigateToTask: (task: Task) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, tasks, onNavigateToTask }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const filteredTasks = tasks.filter(t => 
    t.content.toLowerCase().includes(query.toLowerCase()) || 
    t.description?.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5); // Limit results

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-gray-100">
          <Search className="text-gray-400 mr-3" size={20} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tasks..."
            className="flex-1 text-lg outline-none placeholder:text-gray-400 text-gray-700"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {query ? 'Results' : 'Recent'}
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {filteredTasks.length > 0 ? (
            filteredTasks.map(task => (
              <div 
                key={task.id}
                onClick={() => {
                  onNavigateToTask(task);
                  onClose();
                }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-50 last:border-0 group"
              >
                <div className={`w-4 h-4 rounded-full border border-gray-400 ${task.isCompleted ? 'bg-gray-300' : ''}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{task.content}</div>
                  {task.dueString && (
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar size={10} /> {task.dueString}
                    </div>
                  )}
                </div>
                <ArrowRight size={16} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))
          ) : (
            <div className="px-4 py-8 text-center text-gray-400 text-sm">
              No tasks found matching "{query}"
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 border-t border-gray-100 px-4 py-2 flex justify-between items-center text-xs text-gray-400">
          <span>Search functionality powered by local filtering</span>
          <span className="font-mono bg-gray-200 px-1.5 py-0.5 rounded text-gray-600">ESC</span>
        </div>
      </div>
    </div>
  );
};