import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Project, Task, KanbanColumn, Sprint, SprintSnapshot } from '../types';
import { Target, Plus, Clock, TrendingUp, Zap, GripVertical, CheckCircle2, MoreVertical, Printer, LayoutList, LayoutGrid, Settings, Palette, Trash2, X, ChevronUp, ChevronDown, Download, FileText, Image as ImageIcon, ArrowRight, MessageSquare, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, fixOklch } from '../lib/utils';
import { useToast } from '../context/ToastContext';
import { v4 as uuidv4 } from 'uuid';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ContextualHelp } from '../components/ContextualHelp';
import { TaskModal } from '../components/TaskModal';
import { SprintReportModal } from '../components/SprintReportModal';
import { TaskList } from './TaskList';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { usePermissions } from '../hooks/usePermissions';

const isDarkMode = () => document.documentElement.classList.contains('dark');

interface KanbanBoardProps {
  project: Project;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onNavigate?: (tab: string) => void;
  currentUser?: any;
  onDeleteItem?: (item: any, type: any, originalProjectId?: string) => void;
  onAddTeamMember?: (user: any) => void;
  users?: any[];
  activeTaskId?: string | null;
}

const COLUMN_COLORS = [
  { id: 'zinc', name: 'Gray', bg: 'bg-zinc-100 dark:bg-zinc-800', border: 'border-zinc-200 dark:border-zinc-700', text: 'text-zinc-700 dark:text-zinc-300', headerBg: 'bg-zinc-200 dark:bg-zinc-700' },
  { id: 'blue', name: 'Blue', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-300', headerBg: 'bg-blue-100 dark:bg-blue-800' },
  { id: 'indigo', name: 'Indigo', bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-800', text: 'text-indigo-700 dark:text-indigo-300', headerBg: 'bg-indigo-100 dark:bg-indigo-800' },
  { id: 'purple', name: 'Purple', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-700 dark:text-purple-300', headerBg: 'bg-purple-100 dark:bg-purple-800' },
  { id: 'rose', name: 'Rose', bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-800', text: 'text-rose-700 dark:text-rose-300', headerBg: 'bg-rose-100 dark:bg-rose-800' },
  { id: 'amber', name: 'Amber', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300', headerBg: 'bg-amber-100 dark:bg-amber-800' },
  { id: 'emerald', name: 'Emerald', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-300', headerBg: 'bg-emerald-100 dark:bg-emerald-800' },
];

export function KanbanBoard({ project, setProjects, tasks, setTasks, onNavigate, currentUser, onDeleteItem, onAddTeamMember, users = [], activeTaskId }: KanbanBoardProps) {
  const { addToast } = useToast();
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    if (activeTaskId) {
      const task = tasks.find(t => t.id === activeTaskId);
      if (task) setEditingTask(task);
    }
  }, [activeTaskId, tasks]);
  const [viewMode, setViewMode] = useState<'expanded' | 'condensed' | 'list'>('expanded');
  const isListView = viewMode === 'list';
  const isCondensedView = viewMode === 'condensed';
  const [isManageColumnsOpen, setIsManageColumnsOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isInitialSprintModalOpen, setIsInitialSprintModalOpen] = useState(false);
  const [isFinishSprintModalOpen, setIsFinishSprintModalOpen] = useState(false);
  const [generateReportOnFinish, setGenerateReportOnFinish] = useState(true);
  const [initialSprintDescription, setInitialSprintDescription] = useState('');
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [animationStep, setAnimationStep] = useState(0);
  const [showExecutionFramework, setShowExecutionFramework] = useState(false);

  const { canEditProjectFeature } = usePermissions();
  const canEdit = canEditProjectFeature(project);

  useEffect(() => {
    if (!showExecutionFramework) return;
    const timer = setInterval(() => {
      setAnimationStep((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(timer);
  }, [showExecutionFramework]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const [selectedSprintId, setSelectedSprintId] = useState<number | 'current'>('current');
  
  const defaultColumns: KanbanColumn[] = [
    { id: 'Backlog', title: 'Backlog', color: 'zinc', order: 0 },
    { id: 'In Progress', title: 'In Progress', color: 'blue', order: 1 },
    { id: 'Review/Test', title: 'Review/Test', color: 'purple', order: 2 },
    { id: 'Done', title: 'Done', color: 'emerald', order: 3 }
  ];

  const columns = useMemo(() => {
    return (project.kanbanColumns || defaultColumns).sort((a, b) => a.order - b.order);
  }, [project.kanbanColumns]);

  const filteredTasks = useMemo(() => {
    if (selectedSprintId === 'current') {
      return tasks.filter(t => t.projectId === project.id && !t.archived);
    } else {
      const snapshot = project.sprintSnapshots?.find(s => s.sprintNumber === selectedSprintId);
      return snapshot ? snapshot.tasks : [];
    }
  }, [tasks, project.id, selectedSprintId, project.sprintSnapshots]);

  const isReadOnly = selectedSprintId !== 'current';

  const getColumnColor = (colorId: string) => {
    return COLUMN_COLORS.find(c => c.id === colorId) || COLUMN_COLORS[0];
  };

  const handleAddColumn = (position: 'before-in-progress' | 'after-in-progress' | 'end' = 'end') => {
    let newOrder = columns.length;
    let updatedColumns = [...columns];

    if (position === 'before-in-progress' || position === 'after-in-progress') {
      const inProgressIndex = columns.findIndex(c => c.id === 'In Progress' || c.title === 'In Progress');
      if (inProgressIndex !== -1) {
        const insertIndex = position === 'before-in-progress' ? inProgressIndex : inProgressIndex + 1;
        const newColumn: KanbanColumn = {
          id: uuidv4(),
          title: 'New Column',
          color: 'zinc',
          order: 0 // Will be updated below
        };
        updatedColumns.splice(insertIndex, 0, newColumn);
        // Re-calculate orders
        updatedColumns = updatedColumns.map((c, i) => ({ ...c, order: i }));
      } else {
        // Fallback if In Progress is missing
        const newColumn: KanbanColumn = {
          id: uuidv4(),
          title: 'New Column',
          color: 'zinc',
          order: columns.length
        };
        updatedColumns.push(newColumn);
      }
    } else {
      const newColumn: KanbanColumn = {
        id: uuidv4(),
        title: 'New Column',
        color: 'zinc',
        order: columns.length
      };
      updatedColumns.push(newColumn);
    }

    setProjects(prev => prev.map(p => p.id === project.id ? { ...p, kanbanColumns: updatedColumns } : p));
  };

  const handleUpdateColumn = (id: string, updates: Partial<KanbanColumn>) => {
    const updatedColumns = columns.map(c => c.id === id ? { ...c, ...updates } : c);
    setProjects(prev => prev.map(p => p.id === project.id ? { ...p, kanbanColumns: updatedColumns } : p));
  };

  const handleDeleteColumn = (id: string) => {
    const persistentColumns = ['Backlog', 'In Progress', 'Done', 'Review/Test'];
    const columnToDelete = columns.find(c => c.id === id);
    if (columnToDelete && persistentColumns.includes(columnToDelete.id)) {
      alert('This is a persistent column and cannot be deleted.');
      return;
    }

    if (filteredTasks.some(t => t.kanbanStatus === id || t.kanbanStatus === columnToDelete?.title)) {
      alert('Cannot delete column with tasks. Please move tasks first.');
      return;
    }
    const updatedColumns = columns.filter(c => c.id !== id);
    setProjects(prev => prev.map(p => p.id === project.id ? { ...p, kanbanColumns: updatedColumns } : p));
  };

  const handleMoveColumn = (id: string, direction: 'up' | 'down') => {
    const currentIndex = columns.findIndex(c => c.id === id);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= columns.length) return;

    const newColumns = [...columns];
    const temp = newColumns[currentIndex];
    newColumns[currentIndex] = newColumns[newIndex];
    newColumns[newIndex] = temp;

    // Update orders
    const reorderedColumns = newColumns.map((c, idx) => ({ ...c, order: idx }));
    setProjects(prev => prev.map(p => p.id === project.id ? { ...p, kanbanColumns: reorderedColumns } : p));
  };


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

  const handleCreateInitialSprint = () => {
    const newSprint: Sprint = {
      id: uuidv4(),
      projectId: project.id,
      number: 1,
      name: 'Sprint 1',
      description: initialSprintDescription,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'In Progress'
    };
    setProjects(prev => prev.map(p => 
      p.id === project.id ? { ...p, sprints: [newSprint], currentSprint: 1 } : p
    ));
    addToast('Sprint 1 created and started', 'success');
    setIsInitialSprintModalOpen(false);
    
    // Create the task directly instead of calling handleAddTask to avoid race condition
    const column = columns[0];
    const status = column ? (column.id === column.title ? column.title : column.id) : columns[0].id;
    
    const newTask: Task = {
      id: `t${Date.now()}`,
      projectId: project.id,
      title: 'New Task',
      description: 'Enter task description...',
      status: 'Discover',
      kanbanStatus: status,
      impact: 'Medium',
      effort: 'Medium',
      owner: '',
      sprint: 'Sprint 1',
      createdAt: new Date().toISOString(),
      stageHistory: [{ stage: status, enteredAt: new Date().toISOString() }],
    };
    setTasks(prev => [...prev, newTask]);
    setEditingTask(newTask);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    const originalTask = tasks.find(t => t.id === updatedTask.id);
    if (originalTask && originalTask.kanbanStatus !== updatedTask.kanbanStatus) {
      const newHistory = [...(updatedTask.stageHistory || [])];
      newHistory.push({
        stage: updatedTask.kanbanStatus,
        enteredAt: new Date().toISOString()
      });
      updatedTask.stageHistory = newHistory;
      
      // If moving from Backlog to a board column, ensure a sprint exists
      if ((originalTask.kanbanStatus === 'Backlog' || originalTask.kanbanStatus === 'backlog') && 
          updatedTask.kanbanStatus !== 'Backlog' && updatedTask.kanbanStatus !== 'backlog') {
        ensureActiveSprint();
      }
    }

    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    setEditingTask(null);
    addToast('Task updated successfully');
  };

  const handleAddTask = (columnId: string) => {
    // If columnId is a title (legacy), use it directly, otherwise use the ID
    const column = columns.find(c => c.id === columnId || c.title === columnId);
    const status = column ? (column.id === column.title ? column.title : column.id) : columnId;

    if (status !== 'Backlog' && status !== 'backlog') {
      ensureActiveSprint();
    }

    const newTask: Task = {
      id: `t${Date.now()}`,
      projectId: project.id,
      title: 'New Task',
      description: 'Enter task description...',
      status: 'Discover',
      kanbanStatus: status,
      impact: 'Medium',
      effort: 'Medium',
      owner: '',
      sprint: `Sprint ${project.currentSprint || 1}`,
      createdAt: new Date().toISOString(),
      stageHistory: [{ stage: status, enteredAt: new Date().toISOString() }],
    };
    setTasks(prev => [...prev, newTask]);
    setEditingTask(newTask);
  };

  const handlePrint = async () => {
    setIsExportMenuOpen(false);
    const element = document.getElementById('kanban-board-content');
    if (!element) return;
    
    try {
      addToast('Generating PDF...', 'info');
      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 2,
        backgroundColor: isDarkMode() ? '#18181b' : '#ffffff',
        ignoreElements: (element) => element.classList.contains('no-export'),
        onclone: (clonedDoc) => {
          fixOklch(clonedDoc);
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save('kanban-board.pdf');
      addToast('PDF generated successfully', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      addToast('Failed to generate PDF', 'error');
    }
  };

  const handleDownloadImage = async () => {
    setIsExportMenuOpen(false);
    const element = document.getElementById('kanban-board-content');
    if (!element) return;
    
    try {
      addToast('Generating image...', 'info');
      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 2,
        backgroundColor: isDarkMode() ? '#18181b' : '#ffffff', // zinc-900 or white
        ignoreElements: (element) => element.classList.contains('no-export'),
        onclone: (clonedDoc) => {
          fixOklch(clonedDoc);
        }
      });
      const data = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = data;
      link.download = `kanban-board-${project.name.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.click();
      addToast('Image downloaded successfully', 'success');
    } catch (err) {
      console.error('Failed to download image', err);
      addToast('Failed to download image', 'error');
    }
  };

  const handleExportWord = () => {
    setIsExportMenuOpen(false);
    const element = document.getElementById('kanban-board-content');
    if (!element) return;

    try {
      addToast('Generating Word document...', 'info');
      // Basic HTML export for Word
      const html = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>${project.name} - Kanban Board</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .column-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #333; }
            .task-card { border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; border-radius: 5px; background-color: #fff; }
            .task-title { font-weight: bold; font-size: 14px; }
            .task-desc { font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <h1>${project.name} - Kanban Board</h1>
          ${isListView ? element.innerHTML : `
            <div style="display: flex; gap: 20px;">
              ${columns.map(col => {
                const colTasks = filteredTasks.filter(t => t.kanbanStatus === col.id || t.kanbanStatus === col.title);
                return `
                  <div style="flex: 1; min-width: 200px; border: 1px solid #eee; padding: 10px;">
                    <div class="column-title">${col.title} (${colTasks.length})</div>
                    ${colTasks.map(task => `
                      <div class="task-card">
                        <div class="task-title">${task.title}</div>
                        <div class="task-desc">${task.description}</div>
                        <div style="font-size: 10px; margin-top: 5px;">Owner: ${task.owner || 'Unassigned'}</div>
                      </div>
                    `).join('')}
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </body>
        </html>
      `;
      
      const blob = new Blob(['\ufeff', html], {
        type: 'application/msword'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kanban-board-${project.name.toLowerCase().replace(/\s+/g, '-')}.doc`;
      link.click();
      URL.revokeObjectURL(url);
      addToast('Word document downloaded', 'success');
    } catch (err) {
      console.error('Failed to export Word', err);
      addToast('Failed to export Word', 'error');
    }
  };

  const incompleteTasks = useMemo(() => {
    return filteredTasks.filter(t => t.kanbanStatus !== 'Done' && t.kanbanStatus !== 'Completed' && t.kanbanStatus !== 'Archived' && t.kanbanStatus !== 'Backlog');
  }, [filteredTasks]);

  const handleFinishSprint = () => {
    const currentSprintNum = project.currentSprint || 1;
    const currentSprintTasks = tasks.filter(t => t.projectId === project.id && (t.sprint === `Sprint ${currentSprintNum}` || !t.sprint)); // Fallback to current project tasks if no sprint
    
    const completedTasks = currentSprintTasks.filter(t => t.kanbanStatus === 'Done' || t.kanbanStatus === 'Completed' || t.kanbanStatus === 'Archived');
    const incompleteTasksInSprint = currentSprintTasks.filter(t => t.kanbanStatus !== 'Done' && t.kanbanStatus !== 'Completed' && t.kanbanStatus !== 'Archived' && t.kanbanStatus !== 'Backlog');

    // Move incomplete tasks to Backlog and clear their sprint
    const updatedTasks = tasks.map(t => {
      // Check if task is one of the incomplete tasks in this sprint
      if (incompleteTasksInSprint.some(it => it.id === t.id)) {
        return { 
          ...t, 
          kanbanStatus: 'Backlog', 
          status: 'Discover' as const, 
          sprint: undefined,
          stageHistory: [...(t.stageHistory || []), { stage: 'Backlog (Moved from Finished Sprint)', enteredAt: new Date().toISOString() }]
        };
      }
      return t;
    });

    setTasks(updatedTasks);
    
    // Save sprint snapshot
    const newSnapshot: SprintSnapshot = {
      sprintNumber: currentSprintNum,
      name: `Sprint ${currentSprintNum}`,
      description: project.currentSprintDescription || '',
      tasks: completedTasks,
      completedAt: new Date().toISOString()
    };
    
    setProjects(prev => prev.map(p => {
      if (p.id === project.id) {
        return {
          ...p,
          sprintSnapshots: [...(p.sprintSnapshots || []), newSnapshot],
          currentSprint: currentSprintNum + 1,
          currentSprintDescription: '',
          // If the user wants a new sprint started immediately, they can do it via 'Add Task' or 'Manage Sprints'
        };
      }
      return p;
    }));

    setIsFinishSprintModalOpen(false);
    addToast(`Sprint ${currentSprintNum} finished successfully. ${completedTasks.length} tasks completed.`, 'success');
    
    if (generateReportOnFinish) {
      setTimeout(() => {
        setSelectedSprintId(currentSprintNum);
        setIsReportModalOpen(true);
      }, 500); 
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Dropped outside a column
    if (!destination) return;

    // Dropped in the same column at the same position
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const taskToUpdate = tasks.find(t => t.id === draggableId);
    if (!taskToUpdate) return;

    const destColumn = columns.find(c => c.id === destination.droppableId);
    if (!destColumn) return;

    const newStatus = destColumn.id === destColumn.title ? destColumn.title : destColumn.id;
    const isDoneColumn = destColumn.title.toLowerCase() === 'done' || destColumn.title.toLowerCase() === 'completed';

    const updatedTask = { 
      ...taskToUpdate, 
      kanbanStatus: newStatus,
      actualCompletionDate: isDoneColumn && !taskToUpdate.actualCompletionDate 
        ? new Date().toISOString() 
        : taskToUpdate.actualCompletionDate
    };

    handleUpdateTask(updatedTask);
  };

  // Helper to check dark mode
  const isDarkMode = () => document.documentElement.classList.contains('dark');

  const isTaskOverdue = (task: Task) => {
    if (!task.expectedCompletionDate) return false;
    // Consider tasks in "Done" or similar columns as not overdue
    const doneColumns = ['Done', 'Completed', 'Finished', 'Archived'];
    if (doneColumns.includes(task.kanbanStatus) || doneColumns.includes(task.status)) return false;
    
    const dueDate = new Date(task.expectedCompletionDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    return dueDate < today;
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-full flex flex-col space-y-8 print:p-0 print:m-0 print:block">
      <div className="shrink-0">
        <ContextualHelp 
          title="Kanban Board" 
          description="Manage project execution and track task progress. Move tasks through customizable stages to ensure smooth delivery and visibility across the team."
        />
      </div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0 print:mb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-bold text-indigo-600 uppercase tracking-widest">
            <Target className="w-4 h-4" />
            Project Execution
          </div>
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Kanban Board</h2>
            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium border border-indigo-200 dark:border-indigo-500/30">
              {project.name}
            </span>
            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-bold border border-indigo-200 dark:border-indigo-800">
              Stage: {project.status}
            </span>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl">
            Track and manage tasks for <span className="text-indigo-600 font-semibold">{project.name}</span>.
          </p>
          <div className="mt-4 max-w-2xl">
            <textarea
              placeholder={isReadOnly ? "No description provided for this sprint." : "Add a description or goals for this sprint..."}
              value={
                selectedSprintId === 'current' 
                  ? (project.currentSprintDescription || '') 
                  : (project.sprintSnapshots?.find(s => s.sprintNumber === selectedSprintId)?.description || '')
              }
              onChange={(e) => {
                if (selectedSprintId === 'current') {
                  setProjects(prev => prev.map(p => p.id === project.id ? { ...p, currentSprintDescription: e.target.value } : p));
                } else {
                  setProjects(prev => prev.map(p => {
                    if (p.id === project.id) {
                      const updatedSnapshots = p.sprintSnapshots?.map(s => 
                        s.sprintNumber === selectedSprintId ? { ...s, description: e.target.value } : s
                      );
                      return { ...p, sprintSnapshots: updatedSnapshots };
                    }
                    return p;
                  }));
                }
              }}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-zinc-700 dark:text-zinc-300 resize-none min-h-[60px]"
              rows={2}
            />
          </div>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          {onNavigate && (
            <button 
              onClick={() => onNavigate('project_detail')}
              className="bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all border border-zinc-200 dark:border-zinc-800 shadow-sm"
            >
              Back to Project
            </button>
          )}
          
          <div className="relative" ref={exportMenuRef}>
            <button 
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all border border-zinc-200 dark:border-zinc-800 shadow-sm"
              title="Board Settings"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
              <ChevronDown className="w-3 h-3 ml-1" />
            </button>
            
            <AnimatePresence>
              {isExportMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden z-50"
                >
                  <div className="p-2 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-2 py-1">View Mode</div>
                    <div className="flex flex-col gap-1 mt-1">
                      <button 
                        onClick={() => { setViewMode('expanded'); setIsExportMenuOpen(false); }}
                        className={cn("w-full px-2 py-2 text-left text-sm font-medium rounded-lg flex items-center gap-2", viewMode === 'expanded' ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800")}
                      >
                        <LayoutGrid className="w-4 h-4" /> Expanded
                      </button>
                      <button 
                        onClick={() => { setViewMode('condensed'); setIsExportMenuOpen(false); }}
                        className={cn("w-full px-2 py-2 text-left text-sm font-medium rounded-lg flex items-center gap-2", viewMode === 'condensed' ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800")}
                      >
                        <LayoutList className="w-4 h-4" /> Condensed
                      </button>
                      <button 
                        onClick={() => { setViewMode('list'); setIsExportMenuOpen(false); }}
                        className={cn("w-full px-2 py-2 text-left text-sm font-medium rounded-lg flex items-center gap-2", viewMode === 'list' ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800")}
                      >
                        <LayoutList className="w-4 h-4" /> List
                      </button>
                    </div>
                  </div>

                  <div className="p-2 border-b border-zinc-100 dark:border-zinc-800">
                    <button 
                      onClick={() => { setIsManageColumnsOpen(true); setIsExportMenuOpen(false); }}
                      className="w-full px-2 py-2 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" /> Manage Columns
                    </button>
                  </div>

                  <div className="p-2">
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-2 py-1">Export</div>
                    <button 
                      onClick={() => { handlePrint(); setIsExportMenuOpen(false); }}
                      className="w-full px-2 py-2 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4" /> Print / PDF
                    </button>
                    <button 
                      onClick={() => { handleDownloadImage(); setIsExportMenuOpen(false); }}
                      className="w-full px-2 py-2 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg flex items-center gap-2"
                    >
                      <ImageIcon className="w-4 h-4" /> Save as Image
                    </button>
                    <button 
                      onClick={() => { handleExportWord(); setIsExportMenuOpen(false); }}
                      className="w-full px-2 py-2 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" /> Export to Word
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={() => onNavigate && onNavigate('sprints')}
            className="bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all border border-zinc-200 dark:border-zinc-800 shadow-sm"
          >
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">Manage Sprints</span>
          </button>

          {!isReadOnly && project.sprints && project.sprints.length > 0 && (
            <button 
              onClick={() => setIsFinishSprintModalOpen(true)}
              className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="hidden sm:inline">Finish Sprint</span>
            </button>
          )}

          {!isReadOnly && (
            <button 
              onClick={() => {
                if (!project.sprints || project.sprints.length === 0) {
                  setIsInitialSprintModalOpen(true);
                } else {
                  handleAddTask('Backlog');
                }
              }}
              className="bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">New Task</span>
            </button>
          )}
        </div>
      </div>

      <div id="kanban-board-content" className="flex-1 flex flex-col">
      {filteredTasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
          <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-full flex items-center justify-center mb-6">
            <Target className="w-12 h-12" />
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">No tasks yet</h3>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-md mb-8">
            Start turning your insights into action by adding your first task to the Kanban board.
          </p>
          {!isReadOnly && (
            <button 
              onClick={() => {
                if (!project.sprints || project.sprints.length === 0) {
                  setIsInitialSprintModalOpen(true);
                } else {
                  handleAddTask(columns[0].id);
                }
              }}
              className="bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">New Task</span>
            </button>
          )}
        </div>
      ) : isListView ? (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <TaskList 
            tasks={filteredTasks} 
            projects={[project]} 
            initialProjectId={project.id} 
            isEmbedded={true} 
            onTaskClick={(task) => setEditingTask(task)}
          />
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 min-h-[600px] flex-1 overflow-x-auto pb-4">
            {columns.map(col => {
              const colColor = getColumnColor(col.color);
              const colTasks = filteredTasks.filter(t => t.kanbanStatus === col.id || t.kanbanStatus === col.title);
              
              return (
              <div 
                key={col.id} 
                className={cn(
                  "rounded-3xl p-4 flex flex-col border min-w-[300px]",
                  colColor.bg,
                  colColor.border
                )}
              >
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className={cn("font-bold", colColor.text)}>{col.title}</h3>
                  <span className={cn("text-xs font-bold px-2 py-1 rounded-full bg-white/50 dark:bg-black/20", colColor.text)}>
                    {colTasks.length}
                  </span>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div 
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={cn(
                        "flex-1 space-y-4 overflow-y-auto min-h-[150px] transition-colors rounded-2xl",
                        snapshot.isDraggingOver ? "bg-black/5 dark:bg-white/5" : ""
                      )}
                    >
                      {colTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index} isDragDisabled={isReadOnly}>
                          {(provided, snapshot) => (
                            <div 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => setEditingTask(task)}
                              className={cn(
                                "bg-yellow-100 dark:bg-yellow-900/40 p-5 rounded-sm shadow-[2px_2px_5px_rgba(0,0,0,0.1)] border-l-4 border-yellow-400 dark:border-yellow-600 hover:shadow-lg transition-all group cursor-pointer relative overflow-hidden",
                                snapshot.isDragging ? "shadow-2xl ring-2 ring-yellow-400 rotate-3 scale-105 z-50" : "hover:-translate-y-1 hover:rotate-1",
                                isReadOnly ? "cursor-default hover:shadow-sm hover:translate-y-0 hover:rotate-0" : ""
                              )}
                            >
                              {/* Tape effect */}
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-3 bg-white/40 dark:bg-black/20 backdrop-blur-sm -rotate-2 z-10" />
                              
                              <div className="flex justify-between items-start mb-3">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider",
                                  task.impact === 'High' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                                  task.impact === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                  'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                )}>
                                  {task.impact} Impact
                                </span>
                                <div className="flex items-center gap-2">
                                  {task.isBlocked && (
                                    <div className="flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-900/20 px-1.5 py-0.5 rounded" title="Blocked">
                                      <AlertCircle className="w-3 h-3" />
                                      Blocked
                                    </div>
                                  )}
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
                                  <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-bold uppercase">
                                    <Clock className="w-3 h-3" />
                                    {task.effort}
                                  </div>
                                </div>
                              </div>
                              
                              <h4 className="font-bold text-zinc-900 dark:text-white mb-2 leading-tight group-hover:text-indigo-600 transition-colors">{task.title}</h4>
                              
                              {!isCondensedView && (
                                <>
                                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-4">{task.description}</p>
                                  
                                  <div className="flex items-center gap-3 mb-4">
                                    {task.estimation && (
                                      <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-[10px] font-bold text-zinc-600 dark:text-zinc-300">
                                        <Target className="w-3 h-3" />
                                        {task.estimation} pts
                                      </div>
                                    )}
                                    {task.sprint && (
                                      <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                                        <Clock className="w-3 h-3" />
                                        {task.sprint}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {task.metrics && (
                                    <div className="pt-3 border-t border-zinc-100 space-y-2">
                                      {task.metrics.experience && (
                                        <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-bold">
                                          <TrendingUp className="w-3 h-3" />
                                          {task.metrics.experience}
                                        </div>
                                      )}
                                      {task.metrics.timeSaved && (
                                        <div className="flex items-center gap-2 text-[10px] text-blue-600 font-bold">
                                          <Zap className="w-3 h-3" />
                                          {task.metrics.timeSaved}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </>
                              )}

                              {task.owner && (
                                <div className={cn(
                                  "pt-3 border-t flex items-center justify-between", 
                                  isCondensedView ? "mt-2" : "mt-4",
                                  task.owner === currentUser?.name ? "border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10 -mx-5 px-5 pb-2 rounded-b-2xl" : "border-zinc-100 dark:border-zinc-800"
                                )}>
                                  <span className={cn(
                                    "text-[10px] font-bold uppercase tracking-widest",
                                    task.owner === currentUser?.name ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400"
                                  )}>Owner</span>
                                  <div className="flex items-center gap-2">
                                    {(() => {
                                      const member = project.team?.find(m => m.name === task.owner || m.id === task.owner);
                                      if (member?.photoUrl) {
                                        return <img src={member.photoUrl} alt={member.name} className="w-6 h-6 rounded-full object-cover border border-zinc-200 dark:border-zinc-700" />;
                                      }
                                      return (
                                        <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                                          {task.owner.charAt(0).toUpperCase()}
                                        </div>
                                      );
                                    })()}
                                    <span className={cn(
                                      "text-xs font-medium",
                                      task.owner === currentUser?.name ? "text-indigo-700 dark:text-indigo-300 font-bold" : "text-zinc-700 dark:text-zinc-300"
                                    )}>{task.owner === currentUser?.name ? 'You' : task.owner}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      
                      {!isReadOnly && canEdit && (
                        <button 
                          onClick={() => handleAddTask(col.id)}
                          className={cn(
                            "w-full py-3 border-2 border-dashed rounded-2xl transition-all flex items-center justify-center gap-2 text-sm font-bold mt-4",
                            colColor.border,
                            colColor.text,
                            "hover:bg-white dark:hover:bg-zinc-800"
                          )}
                        >
                          <Plus className="w-4 h-4" />
                          Add Task
                        </button>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {/* Task Edit Slide-over Panel */}
      <AnimatePresence>
        {editingTask && (
          <TaskModal
            task={editingTask}
            project={project}
            currentUser={currentUser}
            users={users}
            isReadOnly={!canEdit}
            onSave={handleUpdateTask}
            onUpdate={(updatedTask) => setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t))}
            onClose={() => setEditingTask(null)}
            onAddTeamMember={onAddTeamMember}
            onDelete={(taskId) => {
              const task = tasks.find(t => t.id === taskId);
              if (task && onDeleteItem) {
                onDeleteItem(task, 'Task', project.id);
              } else {
                setTasks(prev => prev.filter(t => t.id !== taskId));
              }
              setEditingTask(null);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isManageColumnsOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsManageColumnsOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[80vh]">
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg">
                      <Settings className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-zinc-900 dark:text-white text-lg">Manage Columns</h3>
                  </div>
                  <button 
                    onClick={() => setIsManageColumnsOpen(false)}
                    className="p-2 text-zinc-400 hover:text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                  {columns.map((col, index) => (
                    <div key={col.id} className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <div className="flex flex-col gap-1">
                        <button 
                          onClick={() => handleMoveColumn(col.id, 'up')}
                          disabled={index === 0}
                          className="p-1 text-zinc-400 hover:text-zinc-600 disabled:opacity-30"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleMoveColumn(col.id, 'down')}
                          disabled={index === columns.length - 1}
                          className="p-1 text-zinc-400 hover:text-zinc-600 disabled:opacity-30"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <input 
                          type="text"
                          value={col.title}
                          onChange={(e) => handleUpdateColumn(col.id, { title: e.target.value })}
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-zinc-900 dark:text-white text-sm"
                          placeholder="Column Title"
                        />
                        <div className="flex gap-2">
                          {COLUMN_COLORS.map(color => (
                            <button
                              key={color.id}
                              onClick={() => handleUpdateColumn(col.id, { color: color.id })}
                              className={cn(
                                "w-6 h-6 rounded-full border-2 transition-all",
                                color.bg.replace('bg-', 'bg-').split(' ')[0], // Simple hack to get color
                                col.color === color.id ? "border-zinc-900 dark:border-white scale-110" : "border-transparent opacity-50 hover:opacity-100"
                              )}
                              title={color.name}
                            />
                          ))}
                        </div>
                      </div>

                      {['Backlog', 'In Progress', 'Done', 'Blocked'].includes(col.id) ? (
                        <div className="w-9 h-9" /> // Placeholder to maintain layout
                      ) : (
                        <button 
                          onClick={() => handleDeleteColumn(col.id)}
                          className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                          title="Delete Column"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}

                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => handleAddColumn('before-in-progress')}
                      className="w-full py-3 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all flex items-center justify-center gap-2 font-bold text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Column Before "In Progress"
                    </button>
                    <button 
                      onClick={() => handleAddColumn('after-in-progress')}
                      className="w-full py-3 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all flex items-center justify-center gap-2 font-bold text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Column After "In Progress"
                    </button>
                    <button 
                      onClick={() => handleAddColumn('end')}
                      className="w-full py-3 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all flex items-center justify-center gap-2 font-bold text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Column at End
                    </button>
                  </div>
                </div>

                <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end">
                  <button 
                    onClick={() => setIsManageColumnsOpen(false)}
                    className="px-6 py-2 bg-zinc-900 text-white rounded-xl font-bold shadow-lg hover:bg-zinc-800 transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      </div>

      {isReportModalOpen && selectedSprintId !== 'current' && (
        <SprintReportModal
          sprint={project.sprintSnapshots?.find(s => s.sprintNumber === selectedSprintId)!}
          project={project}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}

      {/* Finish Sprint Modal */}
      <AnimatePresence>
        {isFinishSprintModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-zinc-200 dark:border-zinc-800"
            >
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Finish Sprint {project.currentSprint || 1}</h2>
                </div>
                <button 
                  onClick={() => setIsFinishSprintModalOpen(false)}
                  className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-2">Sprint Summary</h3>
                  <div className="flex flex-col gap-2 p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      <strong className="text-zinc-900 dark:text-white">{filteredTasks.length - incompleteTasks.length}</strong> tasks are completed.
                    </p>
                    {incompleteTasks.length > 0 && (
                      <p className="text-sm text-amber-600 dark:text-amber-500 font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {incompleteTasks.length} tasks are incomplete and will be moved to the Backlog.
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-3 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                      checked={generateReportOnFinish}
                      onChange={(e) => setGenerateReportOnFinish(e.target.checked)}
                    />
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Generate AI Sprint Report</h4>
                      <p className="text-xs text-zinc-500">Automatically analyze tasks and create a summary</p>
                    </div>
                  </label>
                </div>
              </div>
              <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end gap-3">
                <button
                  onClick={() => setIsFinishSprintModalOpen(false)}
                  className="px-4 py-2 text-zinc-600 dark:text-zinc-400 font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFinishSprint}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none transition-all"
                >
                  Finish Sprint
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isInitialSprintModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-zinc-200 dark:border-zinc-800"
            >
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                    <Target className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Create Initial Sprint</h2>
                </div>
                <button 
                  onClick={() => setIsInitialSprintModalOpen(false)}
                  className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Adding your first task will automatically create a new Sprint. Please provide a description or goal for this sprint.
                </p>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                    Sprint Description
                  </label>
                  <textarea
                    value={initialSprintDescription}
                    onChange={(e) => setInitialSprintDescription(e.target.value)}
                    placeholder="What is the main goal of this sprint?"
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px] resize-none dark:text-white"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end gap-3">
                <button
                  onClick={() => setIsInitialSprintModalOpen(false)}
                  className="px-4 py-2 text-zinc-600 dark:text-zinc-400 font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateInitialSprint}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all"
                >
                  Create Sprint & Task
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
