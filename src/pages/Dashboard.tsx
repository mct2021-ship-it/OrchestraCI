import React, { useMemo } from 'react';
import { Users, Map, Target, TrendingUp, GitMerge, Sparkles, ChevronUp, ChevronDown, FolderOpen, Plus, CheckSquare, Briefcase, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Persona, JourneyMap, Task, ProcessMap, Project, User } from '../types';
import { ContextualHelp } from '../components/ContextualHelp';

interface DashboardProps {
  personas: Persona[];
  journeys: JourneyMap[];
  tasks: Task[];
  processMaps: ProcessMap[];
  projects: Project[];
  onNavigate: (tab: string) => void;
  currentUser?: User;
  users: User[];
}

export function Dashboard({ personas, journeys, tasks, processMaps, projects, onNavigate, currentUser, users }: DashboardProps) {
  const [showIntro, setShowIntro] = React.useState(true);
  const [expandedStatId, setExpandedStatId] = React.useState<string | null>(null);

  const activeProjects = useMemo(() => (projects || []).filter(p => !p.archived), [projects]);

  const mentions = useMemo(() => {
    if (!currentUser) return [];
    
    const allMentions: { id: string, text: string, source: string, type: 'task' | 'journey' | 'process', sourceId: string }[] = [];
    const userHandle = `@${currentUser.name.split(' ')[0]}`.toLowerCase();
    const userEmail = `@${currentUser.email}`.toLowerCase();

    const checkMentions = (comments: any[] | undefined, source: string, type: any, sourceId: string) => {
      comments?.forEach(c => {
        const text = c.text.toLowerCase();
        if (text.includes(userHandle) || text.includes(userEmail)) {
          allMentions.push({ id: c.id, text: c.text, source, type, sourceId });
        }
      });
    };

    tasks.forEach(t => checkMentions(t.comments, t.title, 'task', t.id));
    journeys.forEach(j => checkMentions(j.comments, j.title, 'journey', j.id));
    processMaps.forEach(pm => checkMentions(pm.comments, pm.title, 'process', pm.id));

    return allMentions.sort((a, b) => b.id.localeCompare(a.id)).slice(0, 5);
  }, [tasks, journeys, processMaps, currentUser]);

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || 'Unknown Project';
  };

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

  const stats = useMemo(() => [
    { 
      id: 'projects', 
      label: 'Active Projects', 
      value: activeProjects.length, 
      icon: FolderOpen, 
      color: 'bg-zinc-800',
      items: activeProjects.map(p => ({ id: p.id, name: p.name, projectId: p.id }))
    },
    { 
      id: 'journeys', 
      label: 'Journey Maps', 
      value: (journeys || []).filter(j => !j.archived).length, 
      icon: Map, 
      color: 'bg-zinc-800',
      items: (journeys || []).filter(j => !j.archived).map(j => ({ id: j.id, name: j.title, projectId: j.projectId }))
    },
    { 
      id: 'process_maps', 
      label: 'Process Maps', 
      value: (processMaps || []).filter(pm => !pm.archived).length, 
      icon: GitMerge, 
      color: 'bg-zinc-800',
      items: (processMaps || []).filter(pm => !pm.archived).map(pm => ({ id: pm.id, name: pm.title, projectId: pm.projectId }))
    },
    { 
      id: 'tasks', 
      label: 'Active Tasks', 
      value: (tasks || []).filter(t => t.status !== 'Deliver' && !t.archived).length, 
      icon: Target, 
      color: 'bg-zinc-800',
      items: (tasks || []).filter(t => t.status !== 'Deliver' && !t.archived).map(t => ({ id: t.id, name: t.title, projectId: t.projectId }))
    },
  ], [activeProjects, journeys, processMaps, tasks]);

  const handleStatClick = (statId: string) => {
    if (expandedStatId === statId) {
      setExpandedStatId(null);
    } else {
      setExpandedStatId(statId);
    }
  };

  const firstJourney = useMemo(() => (journeys || []).find(j => !j.archived), [journeys]);
  const chartData = useMemo(() => firstJourney ? firstJourney.stages.map(s => ({
    name: s.name,
    Emotion: s.emotion
  })) : [], [firstJourney]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <ContextualHelp 
        title="Dashboard" 
        description="Get a high-level overview of your Customer Experience program. Track active projects, journey maps, and key metrics across your organization."
      />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Dashboard</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Overview of your Customer Experience program.</p>
        </div>
        <button 
          onClick={() => onNavigate('projects')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Sparkles className="w-5 h-5" />
          Start a Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          const isExpanded = expandedStatId === stat.id;
          
          // Group items by project
          const itemsByProject = stat.items.reduce((acc, item) => {
            const projectName = getProjectName(item.projectId);
            if (!acc[projectName]) acc[projectName] = [];
            acc[projectName].push(item);
            return acc;
          }, {} as Record<string, typeof stat.items>);

          return (
            <div key={i} className="flex flex-col w-full">
              <button 
                onClick={() => handleStatClick(stat.id)}
                className={`bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 flex items-center gap-4 hover:border-zinc-400 hover:shadow-md transition-all text-left w-full group ${isExpanded ? 'ring-2 ring-indigo-500 border-transparent' : ''}`}
              >
                <div className={`p-3 rounded-lg ${stat.color} text-white shadow-sm group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{stat.label}</p>
                  <p className="text-2xl font-semibold text-zinc-900 dark:text-white">{stat.value}</p>
                </div>
                <div className="ml-auto">
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-zinc-400" /> : <ChevronDown className="w-5 h-5 text-zinc-400" />}
                </div>
              </button>
              
              {isExpanded && (
                <div className="mt-2 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 animate-in slide-in-from-top-2 fade-in duration-200 w-full z-10 shadow-lg">
                  {Object.entries(itemsByProject).length > 0 ? (
                    <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                      {Object.entries(itemsByProject).map(([projectName, items]) => (
                        <div key={projectName}>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 sticky top-0 bg-zinc-50 dark:bg-zinc-900/90 py-1">{projectName}</h4>
                          <ul className="space-y-1">
                            {items.map(item => (
                              <li key={item.id} className="text-sm text-zinc-700 dark:text-zinc-300 pl-2 border-l-2 border-zinc-200 dark:border-zinc-700 hover:border-indigo-500 transition-colors py-0.5">
                                {item.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-400 italic">No items found.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => onNavigate('tasks')}
              className="text-lg font-semibold text-zinc-900 dark:text-white hover:text-indigo-600 transition-colors text-left"
            >
              My Work
            </button>
            <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
              Assigned to you
            </span>
          </div>
          <div className="space-y-4">
            {(tasks || []).filter(t => !t.archived && t.owner === currentUser?.id).slice(0, 4).map(task => {
              const project = (projects || []).find(p => p.id === task.projectId);
              return (
                <button 
                  key={task.id} 
                  onClick={() => onNavigate('tasks')}
                  className="flex items-center justify-between p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-800/50 hover:border-indigo-400 transition-all w-full text-left group shadow-sm"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-zinc-900 dark:text-white group-hover:text-indigo-600 transition-colors truncate">{task.title}</h4>
                      {isTaskOverdue(task) && (
                        <div className="flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-900/20 px-1.5 py-0.5 rounded shrink-0" title="Overdue">
                          <AlertCircle className="w-3 h-3" />
                          Overdue
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                      {project ? project.name : 'Unknown Project'} • {task.kanbanStatus}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap shrink-0 ${
                    task.impact === 'High' ? 'bg-rose-100 text-rose-700' :
                    task.impact === 'Medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {task.impact} Impact
                  </span>
                </button>
              );
            })}
            {(tasks || []).filter(t => !t.archived && t.owner === currentUser?.id).length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                  <CheckSquare className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">No pending tasks</h4>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">You're all caught up! Add new tasks to your Kanban board.</p>
                <button 
                  onClick={() => onNavigate('tasks')}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-sm text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Go to Tasks
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Mentions</h3>
            <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
              @ Mentions
            </span>
          </div>
          <div className="space-y-4">
            {mentions.map(mention => (
              <div 
                key={mention.id}
                className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-amber-100 dark:border-amber-900/30 hover:border-amber-300 transition-all w-full text-left group relative"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-1.5 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-lg">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-900 dark:text-white font-medium line-clamp-2 mb-1 italic">
                      "{mention.text}"
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 dark:text-zinc-400">
                      <span className="font-bold uppercase tracking-wider">{mention.type}</span>
                      <span>•</span>
                      <span className="truncate">{mention.source}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {mentions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/30 text-amber-500 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">No mentions</h4>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">You haven't been mentioned in any comments yet.</p>
              </div>
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
          <button 
            onClick={() => onNavigate('projects')}
            className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 hover:text-indigo-600 transition-colors text-left block w-full"
          >
            Active Projects
          </button>
          <div className="space-y-4">
            {activeProjects.slice(0, 4).map(project => (
              <button 
                key={project.id} 
                onClick={() => onNavigate('projects')}
                className="flex items-center justify-between p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 transition-all w-full text-left group"
              >
                <div>
                  <h4 className="font-medium text-zinc-900 dark:text-white group-hover:text-indigo-600 transition-colors">{project.name}</h4>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-1">{project.description}</p>
                </div>
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700 whitespace-nowrap ml-4">
                  {project.status}
                </span>
              </button>
            ))}
            {activeProjects.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-full flex items-center justify-center mb-4">
                  <Briefcase className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">No active projects</h4>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Get started by creating your first project.</p>
                <button 
                  onClick={() => onNavigate('projects')}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-sm text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Create Project
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
          <button 
            onClick={() => onNavigate('kanban')}
            className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 hover:text-indigo-600 transition-colors text-left block w-full"
          >
            Recent Tasks
          </button>
          <div className="space-y-4">
            {(tasks || []).filter(t => !t.archived).slice(0, 4).map(task => {
              const project = (projects || []).find(p => p.id === task.projectId);
              return (
                <button 
                  key={task.id} 
                  onClick={() => onNavigate('kanban')}
                  className="flex items-center justify-between p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 transition-all w-full text-left group"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-zinc-900 dark:text-white group-hover:text-indigo-600 transition-colors truncate">{task.title}</h4>
                      {isTaskOverdue(task) && (
                        <div className="flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-900/20 px-1.5 py-0.5 rounded shrink-0" title="Overdue">
                          <AlertCircle className="w-3 h-3" />
                          Overdue
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                      {project ? project.name : 'Unknown Project'} • {task.status}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap shrink-0 ${
                    task.impact === 'High' ? 'bg-rose-100 text-rose-700' :
                    task.impact === 'Medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {task.impact} Impact
                  </span>
                </button>
              );
            })}
            {(tasks || []).filter(t => !t.archived).length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                  <CheckSquare className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">No pending tasks</h4>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">You're all caught up! Add new tasks to your Kanban board.</p>
                <button 
                  onClick={() => onNavigate('kanban')}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-sm text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Go to Kanban
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
