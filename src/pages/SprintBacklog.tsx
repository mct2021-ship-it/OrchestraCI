import React, { useState, useMemo, useRef } from 'react';
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
  LayoutGrid,
  Sparkles,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Trash2,
  Edit3,
  X,
  User as UserIcon,
  Image as ImageIcon
} from 'lucide-react';
import { Project, Sprint, Task, User } from '../types';
import { CompanyProfile } from '../components/YourCompany';
import { cn, formatDate, fixOklch } from '../lib/utils';
import { getGeminiClient, ensureApiKey } from '../lib/gemini';
import { stripPIData } from '../lib/piStripper';
import { v4 as uuidv4 } from 'uuid';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { TaskModal } from '../components/TaskModal';
import { useToast } from '../context/ToastContext';
import { ThinkingLevel } from "@google/genai";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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
  companyProfile?: CompanyProfile;
}

const moscowCategories = [
  { id: 'Must', label: 'Must Have', description: 'Critical to the current delivery time box to be a success.' },
  { id: 'Should', label: 'Should Have', description: 'Important but not vital. May be painful to leave out.' },
  { id: 'Could', label: 'Could Have', description: 'Desirable but not necessary. "Nice to have".' },
  { id: 'Wont', label: 'Won\'t Have', description: 'Agreed as out of scope for this particular time box.' },
  { id: 'Unassigned', label: 'Unassigned', description: 'Items yet to be prioritized using MoSCoW.' }
];

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
  onNavigate,
  companyProfile
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
  const [isPrioritizeModalOpen, setIsPrioritizeModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
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

  const handleAddSprint = (e?: React.FormEvent, initialTasks: string[] = [], overrideData?: Partial<Sprint>) => {
    if (e) e.preventDefault();
    const data = { ...newSprintData, ...overrideData };
    const projectId = data.projectId || (projectFilter !== 'All' ? projectFilter : (activeProjectId || projects[0]?.id));
    
    if (!data.name || !projectId) {
      addToast('Missing required sprint data', 'error');
      return;
    }

    const newSprint: Sprint = {
      id: uuidv4(),
      projectId: projectId,
      number: sprints.filter(s => s.projectId === projectId).length + 1,
      name: data.name!,
      goal: data.goal,
      startDate: data.startDate!,
      endDate: data.endDate!,
      status: data.status as any,
      stage: data.stage as any,
      tasks: initialTasks
    };

    setSprints(prev => [...prev, newSprint]);
    
    if (initialTasks.length > 0) {
      setTasks(prev => prev.map(t => initialTasks.includes(t.id) ? { ...t, sprint: newSprint.id, kanbanStatus: 'In Progress' } : t));
      // If we are adding tasks to a new sprint, it should probably start
      if (data.status === 'Not Started') {
        newSprint.status = 'In Progress';
      }
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
      const projectId = activeProject?.id || projects[0]?.id;
      handleAddSprint(undefined, [draggableId], { name: sprintName, projectId });
    }

    // MoSCoW Prioritization
    const moscowValues = ['Must', 'Should', 'Could', 'Wont', 'Unassigned'];
    if (moscowValues.includes(destination.droppableId)) {
      const newMoscow = destination.droppableId === 'Unassigned' ? undefined : destination.droppableId;
      setTasks(prev => prev.map(t => 
        t.id === draggableId ? { ...t, moscow: newMoscow as any } : t
      ));
      addToast(`Task prioritized as ${destination.droppableId}`, 'success');
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
        return { ...t, sprint: sprintId, kanbanStatus: 'Not Started' };
      }
      return t;
    }));

    // Auto-start sprint if Not Started
    setSprints(prev => prev.map(s => {
      if (s.id === sprintId && s.status === 'Not Started') {
        return { ...s, status: 'In Progress' };
      }
      return s;
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

  const handleExportReportImage = async () => {
    if (!reportRef.current || isExporting) return;
    
    setIsExporting(true);
    try {
      addToast('Generating image...', 'info');
      const canvas = await html2canvas(reportRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#18181b' : '#ffffff',
        onclone: (clonedDoc) => {
          fixOklch(clonedDoc);
        }
      });
      
      const link = document.createElement('a');
      link.download = `Sprint_Report_${selectedSprint?.name.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      addToast('Image exported successfully', 'success');
    } catch (error) {
      console.error('Error generating image:', error);
      addToast('Failed to export image', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportReportPDF = async () => {
    if (!reportRef.current || isExporting) return;

    setIsExporting(true);
    try {
      addToast('Generating PDF...', 'info');
      const canvas = await html2canvas(reportRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#18181b' : '#ffffff',
        onclone: (clonedDoc) => {
          fixOklch(clonedDoc);
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = canvas.width / 2;
      const imgHeight = canvas.height / 2;
      
      const pdf = new jsPDF({
        orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
        unit: 'px',
        format: [imgWidth, imgHeight]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Sprint_Report_${selectedSprint?.name.replace(/\s+/g, '_')}.pdf`);
      addToast('PDF exported successfully', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      addToast('Failed to export PDF', 'error');
    } finally {
      setIsExporting(false);
    }
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
    <DragDropContext onDragEnd={onDragEnd}>
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
                    setIsPrioritizeModalOpen(true);
                  }}
                  className="p-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all flex items-center gap-2 px-4 shadow-sm"
                >
                  <LayoutGrid className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-bold font-sans italic uppercase tracking-tight">Prioritize Backlog</span>
                </button>
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
                  <div className="flex flex-wrap items-center gap-4 bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Status</label>
                      <div className="flex bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-1">
                        {(['Not Started', 'In Progress', 'Done'] as const).map((status) => (
                          <button
                            key={status}
                            onClick={() => {
                              setSprints(prev => prev.map(s => s.id === selectedSprint.id ? { ...s, status } : s));
                              setSelectedSprint(prev => prev ? { ...prev, status } : null);
                            }}
                            className={cn(
                              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                              selectedSprint.status === status 
                                ? status === 'In Progress' ? "bg-emerald-600 text-white" :
                                  status === 'Done' ? "bg-indigo-600 text-white" :
                                  "bg-zinc-600 text-white"
                                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                            )}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl p-6 border border-zinc-100 dark:border-zinc-800">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Sprint Goal</h4>
                    <textarea
                      value={selectedSprint.goal || ''}
                      onChange={(e) => {
                        const newGoal = e.target.value;
                        setSprints(prev => prev.map(s => s.id === selectedSprint.id ? { ...s, goal: newGoal } : s));
                        setSelectedSprint(prev => prev ? { ...prev, goal: newGoal } : null);
                      }}
                      placeholder="What do we want to achieve in this sprint?"
                      className="w-full bg-transparent border-none outline-none text-zinc-700 dark:text-zinc-300 leading-relaxed resize-none min-h-[100px] focus:ring-0 p-0"
                    />
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
                    <div ref={reportRef} className="p-6 max-h-[600px] overflow-y-auto">
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
                          <button 
                            onClick={() => handleGenerateReport(selectedSprint)}
                            className="mt-4 text-xs font-bold text-indigo-600 hover:underline"
                          >
                            Generate AI Report
                          </button>
                        </div>
                      )}
                    </div>
                    {selectedSprint.report && (
                      <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
                        <button 
                          onClick={handleExportReportImage}
                          disabled={isExporting}
                          className="flex-1 flex items-center justify-center gap-2 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 transition-all disabled:opacity-50"
                        >
                          <ImageIcon className="w-4 h-4" />
                          PNG
                        </button>
                        <button 
                          onClick={handleExportReportPDF}
                          disabled={isExporting}
                          className="flex-1 flex items-center justify-center gap-2 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 transition-all disabled:opacity-50"
                        >
                          <Download className="w-4 h-4" />
                          PDF
                        </button>
                      </div>
                    )}
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
          companyProfile={companyProfile}
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

      {/* MoSCoW Prioritization Modal */}
      <AnimatePresence>
        {isPrioritizeModalOpen && (
          <div className="fixed inset-0 bg-zinc-950/90 backdrop-blur-md z-[100] flex flex-col p-4 md:p-10 overflow-hidden">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl flex flex-col h-full border border-zinc-200 dark:border-zinc-800 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-10 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-500/40 transform -rotate-2">
                    <LayoutGrid className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-black text-zinc-900 dark:text-white uppercase italic tracking-tighter leading-none">Prioritize Backlog</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg mt-1 tracking-tight">Define project scope using MoSCoW buckets.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsPrioritizeModalOpen(false)}
                  className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all shadow-lg hover:rotate-90"
                >
                  <X className="w-8 h-8" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                  {moscowCategories.map(category => {
                    const categoryTasks = backlogTasks.filter(t => 
                      category.id === 'Unassigned' 
                        ? !t.moscow
                        : t.moscow === category.id
                    );
                    
                    return (
                      <div key={category.id} className="flex flex-col h-full min-h-[500px] bg-zinc-50 dark:bg-zinc-900/30 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-inner">
                        <div className={cn(
                          "p-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-col gap-1 rounded-t-[2rem]",
                          category.id === 'Must' ? "bg-rose-500/10" :
                          category.id === 'Should' ? "bg-amber-500/10" :
                          category.id === 'Could' ? "bg-emerald-500/10" :
                          "bg-white dark:bg-zinc-900"
                        )}>
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black uppercase italic tracking-wider text-zinc-900 dark:text-white">{category.label}</h3>
                            <span className="px-3 py-1.5 bg-white dark:bg-zinc-800 rounded-xl text-xs font-black shadow-lg text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700">
                              {categoryTasks.length}
                            </span>
                          </div>
                          <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest leading-none mt-1">{category.description}</p>
                        </div>
                        
                        <Droppable droppableId={category.id}>
                          {(provided, snapshot) => (
                            <div 
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={cn(
                                "flex-1 p-6 space-y-4 overflow-y-auto min-h-[400px] transition-colors custom-scrollbar",
                                snapshot.isDraggingOver ? "bg-indigo-50/50 dark:bg-indigo-900/10" : ""
                              )}
                            >
                              {categoryTasks.map((task, index) => (
                                <Draggable key={task.id} draggableId={task.id} index={index}>
                                  {(provided, snapshot) => (
                                    <div 
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={cn(
                                        "bg-white dark:bg-zinc-900 p-6 rounded-2xl border shadow-sm group transition-all",
                                        snapshot.isDragging 
                                          ? "border-indigo-500 shadow-2xl shadow-indigo-500/30 rotate-2 scale-105 z-[150]" 
                                          : "border-zinc-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:translate-y-[-4px] hover:shadow-xl"
                                      )}
                                    >
                                      <div className="flex items-center gap-3 mb-3">
                                        <div className={cn(
                                          "w-2 h-8 rounded-full shadow-sm",
                                          category.id === 'Must' ? "bg-rose-500" :
                                          category.id === 'Should' ? "bg-amber-500" :
                                          category.id === 'Could' ? "bg-emerald-500" :
                                          "bg-zinc-300"
                                        )} />
                                        <h4 className="font-black text-lg text-zinc-900 dark:text-white tracking-tight uppercase italic truncate">{task.title}</h4>
                                      </div>
                                      <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed font-medium">{task.description || 'No description provided.'}</p>
                                      
                                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                        <div className="flex items-center gap-4">
                                          <div className={cn(
                                            "flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em]",
                                            task.impact === 'High' ? "text-rose-600" : task.impact === 'Medium' ? "text-amber-600" : "text-emerald-600"
                                          )}>
                                            <Target className="w-3.5 h-3.5" />
                                            {task.impact || 'Med'} IMPACT
                                          </div>
                                          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400">
                                            <Clock className="w-3.5 h-3.5" />
                                            {task.effort || 'Med'} EFFORT
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-10 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
                <button 
                  onClick={() => setIsPrioritizeModalOpen(false)}
                  className="px-12 py-5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-black uppercase italic tracking-[0.1em] transition-all shadow-xl hover:translate-y-[-4px]"
                >
                  Finish Prioritization
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </DragDropContext>
  );
}
