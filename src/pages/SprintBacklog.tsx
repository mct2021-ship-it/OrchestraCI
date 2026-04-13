import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  ChevronRight, 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Users,
  Target,
  ArrowRight,
  Download,
  MoreVertical,
  LayoutList,
  Sparkles,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Trash2,
  Edit3,
  User as UserIcon
} from 'lucide-react';
import { Project, Sprint, Task, User } from '../types';
import { cn, formatDate } from '../lib/utils';
import { getGeminiClient, ensureApiKey } from '../lib/gemini';
import { stripPIData } from '../lib/piStripper';
import { v4 as uuidv4 } from 'uuid';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { TaskModal } from '../components/TaskModal';
import { useToast } from '../context/ToastContext';
import { ThinkingLevel } from "@google/genai";

interface SprintBacklogProps {
  projects: Project[];
  tasks: Task[];
  users: User[];
  sprints: Sprint[];
  setSprints: React.Dispatch<React.SetStateAction<Sprint[]>>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  activeProjectId?: string | null;
  currentUser?: any;
  onDeleteItem?: (item: any, type: any, originalProjectId?: string) => void;
  onAddTeamMember?: (user: User, projectId?: string) => void;
  onNavigate: (tab: string, subTab?: string) => void;
}

export function SprintBacklog({ 
  projects, 
  tasks, 
  users, 
  sprints, 
  setSprints, 
  setTasks, 
  activeProjectId,
  currentUser,
  onDeleteItem,
  onAddTeamMember,
  onNavigate
}: SprintBacklogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'In Progress' | 'Done' | 'Not Started'>('All');
  const [projectFilter, setProjectFilter] = useState<string>(activeProjectId || 'All');
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isBacklogCollapsed, setIsBacklogCollapsed] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isPrioritizing, setIsPrioritizing] = useState(false);
  const { addToast } = useToast();

  const [isAddingSprint, setIsAddingSprint] = useState(false);
  const [newSprintData, setNewSprintData] = useState<Partial<Sprint>>({
    name: '',
    goal: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Not Started',
    stage: 'Discover',
    tasks: []
  });

  const activeProject = useMemo(() => projects.find(p => p.id === (projectFilter === 'All' ? activeProjectId : projectFilter)), [projects, activeProjectId, projectFilter]);

  const backlogTasks = useMemo(() => {
    return tasks.filter(t => 
      t.projectId === activeProject?.id && 
      (!t.sprint || t.sprint === '') &&
      (t.kanbanStatus === 'Backlog' || t.kanbanStatus === 'backlog' || !t.kanbanStatus)
    );
  }, [tasks, activeProject]);

  const filteredSprints = useMemo(() => {
    return sprints.filter(sprint => {
      const matchesSearch = sprint.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           sprint.goal?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || sprint.status === statusFilter;
      const matchesProject = projectFilter === 'All' || sprint.projectId === projectFilter;
      return matchesSearch && matchesStatus && matchesProject;
    });
  }, [sprints, searchQuery, statusFilter, projectFilter]);

  const handleAddSprint = (e?: React.FormEvent, initialTasks: string[] = []) => {
    if (e) e.preventDefault();
    const projectId = newSprintData.projectId || (projectFilter !== 'All' ? projectFilter : (activeProjectId || projects[0]?.id));
    
    if (!newSprintData.name || !projectId) {
      addToast('Missing required sprint data', 'error');
      return;
    }

    const newSprint: Sprint = {
      id: uuidv4(),
      projectId: projectId,
      number: sprints.filter(s => s.projectId === projectId).length + 1,
      name: newSprintData.name,
      goal: newSprintData.goal,
      startDate: newSprintData.startDate!,
      endDate: newSprintData.endDate!,
      status: newSprintData.status as any,
      stage: newSprintData.stage as any,
      tasks: initialTasks
    };

    setSprints(prev => [...prev, newSprint]);
    
    if (initialTasks.length > 0) {
      setTasks(prev => prev.map(t => initialTasks.includes(t.id) ? { ...t, sprint: newSprint.id, kanbanStatus: 'In Progress' } : t));
    }

    setIsAddingSprint(false);
    setNewSprintData({
      name: '',
      goal: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Not Started',
      stage: 'Discover',
      tasks: []
    });
    addToast(`Sprint "${newSprint.name}" created`, 'success');
    return newSprint.id;
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Dragging from Backlog to a Sprint
    if (source.droppableId === 'backlog' && destination.droppableId.startsWith('sprint-')) {
      const sprintId = destination.droppableId.replace('sprint-', '');
      handleAddTaskToSprint(sprintId, draggableId);
    }

    // Dragging from Backlog to New Sprint box
    if (source.droppableId === 'backlog' && destination.droppableId === 'new-sprint') {
      const sprintName = `Sprint ${(sprints.filter(s => s.projectId === activeProject?.id).length || 0) + 1}`;
      setNewSprintData(prev => ({ ...prev, name: sprintName, projectId: activeProject?.id || undefined }));
      handleAddSprint(undefined, [draggableId]);
    }
  };

  const handleAddTaskToSprint = (sprintId: string, taskId: string) => {
    setSprints(prev => prev.map(s => {
      if (s.id === sprintId) {
        const sprintTasks = s.tasks || [];
        if (!sprintTasks.includes(taskId)) {
          return { ...s, tasks: [...sprintTasks, taskId] };
        }
      }
      return s;
    }));

    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, sprint: sprintId, kanbanStatus: 'In Progress' };
      }
      return t;
    }));
    addToast('Task moved to sprint', 'success');
  };

  const handleRemoveTaskFromSprint = (sprintId: string, taskId: string) => {
    setSprints(prev => prev.map(s => {
      if (s.id === sprintId) {
        return { ...s, tasks: (s.tasks || []).filter(id => id !== taskId) };
      }
      return s;
    }));

    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, sprint: undefined, kanbanStatus: 'Backlog' };
      }
      return t;
    }));
  };

  const handleBulkUpdate = (updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => selectedTasks.includes(t.id) ? { ...t, ...updates } : t));
    setSelectedTasks([]);
    addToast(`Updated ${selectedTasks.length} tasks`, 'success');
  };

  const handleAiPrioritize = async () => {
    if (backlogTasks.length === 0 || isPrioritizing) return;
    
    setIsPrioritizing(true);
    addToast('Analyzing backlog for prioritization...', 'info');

    try {
      await ensureApiKey();
      const ai = await getGeminiClient();
      if (!ai) throw new Error('AI client not initialized');

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Prioritize the following project tasks using the MoSCoW method (Must, Should, Could, Wont).
        Project: ${stripPIData(activeProject?.name || '')}
        Description: ${stripPIData(activeProject?.description || '')}
        
        Tasks:
        ${backlogTasks.map(t => `- ID: ${t.id}, Title: ${stripPIData(t.title)}, Description: ${stripPIData(t.description || '')}`).join('\n')}
        
        Format the output as a JSON object where keys are task IDs and values are the suggested MoSCoW priority (Must, Should, Could, or Wont).`,
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text || '{}';
      const priorities = JSON.parse(text);
      setTasks(prev => prev.map(t => priorities[t.id] ? { ...t, moscow: priorities[t.id] } : t));
      addToast('Backlog prioritized with AI', 'success');
    } catch (error) {
      console.error('Error prioritizing backlog:', error);
      addToast('Failed to prioritize backlog', 'error');
    } finally {
      setIsPrioritizing(false);
    }
  };

  const handleAddTask = () => {
    if (!activeProject) {
      addToast('Please select a project first', 'info');
      return;
    }
    const newTask: Task = {
      id: `t${Date.now()}`,
      projectId: activeProject.id,
      title: 'New Task',
      description: '',
      status: 'Discover',
      kanbanStatus: 'Backlog',
      impact: 'Medium',
      effort: 'Medium',
      owner: '',
      createdAt: new Date().toISOString(),
      stageHistory: [{ stage: 'Backlog', enteredAt: new Date().toISOString() }],
    };
    setTasks(prev => [...prev, newTask]);
    setEditingTask(newTask);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    setEditingTask(null);
    addToast('Task updated successfully');
  };

  const getProjectName = (projectId: string) => projects.find(p => p.id === projectId)?.name || 'Unknown Project';

  const getSprintTasks = (sprintId: string) => {
    const sprint = sprints.find(s => s.id === sprintId);
    if (!sprint || !sprint.tasks) return [];
    return tasks.filter(t => sprint.tasks?.includes(t.id));
  };

  const handleGenerateReport = async (sprint: Sprint) => {
    setIsGeneratingReport(true);
    try {
      const hasKey = await ensureApiKey();
      if (!hasKey) return;

      const sprintTasks = getSprintTasks(sprint.id);
      const project = projects.find(p => p.id === sprint.projectId);
      const ai = await getGeminiClient();
      if (!ai) return;
      
      const prompt = `Generate a comprehensive report for Sprint "${stripPIData(sprint.name)}" of project "${stripPIData(project?.name || '')}".
      Status: ${sprint.status}
      Goal: ${stripPIData(sprint.goal || 'N/A')}
      Tasks: ${sprintTasks.map(t => `- ${stripPIData(t.title)} (${t.kanbanStatus})`).join('\n')}`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      const report = result.text || 'Failed to generate report.';
      setSprints(prev => prev.map(s => s.id === sprint.id ? { ...s, report } : s));
      setSelectedSprint({ ...sprint, report });
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-[#09090b] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <LayoutList className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest">Delivery Management</span>
            </div>
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">
                Backlog & Sprints
              </h1>
              {activeProject && (
                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium border border-indigo-200 dark:border-indigo-500/30">
                  {activeProject.name}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full sm:w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-auto"
            >
              <option value="All">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          {/* Backlog Section */}
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            <div 
              className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              onClick={() => setIsBacklogCollapsed(!isBacklogCollapsed)}
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <LayoutList className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Project Backlog</h2>
                  <p className="text-xs text-zinc-500">{backlogTasks.length} items waiting for delivery</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {selectedTasks.length > 0 && (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                    <select 
                      onChange={(e) => handleBulkUpdate({ kanbanStatus: e.target.value })}
                      className="text-xs font-bold bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg px-3 py-1.5 outline-none"
                    >
                      <option value="">Set Status...</option>
                      <option value="Backlog">Backlog</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Review/Test">Review/Test</option>
                      <option value="Done">Done</option>
                    </select>
                    <select 
                      onChange={(e) => handleBulkUpdate({ moscow: e.target.value as any })}
                      className="text-xs font-bold bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg px-3 py-1.5 outline-none"
                    >
                      <option value="">Set MoSCoW...</option>
                      <option value="Must">Must Have</option>
                      <option value="Should">Should Have</option>
                      <option value="Could">Could Have</option>
                      <option value="Wont">Won't Have</option>
                    </select>
                    <select 
                      onChange={(e) => handleBulkUpdate({ owner: e.target.value })}
                      className="text-xs font-bold bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg px-3 py-1.5 outline-none"
                    >
                      <option value="">Set Owner...</option>
                      {users.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                    </select>
                  </div>
                )}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddTask();
                  }}
                  className="p-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-all flex items-center gap-2 px-4"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-xs font-bold">New Task</span>
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAiPrioritize();
                  }}
                  disabled={isPrioritizing}
                  className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 transition-all disabled:opacity-50"
                  title="AI Prioritize"
                >
                  <Sparkles className={cn("w-4 h-4", isPrioritizing && "animate-spin")} />
                </button>
                {isBacklogCollapsed ? <ChevronDown className="w-5 h-5 text-zinc-400" /> : <ChevronUp className="w-5 h-5 text-zinc-400" />}
              </div>
            </div>

            <AnimatePresence initial={false}>
              {!isBacklogCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <Droppable droppableId="backlog">
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          "p-6 space-y-2 min-h-[100px] transition-colors",
                          snapshot.isDraggingOver ? "bg-indigo-50/30 dark:bg-indigo-900/10" : ""
                        )}
                      >
                        {backlogTasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={cn(
                                  "group flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl hover:border-indigo-500/30 transition-all",
                                  snapshot.isDragging ? "shadow-xl border-indigo-500 bg-white dark:bg-zinc-800 z-50" : ""
                                )}
                              >
                                <div {...provided.dragHandleProps} className="text-zinc-300 group-hover:text-zinc-500 cursor-grab active:cursor-grabbing">
                                  <GripVertical className="w-4 h-4" />
                                </div>
                                <input 
                                  type="checkbox"
                                  checked={selectedTasks.includes(task.id)}
                                  onChange={() => setSelectedTasks(prev => prev.includes(task.id) ? prev.filter(id => id !== task.id) : [...prev, task.id])}
                                  className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <div className="flex-1 min-w-0" onClick={() => setEditingTask(task)}>
                                  <div className="flex items-center gap-3">
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white truncate cursor-pointer hover:text-indigo-600">
                                      {task.title}
                                    </h3>
                                    {task.moscow && (
                                      <span className={cn(
                                        "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                                        task.moscow === 'Must' ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" :
                                        task.moscow === 'Should' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                        "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                                      )}>
                                        {task.moscow}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-zinc-500 truncate">{task.description || 'No description'}</p>
                                </div>
                                <div className="flex items-center gap-4 shrink-0">
                                  {task.owner && (
                                    <div className="flex items-center gap-2 px-2 py-1 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                      <UserIcon className="w-3 h-3 text-zinc-400" />
                                      <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400">{task.owner}</span>
                                    </div>
                                  )}
                                  <button 
                                    onClick={() => setEditingTask(task)}
                                    className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {backlogTasks.length === 0 && (
                          <div className="py-12 text-center">
                            <LayoutList className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                            <p className="text-sm text-zinc-500">Backlog is empty. Add some tasks to get started!</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sprints Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Active Sprints</h2>
              <div className="flex bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1">
                {(['All', 'In Progress', 'Done', 'Not Started'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                      statusFilter === status 
                        ? "bg-indigo-600 text-white shadow-md" 
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSprints.map((sprint) => (
                <Droppable key={sprint.id} droppableId={`sprint-${sprint.id}`}>
                  {(provided, snapshot) => (
                    <motion.div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      layout
                      className={cn(
                        "group bg-white dark:bg-zinc-900 rounded-3xl border p-6 transition-all cursor-pointer",
                        snapshot.isDraggingOver ? "border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/10 shadow-lg" : "border-zinc-200 dark:border-zinc-800 hover:shadow-xl hover:shadow-indigo-500/5"
                      )}
                      onClick={() => setSelectedSprint(sprint)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                            sprint.status === 'In Progress' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                            sprint.status === 'Done' ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" :
                            "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                          )}>
                            {sprint.status}
                          </div>
                        </div>
                        <button className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-1 mb-4">
                        <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                          {getProjectName(sprint.projectId)}
                        </p>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                          {sprint.name}
                        </h3>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 mb-6">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5" />
                          <span>{sprint.tasks?.length || 0} Tasks</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <div className="flex -space-x-2">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="w-7 h-7 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                              U
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          View Details
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                      {provided.placeholder}
                    </motion.div>
                  )}
                </Droppable>
              ))}

              {/* New Sprint Droppable Area */}
              <Droppable droppableId="new-sprint">
                {(provided, snapshot) => (
                  <button 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    onClick={() => {
                      setIsAddingSprint(true);
                      setNewSprintData(prev => ({ ...prev, projectId: activeProject?.id || projects[0]?.id }));
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center gap-4 p-8 rounded-3xl border-2 border-dashed transition-all group text-left min-h-[200px]",
                      snapshot.isDraggingOver 
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 scale-105 shadow-xl shadow-indigo-500/10" 
                        : "border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10"
                    )}
                  >
                    <div className={cn(
                      "p-4 rounded-2xl transition-all",
                      snapshot.isDraggingOver ? "bg-indigo-600 text-white" : "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                    )}>
                      <Plus className="w-8 h-8" />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-zinc-900 dark:text-white">
                        {snapshot.isDraggingOver ? "Drop to Create Sprint" : "New Sprint"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {snapshot.isDraggingOver ? "This task will be added to the new sprint" : "Plan your next delivery cycle"}
                      </p>
                    </div>
                    {provided.placeholder}
                  </button>
                )}
              </Droppable>
            </div>
          </div>
        </DragDropContext>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isAddingSprint && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-zinc-200 dark:border-zinc-800"
            >
              <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-600 text-white rounded-2xl">
                    <Plus className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">New Sprint</h2>
                    <p className="text-xs text-zinc-500">Define your next delivery cycle</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAddingSprint(false)}
                  className="p-3 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-all"
                >
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <form onSubmit={handleAddSprint} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Project</label>
                    <select
                      required
                      value={newSprintData.projectId}
                      onChange={(e) => setNewSprintData({ ...newSprintData, projectId: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Sprint Name</label>
                    <input
                      required
                      type="text"
                      value={newSprintData.name}
                      onChange={(e) => setNewSprintData({ ...newSprintData, name: e.target.value })}
                      placeholder="e.g. Sprint 1: Discovery Phase"
                      className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Sprint Goal</label>
                    <textarea
                      value={newSprintData.goal}
                      onChange={(e) => setNewSprintData({ ...newSprintData, goal: e.target.value })}
                      placeholder="What do we want to achieve in this sprint?"
                      className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Start Date</label>
                    <input
                      required
                      type="date"
                      value={newSprintData.startDate}
                      onChange={(e) => setNewSprintData({ ...newSprintData, startDate: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">End Date</label>
                    <input
                      required
                      type="date"
                      value={newSprintData.endDate}
                      onChange={(e) => setNewSprintData({ ...newSprintData, endDate: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-6 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsAddingSprint(false)}
                    className="flex-1 px-8 py-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm font-bold text-zinc-500 hover:bg-zinc-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-bold shadow-xl hover:bg-indigo-700 transition-all"
                  >
                    Create Sprint
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {selectedSprint && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                    {getProjectName(selectedSprint.projectId)}
                  </p>
                  <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                    {selectedSprint.name}
                  </h2>
                </div>
              </div>
              <button 
                onClick={() => setSelectedSprint(null)}
                className="p-3 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-all"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl p-6 border border-zinc-100 dark:border-zinc-800">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Sprint Goal</h4>
                    <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      {selectedSprint.goal || 'No goal defined for this sprint.'}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Sprint Backlog</h4>
                    <div className="space-y-3">
                      {getSprintTasks(selectedSprint.id).map(task => (
                        <div key={task.id} className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl group">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              task.kanbanStatus === 'Done' ? "bg-emerald-500" : "bg-amber-500"
                            )} />
                            <p className="text-sm font-bold text-zinc-900 dark:text-white">{task.title}</p>
                          </div>
                          <button 
                            onClick={() => handleRemoveTaskFromSprint(selectedSprint.id, task.id)}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Plus className="w-4 h-4 rotate-45" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden">
                    <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Sprint Report</h4>
                      {!selectedSprint.report && (
                        <button 
                          onClick={() => handleGenerateReport(selectedSprint)}
                          disabled={isGeneratingReport}
                          className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all disabled:opacity-50"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="p-6 max-h-[400px] overflow-y-auto">
                      {isGeneratingReport ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                          <p className="text-xs font-bold text-zinc-500 animate-pulse">AI is analyzing sprint data...</p>
                        </div>
                      ) : selectedSprint.report ? (
                        <div className="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
                          {selectedSprint.report}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <FileText className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                          <p className="text-sm text-zinc-500">No report generated yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {editingTask && (
        <TaskModal
          task={editingTask}
          project={projects.find(p => p.id === editingTask.projectId)!}
          sprints={sprints}
          currentUser={currentUser}
          users={users}
          onSave={handleUpdateTask}
          onUpdate={handleUpdateTask}
          onClose={() => setEditingTask(null)}
          onDelete={(taskId) => {
            const task = tasks.find(t => t.id === taskId);
            if (task) onDeleteItem?.(task, 'Task');
            setTasks(prev => prev.filter(t => t.id !== taskId));
            setEditingTask(null);
          }}
          onAddTeamMember={onAddTeamMember}
        />
      )}
    </div>
  );
}
