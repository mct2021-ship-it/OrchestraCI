import React, { useState, useMemo } from 'react';
import { Search, Filter, ChevronRight, Layout, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Project, Task, User } from '../types';
import { cn } from '../lib/utils';

interface SingleViewOfChangeProps {
  projects: Project[];
  tasks: Task[];
  users: User[];
  onSelectProject: (projectId: string) => void;
}

export function SingleViewOfChange({ projects, tasks, users, onSelectProject }: SingleViewOfChangeProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedSprint, setSelectedSprint] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = useMemo(() => {
    if (selectedProjectId === 'all') return projects.filter(p => !p.archived);
    return projects.filter(p => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  const availableSprints = useMemo(() => {
    if (selectedProjectId === 'all') return [];
    const project = projects.find(p => p.id === selectedProjectId);
    return project?.sprints || [];
  }, [projects, selectedProjectId]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const projectMatch = selectedProjectId === 'all' || task.projectId === selectedProjectId;
      const sprintMatch = selectedSprint === 'all' || task.sprint === selectedSprint;
      const statusMatch = selectedStatus === 'all' || task.status === selectedStatus || task.kanbanStatus === selectedStatus;
      const searchMatch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return projectMatch && sprintMatch && statusMatch && searchMatch && !task.archived;
    });
  }, [tasks, selectedProjectId, selectedSprint, selectedStatus, searchQuery]);

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || 'Unknown Project';
  };

  const getOwnerName = (ownerId: string) => {
    const user = users.find(u => u.id === ownerId || u.name === ownerId);
    return user ? user.name : ownerId;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text"
            placeholder="Search tasks across projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-400 mr-1" />
          <select 
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value);
              setSelectedSprint('all');
            }}
            className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
          >
            <option value="all">All Projects</option>
            {projects.filter(p => !p.archived).map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {selectedProjectId !== 'all' && availableSprints.length > 0 && (
            <select 
              value={selectedSprint}
              onChange={(e) => setSelectedSprint(e.target.value)}
              className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium animate-in fade-in slide-in-from-left-2"
            >
              <option value="all">All Sprints</option>
              {availableSprints.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}

          <select 
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="Discover">Discover</option>
            <option value="Define">Define</option>
            <option value="Develop">Develop</option>
            <option value="Deliver">Deliver</option>
            <option value="Todo">Todo (Kanban)</option>
            <option value="In Progress">In Progress (Kanban)</option>
            <option value="Done">Done (Kanban)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredTasks.length > 0 ? (
          filteredTasks.map(task => {
            const project = projects.find(p => p.id === task.projectId);
            const isOverdue = task.expectedCompletionDate && new Date(task.expectedCompletionDate) < new Date() && task.status !== 'Deliver' && task.kanbanStatus !== 'Done';
            
            return (
              <div 
                key={task.id}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 hover:border-indigo-500/50 hover:shadow-lg transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                       <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                        {getProjectName(task.projectId)}
                      </span>
                      {task.sprint && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          <Calendar className="w-3 h-3" />
                          {project?.sprints?.find(s => s.id === task.sprint)?.name || 'Sprint'}
                        </span>
                      )}
                    </div>
                    <h4 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 transition-colors mb-1">
                      {task.title}
                    </h4>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-1 max-w-2xl">
                      {task.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex flex-col items-end">
                      <div className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5",
                        task.status === 'Deliver' || task.kanbanStatus === 'Done' ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600" :
                        isOverdue ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 font-bold" :
                        "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      )}>
                        {task.status === 'Deliver' || task.kanbanStatus === 'Done' ? <CheckCircle2 className="w-3.5 h-3.5" /> : 
                         isOverdue ? <AlertCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        {task.kanbanStatus || task.status}
                      </div>
                      {task.expectedCompletionDate && (
                        <span className={cn(
                          "text-[10px] mt-1 font-medium",
                          isOverdue ? "text-rose-500" : "text-zinc-400"
                        )}>
                          Due {new Date(task.expectedCompletionDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pl-4 border-l border-zinc-100 dark:border-zinc-800">
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Owner</p>
                        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          {getOwnerName(task.owner)}
                        </p>
                      </div>
                      <img 
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(getOwnerName(task.owner))}&background=random`}
                        className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-800 shadow-sm"
                        alt=""
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
            <Layout className="w-16 h-16 text-zinc-300 dark:text-zinc-700 mb-4" />
            <h4 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">No tasks found</h4>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-sm">
              Try adjusting your filters or search query to find the tasks you're looking for.
            </p>
            <button 
              onClick={() => {
                setSelectedProjectId('all');
                setSelectedSprint('all');
                setSelectedStatus('all');
                setSearchQuery('');
              }}
              className="mt-6 px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
