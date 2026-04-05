import React, { useState, useMemo } from 'react';
import { Task, Project, User, RecycleBinItem } from '../types';
import { Target, Search, Filter, AlertCircle, LayoutList, CheckCircle2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { ContextualHelp } from '../components/ContextualHelp';
import { TaskModal } from '../components/TaskModal';
import { usePermissions } from '../hooks/usePermissions';

interface TaskListProps {
  tasks: Task[];
  projects: Project[];
  initialAssigneeId?: string;
  initialProjectId?: string;
  initialTaskId?: string;
  onNavigate?: (tab: string) => void;
  isEmbedded?: boolean;
  onTaskClick?: (task: Task) => void;
  onUpdateTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onDeleteItem?: (item: any, type: RecycleBinItem['type'], originalProjectId?: string) => void;
  onAddTeamMember?: (user: User) => void;
  currentUser?: User;
  users?: User[];
}

export function TaskList({ tasks, projects, initialAssigneeId, initialProjectId, initialTaskId, onNavigate, isEmbedded = false, onTaskClick, onUpdateTask, onDeleteTask, onDeleteItem, onAddTeamMember, currentUser, users = [] }: TaskListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState<string>(initialAssigneeId || 'all');
  const [selectedProject, setSelectedProject] = useState<string>(initialProjectId || 'all');
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const { canEditProjectFeature } = usePermissions();

  React.useEffect(() => {
    if (initialTaskId) {
      const task = tasks.find(t => t.id === initialTaskId);
      if (task) {
        setEditingTask(task);
      }
    }
  }, [initialTaskId, tasks]);

  React.useEffect(() => {
    if (initialAssigneeId) {
      setSelectedAssignee(initialAssigneeId);
    }
  }, [initialAssigneeId]);

  React.useEffect(() => {
    if (initialProjectId) {
      setSelectedProject(initialProjectId);
    }
  }, [initialProjectId]);

  // Extract all unique assignees from tasks and project teams
  const assignees = useMemo(() => {
    const users = new Map<string, string>();
    
    // Add from tasks
    tasks.forEach(task => {
      if (task.owner) {
        users.set(task.owner, task.owner);
      }
    });
    
    // Add from project teams
    projects.forEach(project => {
      project.team?.forEach(member => {
        users.set(member.name, member.name);
      });
    });
    
    return Array.from(users.values()).sort();
  }, [tasks, projects]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            task.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesAssignee = selectedAssignee === 'all' ? true : 
                              selectedAssignee === 'unassigned' ? !task.owner : 
                              task.owner === selectedAssignee;
                              
      const matchesProject = selectedProject === 'all' ? true : task.projectId === selectedProject;
      
      // Don't show archived tasks unless explicitly searching for them?
      // For now, let's just show all non-archived tasks
      const isNotArchived = !task.archived;
      
      return matchesSearch && matchesAssignee && matchesProject && isNotArchived;
    });
  }, [tasks, searchQuery, selectedAssignee, selectedProject]);

  const isTaskOverdue = (task: Task) => {
    if (!task.expectedCompletionDate) return false;
    if (task.kanbanStatus === 'Done' || task.status === 'Done' || task.archived) return false;
    
    const expected = new Date(task.expectedCompletionDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return expected < today;
  };

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || 'Unknown Project';
  };

  const content = (
    <div className={cn("flex flex-col min-h-full", !isEmbedded && "p-8 max-w-[1600px] mx-auto space-y-8")}>
      {!isEmbedded && (
        <>
          <div className="shrink-0">
            <ContextualHelp 
              title="Task List" 
              description="View and manage all tasks across your projects. Filter by assignee, project, and search for specific items."
            />
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-bold text-indigo-600 uppercase tracking-widest">
                <LayoutList className="w-4 h-4" />
                Task Management
              </div>
              <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">All Tasks</h2>
            </div>
          </div>
        </>
      )}

      <div className="flex flex-col sm:flex-row gap-4 shrink-0">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white font-medium"
          />
        </div>
        
        <div className="flex gap-4">
          <div className="relative min-w-[200px]">
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="w-full appearance-none bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-4 pr-10 py-3 font-bold text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">All Assignees</option>
              <option value="unassigned">Unassigned</option>
              {assignees.map(assignee => (
                <option key={assignee} value={assignee}>{assignee}</option>
              ))}
            </select>
            <Filter className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>

          {!isEmbedded && (
            <div className="relative min-w-[200px]">
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full appearance-none bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-4 pr-10 py-3 font-bold text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="all">All Projects</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
              <Filter className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900/50 z-10 shadow-sm">
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Task</th>
                {!isEmbedded && <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Project</th>}
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Sprint</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={isEmbedded ? 5 : 6} className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                    No tasks found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredTasks.map(task => (
                  <tr 
                    key={task.id} 
                    onClick={() => {
                      if (onTaskClick) {
                        onTaskClick(task);
                      } else {
                        setEditingTask(task);
                      }
                    }}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-zinc-900 dark:text-white">{task.title}</div>
                        {isTaskOverdue(task) && (
                          <div className="flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-900/20 px-1.5 py-0.5 rounded shrink-0" title="Overdue">
                            <AlertCircle className="w-3 h-3" />
                            Overdue
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-1">{task.description}</div>
                    </td>
                    {!isEmbedded && (
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          {getProjectName(task.projectId)}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        {task.sprint || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold",
                        task.kanbanStatus === 'Done' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                        "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      )}>
                        {task.kanbanStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                        <Clock className="w-4 h-4" />
                        {task.expectedCompletionDate ? new Date(task.expectedCompletionDate).toLocaleDateString() : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {task.owner ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                            {task.owner.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-zinc-900 dark:text-white">{task.owner}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-zinc-400 italic">Unassigned</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {editingTask && (
          <TaskModal
            task={editingTask}
            project={projects.find(p => p.id === editingTask.projectId) || projects[0]}
            currentUser={currentUser}
            users={users}
            isReadOnly={!canEditProjectFeature(projects.find(p => p.id === editingTask.projectId) || projects[0])}
            onSave={(updatedTask) => {
              if (onUpdateTask) {
                onUpdateTask(updatedTask);
              }
              setEditingTask(null);
            }}
            onUpdate={(updatedTask) => {
              if (onUpdateTask) {
                onUpdateTask(updatedTask);
              }
            }}
            onClose={() => setEditingTask(null)}
            onAddTeamMember={onAddTeamMember}
            onDelete={(taskId) => {
              const task = tasks.find(t => t.id === taskId);
              if (task && onDeleteItem) {
                onDeleteItem(task, 'Task', task.projectId);
              } else if (onDeleteTask) {
                onDeleteTask(taskId);
              }
              setEditingTask(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );

  return content;
}
