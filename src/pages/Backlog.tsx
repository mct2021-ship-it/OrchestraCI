import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Target, Trash2, Edit3, X, CheckCircle2, AlertCircle, Clock, ArrowRight, LayoutList, MessageSquare, Sparkles } from 'lucide-react';
import { Project, Task, User, Sprint } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { EditableText } from '../components/EditableText';
import { cn } from '../lib/utils';
import { ContextualHelp } from '../components/ContextualHelp';
import { TaskModal } from '../components/TaskModal';
import { usePermissions } from '../hooks/usePermissions';
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { stripPIData } from '../lib/piStripper';
import { useToast } from '../context/ToastContext';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface BacklogProps {
  project: Project;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onNavigate: (tab: string, subTab?: string) => void;
  currentUser?: any;
  onDeleteItem?: (item: any, type: any, originalProjectId?: string) => void;
  onAddTeamMember?: (user: User) => void;
  users?: any[];
}

export function Backlog({ project, setProjects, tasks, setTasks, onNavigate, currentUser, onDeleteItem, onAddTeamMember, users = [] }: BacklogProps) {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isPrioritizing, setIsPrioritizing] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [showBulkMove, setShowBulkMove] = useState(false);
  const [bulkTargetColumn, setBulkTargetColumn] = useState<string>('');
  const [bulkTargetSprint, setBulkTargetSprint] = useState<string>('current');
  const { addToast } = useToast();
  
  const { canEditProjectFeature } = usePermissions();
  const canEdit = canEditProjectFeature(project);

  const ensureActiveSprint = () => {
    if (!project.sprints || project.sprints.length === 0) {
      const newSprint: Sprint = {
        id: uuidv4(),
        projectId: project.id,
        number: 1,
        name: 'Sprint 1',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'In Progress'
      };
      setProjects(prev => prev.map(p => 
        p.id === project.id ? { ...p, sprints: [newSprint], currentSprint: 1 } : p
      ));
      addToast('Sprint 1 created and started', 'success');
    }
  };

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
    { id: 'Unassigned', label: 'Unassigned', color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' },
    { id: 'Must', label: 'Must Have', color: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800' },
    { id: 'Should', label: 'Should Have', color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' },
    { id: 'Could', label: 'Could Have', color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' },
    { id: 'Wont', label: 'Won\'t Have', color: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700' }
  ];

  const onDragEnd = (result: DropResult) => {
    if (!canEdit) return;
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newMoscow = destination.droppableId === 'Unassigned' ? undefined : destination.droppableId as Task['moscow'];
    
    setTasks(prev => {
      const newTasks = [...prev];
      const taskIndex = newTasks.findIndex(t => t.id === draggableId);
      if (taskIndex === -1) return prev;
      
      const [movedTask] = newTasks.splice(taskIndex, 1);
      movedTask.moscow = newMoscow;
      
      // Get all tasks in the destination category (excluding the moved task)
      // We only care about backlog tasks for this ordering
      const destCategoryTasks = newTasks.filter(t => {
        const isBacklog = !t.kanbanStatus || t.kanbanStatus === 'Backlog' || t.kanbanStatus === 'backlog' || (backlogColumn && t.kanbanStatus === backlogColumn.id) || (backlogColumn && t.kanbanStatus === backlogColumn.title);
        if (!isBacklog) return false;
        
        return destination.droppableId === 'Unassigned' 
          ? !t.moscow
          : t.moscow === destination.droppableId;
      });
      
      destCategoryTasks.splice(destination.index, 0, movedTask);
      
      // Now replace the tasks in the destination category with the new order
      const otherTasks = newTasks.filter(t => {
        const isBacklog = !t.kanbanStatus || t.kanbanStatus === 'Backlog' || t.kanbanStatus === 'backlog' || (backlogColumn && t.kanbanStatus === backlogColumn.id) || (backlogColumn && t.kanbanStatus === backlogColumn.title);
        if (!isBacklog) return true; // Keep non-backlog tasks
        
        return destination.droppableId === 'Unassigned' 
          ? !!t.moscow
          : t.moscow !== destination.droppableId;
      });
      
      return [...otherTasks, ...destCategoryTasks];
    });
  };

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
    ensureActiveSprint();
    setTasks(tasks.map(t => t.id === taskId ? { ...t, kanbanStatus: firstActiveColumnId } : t));
  };

  const handleStatusChange = (taskId: string, newStatus: string) => {
    if (newStatus !== 'Backlog' && newStatus !== 'backlog') {
      ensureActiveSprint();
    }
    setTasks(tasks.map(t => t.id === taskId ? { ...t, kanbanStatus: newStatus } : t));
  };

  const handleToggleSelect = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const handleBulkMove = () => {
    if (!bulkTargetColumn) return;
    
    if (bulkTargetColumn !== 'Backlog' && bulkTargetColumn !== 'backlog') {
      ensureActiveSprint();
    }
    
    setTasks(tasks.map(t => {
      if (selectedTasks.includes(t.id)) {
        return { 
          ...t, 
          kanbanStatus: bulkTargetColumn,
          sprint: bulkTargetSprint === 'current' ? `Sprint ${project.currentSprint || 1}` : bulkTargetSprint
        };
      }
      return t;
    }));
    
    setSelectedTasks([]);
    setShowBulkMove(false);
    addToast(`${selectedTasks.length} tasks moved successfully`, 'success');
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
        Project: ${stripPIData(project.name)}
        Description: ${stripPIData(project.description)}
        
        Tasks:
        ${backlogTasks.map(t => `- ID: ${t.id}, Title: ${stripPIData(t.title)}, Description: ${stripPIData(t.description || '')}`).join('\n')}
        
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
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
              <LayoutList className="w-8 h-8 text-indigo-500" />
              Backlog
            </h1>
            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium border border-indigo-200 dark:border-indigo-500/30">
              {project.name}
            </span>
          </div>
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

      <AnimatePresence>
        {selectedTasks.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-4 flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-4">
              <span className="font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/40 px-3 py-1 rounded-lg">
                {selectedTasks.length} selected
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={bulkTargetSprint}
                  onChange={(e) => setBulkTargetSprint(e.target.value)}
                  className="bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-700 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="current">Current Sprint</option>
                  <option value={`Sprint ${(project.currentSprint || 1) + 1}`}>Next Sprint (Sprint {(project.currentSprint || 1) + 1})</option>
                  <option value={`Sprint ${(project.currentSprint || 1) + 2}`}>Future Sprint (Sprint {(project.currentSprint || 1) + 2})</option>
                </select>
                <select
                  value={bulkTargetColumn}
                  onChange={(e) => setBulkTargetColumn(e.target.value)}
                  className="bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-700 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="" disabled>Select Column...</option>
                  {kanbanColumns.filter(c => c.id !== 'Backlog' && c.title !== 'Backlog').map(col => (
                    <option key={col.id} value={col.id === col.title ? col.title : col.id}>{col.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedTasks([])}
                className="px-4 py-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkMove}
                disabled={!bulkTargetColumn}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
              >
                <ArrowRight className="w-4 h-4" />
                Move Tasks
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isAddingTask && (
        <TaskModal
          task={createNewTask()}
          project={project}
          currentUser={currentUser}
          users={users}
          isReadOnly={!canEdit}
          onSave={handleSaveTask}
          onUpdate={(updatedTask) => setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t))}
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
          onUpdate={(updatedTask) => setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t))}
          onClose={() => setEditingTask(null)}
          onDelete={handleDeleteTask}
          onAddTeamMember={onAddTeamMember}
        />
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-4 min-h-[600px]">
          {moscowCategories.map(category => {
            const categoryTasks = backlogTasks.filter(t => 
              category.id === 'Unassigned' 
                ? !t.moscow
                : t.moscow === category.id
            );
            
            return (
              <div key={category.id} className="flex flex-col min-w-[320px] max-w-[320px] bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-3 h-3 rounded-full", category.color.split(' ')[0])} />
                    <h2 className="text-sm font-bold text-zinc-900 dark:text-white">{category.label}</h2>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-bold shadow-sm">
                    {categoryTasks.length}
                  </span>
                </div>
                
                <Droppable droppableId={category.id}>
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "flex-1 p-3 space-y-3 min-h-[150px] transition-colors",
                        snapshot.isDraggingOver ? "bg-indigo-50/50 dark:bg-indigo-900/10" : ""
                      )}
                    >
                      {categoryTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index} isDragDisabled={!canEdit}>
                          {(provided, snapshot) => (
                            <div 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                "bg-white dark:bg-zinc-900 p-4 rounded-xl border shadow-sm group",
                                snapshot.isDragging 
                                  ? "border-indigo-500 shadow-lg shadow-indigo-500/20 rotate-2 scale-105 z-50" 
                                  : "border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                              )}
                            >
                              <div className="flex-1">
                                <div className="flex items-start gap-3 mb-2">
                                  {canEdit && (
                                    <input
                                      type="checkbox"
                                      checked={selectedTasks.includes(task.id)}
                                      onChange={() => handleToggleSelect(task.id)}
                                      className="mt-1 w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:checked:bg-indigo-500 cursor-pointer"
                                    />
                                  )}
                                  <h4 
                                    className="font-medium text-sm text-zinc-900 dark:text-white cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
                                    onClick={() => setEditingTask(task)}
                                  >
                                    {task.title}
                                  </h4>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
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
                                    <div className="flex items-center gap-1.5 ml-auto">
                                      {(() => {
                                        const member = project.team?.find(m => m.name === task.owner || m.id === task.owner);
                                        if (member?.photoUrl) {
                                          return <img src={member.photoUrl} alt={member.name} className="w-5 h-5 rounded-full object-cover border border-zinc-200 dark:border-zinc-700" />;
                                        }
                                        return (
                                          <div className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                                            {task.owner.charAt(0).toUpperCase()}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity">
                                {canEdit && (
                                  <>
                                    <select
                                      value={task.kanbanStatus}
                                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                      className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[10px] font-medium text-zinc-600 dark:text-zinc-300 px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer flex-1"
                                    >
                                      {kanbanColumns.map(col => (
                                        <option key={col.id} value={col.id === col.title ? col.title : col.id}>{col.title}</option>
                                      ))}
                                    </select>
                                    <button
                                      onClick={() => handleMoveToBoard(task.id)}
                                      className="p-1.5 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-zinc-50 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                      title="Move to Board"
                                    >
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTask(task.id)}
                                      className="p-1.5 text-zinc-400 hover:text-rose-600 bg-zinc-50 dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                                      title="Delete Item"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {categoryTasks.length === 0 && !snapshot.isDraggingOver && (
                        <div className="p-4 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400 text-xs">
                          Drop items here
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
