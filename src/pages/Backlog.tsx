import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Target, Trash2, Edit3, X, CheckCircle2, AlertCircle, Clock, ArrowRight, LayoutList, MessageSquare, Sparkles } from 'lucide-react';
import { Project, Task, User } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { EditableText } from '../components/EditableText';
import { cn } from '../lib/utils';
import { ContextualHelp } from '../components/ContextualHelp';
import { TaskModal } from '../components/TaskModal';
import { usePermissions } from '../hooks/usePermissions';
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { useToast } from '../context/ToastContext';

interface BacklogProps {
  project: Project;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onNavigate: (tab: string, subTab?: string) => void;
  currentUser?: any;
  onDeleteItem?: (item: any, type: any, originalProjectId?: string) => void;
  onAddTeamMember?: (user: User) => void;
  users?: any[];
}

export function Backlog({ project, tasks, setTasks, onNavigate, currentUser, onDeleteItem, onAddTeamMember, users = [] }: BacklogProps) {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isPrioritizing, setIsPrioritizing] = useState(false);
  const { addToast } = useToast();
  
  const { canEditProjectFeature } = usePermissions();
  const canEdit = canEditProjectFeature(project);

  const kanbanColumns = project.kanbanColumns || [
    { id: 'Backlog', title: 'Backlog', color: 'zinc', order: 0 },
    { id: 'In Progress', title: 'In Progress', color: 'blue', order: 1 },
    { id: 'Done', title: 'Done', color: 'emerald', order: 2 },
    { id: 'Blocked', title: 'Blocked', color: 'rose', order: 3 }
  ];

  const sortedColumns = [...kanbanColumns].sort((a, b) => a.order - b.order);
  const backlogColumn = sortedColumns[0];

  const backlogTasks = tasks.filter(t => 
    t.projectId === project.id && 
    (t.kanbanStatus === 'backlog' || 
     t.kanbanStatus === 'Backlog' || 
     t.kanbanStatus === backlogColumn.id || 
     t.kanbanStatus === backlogColumn.title)
  );

  const moscowCategories = [
    { id: 'Must', label: 'Must Have', color: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800' },
    { id: 'Should', label: 'Should Have', color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' },
    { id: 'Could', label: 'Could Have', color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' },
    { id: 'Wont', label: 'Won\'t Have', color: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700' }
  ];

  const handleSaveTask = (updatedTask: Task) => {
    if (isAddingTask) {
      setTasks([...tasks, updatedTask]);
      setIsAddingTask(false);
    } else if (editingTask) {
      setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
      setEditingTask(null);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && onDeleteItem) {
      onDeleteItem(task, 'Task', project.id);
    } else {
      setTasks(tasks.filter(t => t.id !== taskId));
    }
    setEditingTask(null);
  };

  const handleMoveToBoard = (taskId: string) => {
    // Move to the first column that is NOT the backlog
    const firstActiveColumnId = kanbanColumns.find(c => c.id !== 'Backlog' && c.id !== 'backlog')?.id || 'In Progress';
    setTasks(tasks.map(t => t.id === taskId ? { ...t, kanbanStatus: firstActiveColumnId } : t));
  };

  const handleStatusChange = (taskId: string, newStatus: string) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, kanbanStatus: newStatus } : t));
  };

  const handleAiPrioritize = async () => {
    if (backlogTasks.length === 0 || isPrioritizing) return;
    
    setIsPrioritizing(true);
    addToast('Analyzing backlog for prioritization...', 'info');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Prioritize the following project tasks using the MoSCoW method (Must, Should, Could, Wont).
        Project: ${project.name}
        Description: ${project.description}
        
        Tasks:
        ${backlogTasks.map(t => `- ID: ${t.id}, Title: ${t.title}, Description: ${t.description}`).join('\n')}
        
        Format the output as a JSON object where keys are task IDs and values are the suggested MoSCoW priority (Must, Should, Could, or Wont).
        Example: { "task-id-1": "Must", "task-id-2": "Should" }`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json"
        }
      });

      const priorities = JSON.parse(response.text);
      
      setTasks(prev => prev.map(t => {
        if (priorities[t.id]) {
          return { ...t, moscow: priorities[t.id] };
        }
        return t;
      }));
      
      addToast('Backlog prioritized with AI', 'success');
    } catch (error) {
      console.error('Error prioritizing backlog:', error);
      addToast('Failed to prioritize backlog', 'error');
    } finally {
      setIsPrioritizing(false);
    }
  };

  const createNewTask = (): Task => ({
    id: uuidv4(),
    projectId: project.id,
    title: 'New Task',
    description: '',
    status: 'Discover',
    kanbanStatus: 'Backlog',
    impact: 'Medium',
    effort: 'Medium',
    moscow: 'Must',
    sprint: `Sprint ${project.currentSprint || 1}`,
    createdAt: new Date().toISOString(),
    stageHistory: [{ stage: 'Backlog', enteredAt: new Date().toISOString() }],
  });

  const isTaskOverdue = (task: Task) => {
    if (!task.expectedCompletionDate) return false;
    const doneColumns = ['Done', 'Completed', 'Finished', 'Archived'];
    if (doneColumns.includes(task.kanbanStatus) || doneColumns.includes(task.status)) return false;
    
    const dueDate = new Date(task.expectedCompletionDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    return dueDate < today;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <ContextualHelp 
        title="Backlog" 
        description="Manage and prioritize all potential work items for your project. Use MoSCoW prioritization to decide what to build next, then move items to the Kanban board for execution."
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
            <LayoutList className="w-8 h-8 text-indigo-500" />
            Backlog
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">Manage and prioritize tasks for {project.name}</p>
        </div>
        <div className="flex items-center gap-3">
          {canEdit && backlogTasks.length > 0 && (
            <button 
              onClick={handleAiPrioritize}
              disabled={isPrioritizing}
              className="bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all border border-indigo-200 dark:border-indigo-800 shadow-sm disabled:opacity-50"
            >
              <Sparkles className={cn("w-4 h-4", isPrioritizing && "animate-pulse")} />
              <span className="hidden sm:inline">{isPrioritizing ? 'Prioritizing...' : 'Prioritize with AI'}</span>
            </button>
          )}
          <button 
            onClick={() => onNavigate('kanban')}
            className="bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all border border-zinc-200 dark:border-zinc-800 shadow-sm"
          >
            <ArrowRight className="w-4 h-4" />
            <span className="hidden sm:inline">Go to Board</span>
          </button>
          {canEdit && (
            <button 
              onClick={() => setIsAddingTask(true)}
              className="bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Add Item</span>
            </button>
          )}
        </div>
      </div>

      {isAddingTask && (
        <TaskModal
          task={createNewTask()}
          project={project}
          currentUser={currentUser}
          users={users}
          isReadOnly={!canEdit}
          onSave={handleSaveTask}
          onClose={() => setIsAddingTask(false)}
          onDelete={() => setIsAddingTask(false)}
          onAddTeamMember={onAddTeamMember}
        />
      )}

      {editingTask && (
        <TaskModal
          task={editingTask}
          project={project}
          currentUser={currentUser}
          users={users}
          isReadOnly={!canEdit}
          onSave={handleSaveTask}
          onClose={() => setEditingTask(null)}
          onDelete={handleDeleteTask}
          onAddTeamMember={onAddTeamMember}
        />
      )}

      <div className="space-y-8">
        {moscowCategories.map(category => {
          const categoryTasks = backlogTasks.filter(t => t.moscow === category.id);
          
          if (categoryTasks.length === 0 && !isAddingTask) return null;

          return (
            <div key={category.id} className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{category.label}</h2>
                <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-bold">
                  {categoryTasks.length}
                </span>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {categoryTasks.map(task => (
                  <div 
                    key={task.id} 
                    className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between group"
                  >
                    <div className="flex-1 flex items-center gap-4">
                      <div className={cn("w-2 h-8 rounded-full", category.color.split(' ')[0])} />
                      <div className="flex-1">
                        <h4 
                          className="font-medium text-zinc-900 dark:text-white cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
                          onClick={() => setEditingTask(task)}
                        >
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          {isTaskOverdue(task) && (
                            <div className="flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-900/20 px-1.5 py-0.5 rounded" title="Overdue">
                              <AlertCircle className="w-3 h-3" />
                              Overdue
                            </div>
                          )}
                          {task.comments && task.comments.length > 0 && (
                            <div className="flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded">
                              <MessageSquare className="w-3 h-3" />
                              {task.comments.length}
                            </div>
                          )}
                          {task.owner && (
                            <div className="flex items-center gap-1.5">
                              {(() => {
                                const member = project.team?.find(m => m.name === task.owner || m.id === task.owner);
                                if (member?.photoUrl) {
                                  return <img src={member.photoUrl} alt={member.name} className="w-4 h-4 rounded-full object-cover border border-zinc-200 dark:border-zinc-700" />;
                                }
                                return (
                                  <div className="w-4 h-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[8px] font-bold text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                                    {task.owner.charAt(0).toUpperCase()}
                                  </div>
                                );
                              })()}
                              <span className={cn(
                                "text-[10px] font-medium",
                                task.owner === currentUser?.name ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-zinc-500 dark:text-zinc-400"
                              )}>
                                {task.owner === currentUser?.name ? 'You' : task.owner}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {canEdit && (
                        <>
                          <select
                            value={task.kanbanStatus}
                            onChange={(e) => handleStatusChange(task.id, e.target.value)}
                            className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-300 px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                          >
                            {kanbanColumns.map(col => (
                              <option key={col.id} value={col.id === col.title ? col.title : col.id}>{col.title}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleMoveToBoard(task.id)}
                            className="p-2 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-zinc-50 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                            title="Move to Board"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-2 text-zinc-400 hover:text-rose-600 bg-zinc-50 dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {categoryTasks.length === 0 && (
                  <div className="p-8 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400 text-sm">
                    No items in this category
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {backlogTasks.length === 0 && !isAddingTask && (
          <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-12 text-center min-h-[500px]">
            <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-full flex items-center justify-center mb-6">
              <LayoutList className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Your backlog is empty</h3>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-md mb-8">
              Start adding user stories, tasks, and bugs to plan your next sprint.
            </p>
            {canEdit && (
              <button 
                onClick={() => setIsAddingTask(true)}
                className="bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Add First Item
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
