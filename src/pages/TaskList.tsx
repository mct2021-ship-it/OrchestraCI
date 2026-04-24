import React, { useState, useMemo } from 'react';
import { Task, Project, User, RecycleBinItem, Sprint } from '../types';
import { CompanyProfile } from '../components/YourCompany';
import { Target, Search, Filter, AlertCircle, LayoutList, CheckCircle2, Clock, CheckSquare, User as UserIcon, Calendar, Trash2 as TrashIcon, UsersRound } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { ContextualHelp } from '../components/ContextualHelp';
import { TaskModal } from '../components/TaskModal';
import { usePermissions } from '../hooks/usePermissions';

interface TaskListProps {
  tasks: Task[];
  projects: Project[];
  sprints: Sprint[];
  initialAssigneeId?: string;
  initialProjectId?: string;
  initialTaskId?: string;
  onNavigate?: (tab: string) => void;
  isEmbedded?: boolean;
  onTaskClick?: (task: Task) => void;
  onUpdateTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onDeleteItem?: (item: any, type: RecycleBinItem['type'], originalProjectId?: string) => void;
  onAddTeamMember?: (user: User, projectId?: string) => void;
  currentUser?: User;
  users?: User[];
  onAddToAuditLog?: (action: string, details: string, type: 'Create' | 'Update' | 'Delete' | 'Restore' | 'Login', entityType?: string, entityId?: string, source?: 'Manual' | 'AI' | 'Data Source') => void;
  companyProfile?: CompanyProfile;
}

