import React from 'react';
import { Label, Priority, Task } from '../types';
import { Tag, Flag, AlertCircle, Bookmark } from 'lucide-react';
import './Filters.css';

interface FiltersProps {
  labels: Label[];
  onNavigate: (view: string) => void;
  tasks: Task[];
}

export const Filters: React.FC<FiltersProps> = ({ labels, onNavigate, tasks }) => {
  const priorities = [
    { name: 'Priority 1', value: Priority.P1, color: '#DC4C3E' },
    { name: 'Priority 2', value: Priority.P2, color: '#E8A87C' },
    { name: 'Priority 3', value: Priority.P3, color: '#4169E1' },
    { name: 'Priority 4', value: Priority.P4, color: '#808080' },
  ];

  return (
    <div className="filters-container">
      <div className="filters-header">
        <h1 className="filters-title">Filters & Labels</h1>
      </div>

      {/* Preset Filters */}
      <div className="filter-section">
        <h3 className="filter-section-title">Favorites</h3>
        <div className="filter-grid">
           <div className="filter-card" onClick={() => onNavigate('priority:4')}>
              <div className="filter-icon" style={{ color: '#DC4C3E', backgroundColor: '#FEF2F2' }}>
                 <AlertCircle size={18} />
              </div>
              <div className="flex flex-col">
                 <span className="font-medium text-sm text-gray-800">Urgent</span>
                 <span className="text-xs text-gray-400">{tasks.filter(t => t.priority === Priority.P1 && !t.isCompleted).length} tasks</span>
              </div>
           </div>
           
           <div className="filter-card">
              <div className="filter-icon" style={{ color: '#F59E0B', backgroundColor: '#FFFBEB' }}>
                 <Bookmark size={18} />
              </div>
               <div className="flex flex-col">
                 <span className="font-medium text-sm text-gray-800">Assigned to me</span>
                 <span className="text-xs text-gray-400">2 tasks</span>
              </div>
           </div>
        </div>
      </div>

      {/* Priorities */}
      <div className="filter-section">
        <h3 className="filter-section-title">Priorities</h3>
        <div className="filter-grid">
          {priorities.map(p => (
            <div key={p.value} className="filter-card" onClick={() => onNavigate(`priority:${p.value}`)}>
              <div className="filter-icon">
                <Flag size={18} style={{ color: p.color }} />
              </div>
               <div className="flex flex-col">
                 <span className="font-medium text-sm text-gray-800">{p.name}</span>
                 <span className="text-xs text-gray-400">
                    {tasks.filter(t => t.priority === p.value && !t.isCompleted).length} tasks
                 </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Labels */}
      <div className="filter-section">
        <h3 className="filter-section-title">Labels</h3>
        {labels.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No labels created yet.</p>
        ) : (
            <div className="filter-grid">
            {labels.map(label => (
                <div key={label.id} className="filter-card" onClick={() => onNavigate(`label:${label.id}`)}>
                <div className="filter-icon">
                    <Tag size={18} style={{ color: label.color }} />
                </div>
                <div className="flex flex-col">
                    <span className="font-medium text-sm text-gray-800">{label.name}</span>
                    <span className="text-xs text-gray-400">{label.color}</span>
                </div>
                </div>
            ))}
            </div>
        )}
      </div>
    </div>
  );
};