export function TaskList({ tasks, projects, sprints, initialAssigneeId, initialProjectId, initialTaskId, onNavigate, isEmbedded = false, onTaskClick, onUpdateTask, onDeleteTask, onDeleteItem, onAddTeamMember, currentUser, users = [], onAddToAuditLog, companyProfile }: TaskListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState<string>(initialAssigneeId || 'all');
  const [selectedProject, setSelectedProject] = useState<string>(initialProjectId || 'all');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [bulkAssignee, setBulkAssignee] = useState<string>('');
  const [bulkSprint, setBulkSprint] = useState<string>('');
  const [pendingTeamMember, setPendingTeamMember] = useState<User | null>(null);
  const [pendingTasksForTeam, setPendingTasksForTeam] = useState<Task[]>([]);

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

  // Available assignees from all users
  const availableAssignees = useMemo(() => {
    return users.map(u => u.name).sort();
  }, [users]);

  // Extract all unique assignees currently assigned to tasks (for filtering)
  const taskAssignees = useMemo(() => {
    const names = new Set<string>();
    tasks.forEach(task => {
      if (task.owner) {
        names.add(task.owner);
      }
    });
    return Array.from(names).sort();
  }, [tasks]);

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

  const handleBulkUpdate = (updates: Partial<Task>) => {
    if (!onUpdateTask) return;

    if (updates.owner) {
      const selectedUser = users.find(u => u.name === updates.owner);
      if (selectedUser) {
        const selectedTasks = tasks.filter(t => selectedTaskIds.includes(t.id));
        const projectsToUpdate = new Set<string>();
        
        selectedTasks.forEach(task => {
          const project = projects.find(p => p.id === task.projectId);
          if (project) {
            const isInTeam = project.team?.some(m => m.userId === selectedUser.id || m.name === selectedUser.name);
            if (!isInTeam) {
              projectsToUpdate.add(project.id);
            }
          }
        });

        if (projectsToUpdate.size > 0) {
          setPendingTeamMember(selectedUser);
          setPendingTasksForTeam(selectedTasks);
          return;
        }
      }
    }
    
    selectedTaskIds.forEach(id => {
      const task = tasks.find(t => t.id === id);
      if (task) {
        onUpdateTask({ ...task, ...updates });
      }
    });
    
    setSelectedTaskIds([]);
    setBulkAssignee('');
    setBulkSprint('');
  };

  const toggleTaskSelection = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTaskIds(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const toggleAllSelection = () => {
    if (selectedTaskIds.length === filteredTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(filteredTasks.map(t => t.id));
    }
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
              {taskAssignees.map(assignee => (
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

      <AnimatePresence>
        {selectedTaskIds.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-indigo-600 rounded-2xl p-4 flex flex-wrap items-center gap-6 text-white shadow-lg">
              <div className="flex items-center gap-3 pr-6 border-r border-white/20">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
                  {selectedTaskIds.length}
                </div>
                <span className="font-bold">Tasks Selected</span>
              </div>

              <div className="flex flex-wrap items-center gap-4 flex-1">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-indigo-200" />
                  <select 
                    value={bulkAssignee}
                    onChange={(e) => {
                      setBulkAssignee(e.target.value);
                      if (e.target.value) handleBulkUpdate({ owner: e.target.value });
                    }}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm font-bold outline-none focus:ring-2 focus:ring-white/50"
                  >
                    <option value="" className="text-zinc-900">Assign to...</option>
                    {availableAssignees.map(a => <option key={a} value={a} className="text-zinc-900">{a}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-200" />
                  <select 
                    value={bulkSprint}
                    onChange={(e) => {
                      setBulkSprint(e.target.value);
                      if (e.target.value) handleBulkUpdate({ sprint: e.target.value });
                    }}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm font-bold outline-none focus:ring-2 focus:ring-white/50"
                  >
                    <option value="" className="text-zinc-900">Move to Sprint...</option>
                    {sprints.map(s => <option key={s.id} value={s.name} className="text-zinc-900">{s.name}</option>)}
                  </select>
                </div>
              </div>

              <button 
                onClick={() => setSelectedTaskIds([])}
                className="text-sm font-bold hover:text-indigo-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900/50 z-10 shadow-sm">
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-6 py-4 w-10">
                  <button 
                    onClick={toggleAllSelection}
                    className={cn(
                      "w-5 h-5 rounded border flex items-center justify-center transition-all",
                      selectedTaskIds.length === filteredTasks.length && filteredTasks.length > 0
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : "bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                    )}
                  >
                    {selectedTaskIds.length === filteredTasks.length && filteredTasks.length > 0 && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                </th>
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
                    className={cn(
                      "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer",
                      selectedTaskIds.includes(task.id) && "bg-indigo-50/50 dark:bg-indigo-900/10"
                    )}
                  >
                    <td className="px-6 py-4" onClick={(e) => toggleTaskSelection(task.id, e)}>
                      <div className={cn(
                        "w-5 h-5 rounded border flex items-center justify-center transition-all",
                        selectedTaskIds.includes(task.id)
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                      )}>
                        {selectedTaskIds.includes(task.id) && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </td>
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
                        {sprints.find(s => s.id === task.sprint)?.name || task.sprint || '-'}
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
            sprints={sprints}
            currentUser={currentUser}
            users={users}
            isReadOnly={!canEditProjectFeature(projects.find(p => p.id === editingTask.projectId) || projects[0])}
            companyProfile={companyProfile}
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

      {/* Add to Team Prompt for Bulk Assignment */}
      <AnimatePresence>
        {pendingTeamMember && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 text-center"
            >
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <UsersRound className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Add to Project Teams?</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
                <span className="font-bold text-zinc-900 dark:text-white">{pendingTeamMember.name}</span> is not currently on some of the project teams for the selected tasks. Would you like me to add them?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setPendingTeamMember(null);
                    setPendingTasksForTeam([]);
                    setBulkAssignee('');
                  }}
                  className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl font-bold hover:bg-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (onAddTeamMember) {
                      // Find all projects that need this user
                      const projectsToUpdate = new Set<string>();
                      pendingTasksForTeam.forEach(task => {
                        const project = projects.find(p => p.id === task.projectId);
                        if (project) {
                          const isInTeam = project.team?.some(m => m.userId === pendingTeamMember.id || m.name === pendingTeamMember.name);
                          if (!isInTeam) {
                            projectsToUpdate.add(project.id);
                          }
                        }
                      });

                      // Add them to each project
                      projectsToUpdate.forEach(pid => {
                        onAddTeamMember(pendingTeamMember, pid);
                      });
                    }

                    // Proceed with bulk update
                    pendingTasksForTeam.forEach(task => {
                      if (onUpdateTask) {
                        onUpdateTask({ ...task, owner: pendingTeamMember.name });
                      }
                    });

                    setPendingTeamMember(null);
                    setPendingTasksForTeam([]);
                    setSelectedTaskIds([]);
                    setBulkAssignee('');
                    setBulkSprint('');
                  }}
                  className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
                >
                  Add & Assign
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  return content;
}
