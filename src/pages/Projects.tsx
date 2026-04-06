import React, { useState, useMemo } from 'react';
import { mockJourneyMaps, mockProcessMaps, mockTasks } from '../data/mockData';
import { Plus, Folder, Map as MapIcon, MoreVertical, Clock, GitMerge, Target, X, PlusCircle, Trash2, Info, ChevronDown, ChevronUp, Archive, Briefcase, AlertCircle, Sparkles, Tag, Users, UserPlus, Check } from 'lucide-react';
import { Project, Product, Service } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { usePlan } from '../context/PlanContext';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { ContextualHelp } from '../components/ContextualHelp';
import { HelpTooltip } from '../components/HelpTooltip';

interface ProjectsProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  onOpenJourney: (journeyId: string) => void;
  onSelectProject: (projectId: string) => void;
  onDeleteItem: (item: any, type: string) => void;
  activeProjectId: string | null;
  products: Product[];
  setProducts?: React.Dispatch<React.SetStateAction<Product[]>>;
  services: Service[];
  setServices?: React.Dispatch<React.SetStateAction<Service[]>>;
  openNewProjectModal?: boolean;
  setOpenNewProjectModal?: (open: boolean) => void;
  journeys?: import('../types').JourneyMap[];
  processMaps?: import('../types').ProcessMap[];
  tasks?: import('../types').Task[];
  personas?: import('../types').Persona[];
  users?: import('../types').User[];
  setUsers?: React.Dispatch<React.SetStateAction<import('../types').User[]>>;
  onAddToAuditLog?: (action: string, details: string, type: 'Create' | 'Update' | 'Delete' | 'Restore' | 'Login', entityType?: string, entityId?: string, source?: 'Manual' | 'AI' | 'Data Source') => void;
}

export function Projects({ 
  projects, 
  setProjects, 
  onOpenJourney, 
  onSelectProject, 
  onDeleteItem,
  activeProjectId,
  products,
  setProducts,
  services,
  setServices,
  openNewProjectModal,
  setOpenNewProjectModal,
  onProjectCreated,
  journeys = [],
  processMaps = [],
  tasks = [],
  personas = [],
  users = [],
  setUsers,
  onAddToAuditLog
}: ProjectsProps & { onProjectCreated?: (id: string) => void }) {
  const { plan } = usePlan();
  const { user } = useAuth();
  const { canDeleteProject, canCreateProject } = usePermissions();
  const [isModalOpen, setIsModalOpen] = useState(openNewProjectModal || false);
  const [filter, setFilter] = useState<string>('All');
  const [showArchived, setShowArchived] = useState(false);
  const [showHelpText, setShowHelpText] = useState(false);

  // Sync prop with local state
  React.useEffect(() => {
    if (openNewProjectModal !== undefined) {
      setIsModalOpen(openNewProjectModal);
    }
  }, [openNewProjectModal]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setStep(1);
    setShowCongrats(false);
    setCreatedProjectId(null);
    setSelectedPersonas([]);
    if (setOpenNewProjectModal) setOpenNewProjectModal(false);
  };

  const activeProjectsCount = useMemo(() => projects.filter(p => !p.archived).length, [projects]);
  const totalCreatedCount = useMemo(() => projects.length + 12, [projects]); // Mocking 12 deleted projects for demo

  const projectLimit = plan === 'starter' ? 3 : 15;
  const creationLimit = plan === 'starter' ? 10 : 50;
  
  const isAtActiveLimit = activeProjectsCount >= projectLimit && plan !== 'enterprise';
  const isAtCreationLimit = totalCreatedCount >= creationLimit && plan !== 'enterprise';
  
  const canAddProject = !isAtActiveLimit && !isAtCreationLimit && canCreateProject();
  
  const [showLimitModal, setShowLimitModal] = useState(false);

  const handleOpenNewProject = () => {
    if (!canAddProject) {
      setShowLimitModal(true);
      return;
    }
    setIsModalOpen(true);
  };

  const [newProject, setNewProject] = useState<Partial<Project>>({
    name: '',
    description: '',
    purpose: '',
    goals: [''],
    expectedOutcomes: [''],
    taxonomy: [''],
    status: 'Discover',
    improvementFocus: [{ metric: '', target: '' }],
    features: {
      processMaps: true,
      raidLog: true,
      sprints: true,
      insights: true
    },
    useDoubleDiamond: true
  });
  const [step, setStep] = useState(1);
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [showCongrats, setShowCongrats] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

  const [newProductName, setNewProductName] = useState('');
  const [newServiceName, setNewServiceName] = useState('');

  const handleAddProduct = () => {
    if (!newProductName.trim() || !setProducts) return;
    const newProduct: Product = {
      id: `prod_${Date.now()}`,
      name: newProductName.trim(),
      description: ''
    };
    setProducts(prev => [...prev, newProduct]);
    setNewProject(prev => ({ ...prev, products: [...(prev.products || []), newProduct] }));
    setNewProductName('');
  };

  const handleAddService = () => {
    if (!newServiceName.trim() || !setServices) return;
    const newService: Service = {
      id: `serv_${Date.now()}`,
      productId: 'unassigned',
      name: newServiceName.trim(),
      description: ''
    };
    setServices(prev => [...prev, newService]);
    setNewProject(prev => ({ ...prev, services: [...(prev.services || []), newService] }));
    setNewServiceName('');
  };

  const columns = useMemo(() => ['Discover', 'Define', 'Develop', 'Deliver', 'Done'], []);
  const filters = useMemo(() => ['All', ...columns], [columns]);

  const filteredProjects = useMemo(() => projects.filter(p => {
    if (showArchived) return p.archived;
    if (p.archived) return false;
    if (filter === 'All') return true;
    return p.status === filter;
  }), [projects, showArchived, filter]);

  const handleArchiveProject = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    const project = projects.find(p => p.id === projectId);
    setProjects(projects.map(p => p.id === projectId ? { ...p, archived: true } : p));
    if (activeProjectId === projectId) {
      onSelectProject('');
    }
    if (project) {
      onAddToAuditLog?.('Archived Project', `Archived project ${project.name}`, 'Delete', 'Project', projectId, 'Manual');
    }
  };

  const handleRestoreProject = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    const project = projects.find(p => p.id === projectId);
    setProjects(projects.map(p => p.id === projectId ? { ...p, archived: false } : p));
    if (project) {
      onAddToAuditLog?.('Restored Project', `Restored project ${project.name}`, 'Restore', 'Project', projectId, 'Manual');
    }
  };

  const handleCreateProject = () => {
    const projectId = `proj-${Date.now()}`;
    const project: Project = {
      id: projectId,
      name: newProject.name || 'Untitled Project',
      description: newProject.description || '',
      purpose: newProject.purpose || '',
      goals: (newProject.goals || []).filter(g => g.trim() !== ''),
      expectedOutcomes: (newProject.expectedOutcomes || []).filter(o => o.trim() !== ''),
      taxonomy: (newProject.taxonomy || []).filter(t => t.trim() !== ''),
      products: newProject.products || [],
      services: newProject.services || [],
      status: newProject.status as any || 'Discover',
      updatedAt: new Date().toISOString(),
      improvementFocus: (newProject.improvementFocus || []).filter(f => f.metric.trim() !== ''),
      features: { 
        processMaps: true, 
        raidLog: true,
        sprints: true,
        insights: true
      },
      useDoubleDiamond: newProject.useDoubleDiamond !== false,
      personaIds: selectedPersonas,
      team: user ? [{
        id: `team-${Date.now()}`,
        name: user.name,
        jobTitle: 'Creator',
        projectRole: 'Project Lead',
        photoUrl: user.photoUrl
      }] : []
    };
    setProjects([project, ...projects]);
    setCreatedProjectId(projectId);
    onAddToAuditLog?.('Created Project', `Created project ${project.name}`, 'Create', 'Project', project.id, 'Manual');
    setStep(6); // Move to Personas step
  };

  const handleCompleteSetup = () => {
    if (createdProjectId) {
      // Update project with final persona selection and team
      setProjects(prev => prev.map(p => p.id === createdProjectId ? { 
        ...p, 
        personaIds: selectedPersonas,
        team: newProject.team || p.team
      } : p));
      if (onProjectCreated) onProjectCreated(createdProjectId);
    }
    setShowCongrats(true);
  };

  const togglePersona = (id: string) => {
    if (selectedPersonas.includes(id)) {
      setSelectedPersonas(selectedPersonas.filter(pId => pId !== id));
    } else {
      setSelectedPersonas([...selectedPersonas, id]);
    }
  };

  const addField = (field: 'goals' | 'expectedOutcomes' | 'taxonomy' | 'improvementFocus') => {
    if (field === 'improvementFocus') {
      setNewProject({
        ...newProject,
        improvementFocus: [...(newProject.improvementFocus || []), { metric: '', target: '' }]
      });
    } else {
      setNewProject({
        ...newProject,
        [field]: [...(newProject[field] || []), '']
      });
    }
  };

  const updateField = (field: 'goals' | 'expectedOutcomes' | 'taxonomy', index: number, value: string) => {
    const list = [...(newProject[field] || [])];
    list[index] = value;
    setNewProject({ ...newProject, [field]: list });
  };

  const updateImprovementFocus = (index: number, key: 'metric' | 'target', value: string) => {
    const list = [...(newProject.improvementFocus || [])];
    list[index] = { ...list[index], [key]: value };
    setNewProject({ ...newProject, improvementFocus: list });
  };

  const removeField = (field: 'goals' | 'expectedOutcomes' | 'taxonomy' | 'improvementFocus', index: number) => {
    const list = [...(newProject[field] as any[])];
    list.splice(index, 1);
    setNewProject({ ...newProject, [field]: list });
  };

  return (
    <div className="p-4 sm:p-8 max-w-[1200px] mx-auto min-h-full flex flex-col">
      <div className="shrink-0">
        <ContextualHelp 
          title="Projects" 
          description="Manage and track your CX improvement initiatives. Group related journey maps, process maps, and tasks into cohesive projects to drive meaningful change."
        />
      </div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 shrink-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Projects</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm sm:text-base">Manage and track your CX improvement initiatives.</p>
        </div>
        <button 
          onClick={handleOpenNewProject}
          className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          New Project
        </button>
      </div>

      <div className="mb-8 shrink-0">
        <button 
          onClick={() => setShowHelpText(!showHelpText)}
          className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors mb-2"
        >
          <Info className="w-4 h-4" />
          {showHelpText ? 'Hide Help' : 'Show Help'}
          {showHelpText ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <AnimatePresence>
          {showHelpText && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-900 leading-relaxed">
                <strong>This is where the work comes together.</strong> Projects act as the central hub for your CX initiatives. 
                Link Journey Maps, Process Maps, and Tasks to a Project to track progress from Discovery to Delivery. 
                Use the taxonomy tags to categorize and filter your work across the organization.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={showArchived ? 'Archived' : filter}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'Archived') {
                  setShowArchived(true);
                  setFilter('All');
                } else {
                  setShowArchived(false);
                  setFilter(val);
                }
              }}
              className="appearance-none pl-4 pr-10 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-bold text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
            >
              <option value="All">All Stages</option>
              {columns.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="Archived">Archived</option>
            </select>
            <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className={cn(
        "flex-1 overflow-y-auto p-2 pb-4",
        filteredProjects.length === 0 ? "flex flex-col" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 content-start"
      )}>
        {filteredProjects.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-12 text-center min-h-[400px]">
            <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-full flex items-center justify-center mb-6">
              <Briefcase className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">No projects found</h3>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-md mb-8">
              {showArchived ? "You don't have any archived projects." : "Get started by creating your first improvement project to track your CX initiatives."}
            </p>
            {!showArchived && (
              <button 
                onClick={() => {
                  setIsModalOpen(true);
                  if (setOpenNewProjectModal) setOpenNewProjectModal(true);
                }}
                className="bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Create New Project
              </button>
            )}
          </div>
        ) : (
          filteredProjects.map(project => {
            const projectJourneys = journeys.filter(j => j.projectId === project.id && !j.archived);
            const projectProcessMaps = processMaps.filter(pm => pm.projectId === project.id && !pm.archived);
            const projectTasks = tasks.filter(t => t.projectId === project.id && !t.archived);
            const isActive = activeProjectId === project.id;
            
            return (
              <motion.div 
                layout
                key={project.id} 
                onClick={() => onSelectProject(project.id)}
                className={`bg-white dark:bg-zinc-900 rounded-2xl border transition-all cursor-pointer group flex flex-col p-5 ${
                  isActive ? 'ring-2 ring-indigo-600 border-transparent shadow-xl' : 'border-zinc-200 dark:border-zinc-800 hover:shadow-lg hover:border-zinc-300'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl shrink-0 ${isActive ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                    <Folder className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    {project.archived ? (
                      <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Archive className="w-3 h-3" />
                        Archived
                      </span>
                    ) : (
                      <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white truncate" title={project.name}>{project.name}</h3>
                  </div>
                  <div className="mb-3">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      project.status === 'Discover' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                      project.status === 'Define' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                      project.status === 'Develop' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                      project.status === 'Deliver' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      'bg-zinc-100 text-zinc-700 border border-zinc-200'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-4 flex-1">{project.description || 'No description provided.'}</p>
                  
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 mb-4">
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      <MapIcon className="w-3.5 h-3.5" />
                      {projectJourneys.length} Journeys
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      <GitMerge className="w-3.5 h-3.5" />
                      {projectProcessMaps.length} Processes
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      <Target className="w-3.5 h-3.5" />
                      {projectTasks.length} Tasks
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-auto">
                  <div className="flex items-center gap-1">
                    {canDeleteProject(project) && (
                      <>
                        {project.archived ? (
                          <button 
                            onClick={(e) => handleRestoreProject(e, project.id)}
                            className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                            title="Restore Project"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        ) : (
                          <button 
                            onClick={(e) => handleArchiveProject(e, project.id)}
                            className="p-2 text-zinc-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl transition-all"
                            title="Archive Project"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteItem(project, 'Project');
                          }}
                          className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                          title="Delete Project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                  {isActive ? (
                    <span className="text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center gap-1">
                      Selected
                    </span>
                  ) : (
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-600 dark:text-zinc-300 px-4 py-1.5 rounded-full text-xs font-bold">
                      Select
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Limit Reached Modal */}
      <AnimatePresence>
        {showLimitModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-zinc-200 dark:border-zinc-800"
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-6">
                <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                {isAtCreationLimit ? 'Creation Limit Reached' : 'Active Project Limit Reached'}
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 mb-8">
                {isAtCreationLimit 
                  ? `You have reached your annual limit of ${creationLimit} project creations. Please upgrade to Enterprise for unlimited creations.`
                  : `You are currently using all ${projectLimit} of your active project slots. You can archive an existing project to free up a slot, or upgrade your plan.`}
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    setShowLimitModal(false);
                    // Navigate to pricing or trigger upgrade
                  }}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
                >
                  View Upgrade Options
                </button>
                <button 
                  onClick={() => setShowLimitModal(false)}
                  className="w-full py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl font-bold transition-all"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {!showCongrats ? (
                <>
                  <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5, 6, 7].map(s => (
                          <div 
                            key={s} 
                            className={cn(
                              "w-2 h-2 rounded-full transition-all duration-300",
                              s === step ? "bg-indigo-600 w-6" : s < step ? "bg-indigo-200 dark:bg-indigo-900" : "bg-zinc-200 dark:bg-zinc-800"
                            )}
                          />
                        ))}
                      </div>
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                        {step === 1 && "Project Name"}
                        {step === 2 && "Description & Purpose"}
                        {step === 3 && "Focus, Goals & Outcomes"}
                        {step === 4 && "Tools"}
                        {step === 5 && "Taxonomy & Tags"}
                        {step === 6 && "Select Personas"}
                        {step === 7 && "Add Project Team"}
                      </h3>
                    </div>
                    <button onClick={handleCloseModal} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 dark:bg-zinc-800 rounded-full transition-colors">
                      <X className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                    </button>
                  </div>

                  <div className="p-8 overflow-y-auto space-y-6">
                    {step === 1 && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                        <div className="text-center py-4">
                          <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <Sparkles className="w-10 h-10" />
                          </div>
                          <h4 className="text-2xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight">Name your project</h4>
                          <p className="text-zinc-500 dark:text-zinc-400">Give your new project a clear, descriptive name to kick things off.</p>
                        </div>
                        <div className="space-y-2 max-w-md mx-auto">
                          <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Project Name</label>
                          <input 
                            type="text"
                            value={newProject.name}
                            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                            placeholder="e.g. Mobile App Redesign"
                            className="w-full px-6 py-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none text-xl font-bold shadow-sm"
                            autoFocus
                          />
                        </div>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Description</label>
                            <textarea 
                              value={newProject.description}
                              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                              placeholder="Brief overview of what this project is about..."
                              rows={4}
                              className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none resize-none text-sm leading-relaxed"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Purpose</label>
                            <textarea 
                              value={newProject.purpose}
                              onChange={(e) => setNewProject({ ...newProject, purpose: e.target.value })}
                              placeholder="Why are we doing this project? What is the core problem we are solving?"
                              rows={4}
                              className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none resize-none text-sm leading-relaxed"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-2xl flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                          <p className="text-sm text-amber-800 dark:text-amber-300">
                            Don't worry if you don't have all these details yet. You can <span className="font-bold">skip</span> this step and add them later in the Project Charter.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 gap-8">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                Improvement Focus (Metrics)
                                <HelpTooltip content="What key metrics are you trying to improve? (e.g., CSAT, NPS, Churn Rate)." />
                              </label>
                              <button onClick={() => addField('improvementFocus')} className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 text-xs font-bold">
                                <PlusCircle className="w-4 h-4" />
                                Add Metric
                              </button>
                            </div>
                            <div className="space-y-3">
                              {newProject.improvementFocus?.map((focus, idx) => (
                                <div key={idx} className="flex gap-3">
                                  <input 
                                    type="text"
                                    value={focus.metric}
                                    onChange={(e) => updateImprovementFocus(idx, 'metric', e.target.value)}
                                    placeholder="Metric (e.g. CSAT)"
                                    className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-indigo-600 outline-none"
                                  />
                                  <input 
                                    type="text"
                                    value={focus.target}
                                    onChange={(e) => updateImprovementFocus(idx, 'target', e.target.value)}
                                    placeholder="Target (e.g. +15%)"
                                    className="w-1/3 px-4 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-indigo-600 outline-none"
                                  />
                                  {idx > 0 && (
                                    <button onClick={() => removeField('improvementFocus', idx)} className="text-zinc-400 hover:text-rose-500 p-2">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                Goals
                                <HelpTooltip content="What are the high-level objectives of this project?" />
                              </label>
                              <button onClick={() => addField('goals')} className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 text-xs font-bold">
                                <PlusCircle className="w-4 h-4" />
                                Add Goal
                              </button>
                            </div>
                            <div className="space-y-3">
                              {newProject.goals?.map((goal, idx) => (
                                <div key={idx} className="flex gap-3">
                                  <input 
                                    type="text"
                                    value={goal}
                                    onChange={(e) => updateField('goals', idx, e.target.value)}
                                    placeholder={`Goal ${idx + 1}`}
                                    className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-indigo-600 outline-none"
                                  />
                                  {idx > 0 && (
                                    <button onClick={() => removeField('goals', idx)} className="text-zinc-400 hover:text-rose-500 p-2">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                Expected Outcomes
                                <HelpTooltip content="What tangible results do you expect to deliver?" />
                              </label>
                              <button onClick={() => addField('expectedOutcomes')} className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 text-xs font-bold">
                                <PlusCircle className="w-4 h-4" />
                                Add Outcome
                              </button>
                            </div>
                            <div className="space-y-3">
                              {newProject.expectedOutcomes?.map((outcome, idx) => (
                                <div key={idx} className="flex gap-3">
                                  <input 
                                    type="text"
                                    value={outcome}
                                    onChange={(e) => updateField('expectedOutcomes', idx, e.target.value)}
                                    placeholder={`Outcome ${idx + 1}`}
                                    className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-indigo-600 outline-none"
                                  />
                                  {idx > 0 && (
                                    <button onClick={() => removeField('expectedOutcomes', idx)} className="text-zinc-400 hover:text-rose-500 p-2">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 4 && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                        <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100 dark:border-indigo-800/30">
                          <div className="flex items-start gap-4">
                            <div className="mt-1">
                              <input 
                                type="checkbox" 
                                id="useDoubleDiamond"
                                checked={newProject.useDoubleDiamond !== false} 
                                onChange={(e) => setNewProject({...newProject, useDoubleDiamond: e.target.checked})} 
                                className="w-6 h-6 rounded-lg border-indigo-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                              />
                            </div>
                            <div>
                              <label htmlFor="useDoubleDiamond" className="text-lg font-bold text-indigo-900 dark:text-indigo-300 cursor-pointer">
                                Use Double Diamond Stages
                              </label>
                              <p className="text-sm text-indigo-700 dark:text-indigo-400 mt-1 leading-relaxed">
                                Organize your project using the Discover, Define, Develop, and Deliver stages. This provides a structured framework for your improvement journey.
                              </p>
                            </div>
                          </div>
                        </div>

                        {newProject.useDoubleDiamond !== false && (
                          <div className="space-y-3">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                              Initial Status
                              <HelpTooltip position="bottom" content="Select the current phase of your project. 'Discover' for research, 'Define' for scoping, 'Develop' for building, and 'Deliver' for launch." />
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {columns.map(c => (
                                <button
                                  key={c}
                                  onClick={() => setNewProject({ ...newProject, status: c as any })}
                                  className={cn(
                                    "px-4 py-3 rounded-2xl text-sm font-bold border transition-all",
                                    newProject.status === c
                                      ? "bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-500/20"
                                      : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-indigo-300"
                                  )}
                                >
                                  {c}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {step === 5 && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                        <div className="text-center py-4">
                          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Tag className="w-10 h-10" />
                          </div>
                          <h4 className="text-2xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight">Taxonomy & Tags</h4>
                          <p className="text-zinc-500 dark:text-zinc-400">Categorize your project to help with reporting and cross-project analysis.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                              Products
                              <HelpTooltip content="Which products does this project impact? Select from your global taxonomy or add new ones." />
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {products.map(p => {
                                const isSelected = (newProject.products || []).some(pp => pp.id === p.id);
                                return (
                                  <button
                                    key={p.id}
                                    onClick={() => {
                                      const currentProducts = newProject.products || [];
                                      if (isSelected) {
                                        setNewProject({ ...newProject, products: currentProducts.filter(pp => pp.id !== p.id) });
                                      } else {
                                        setNewProject({ ...newProject, products: [...currentProducts, p] });
                                      }
                                    }}
                                    className={cn(
                                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
                                      isSelected 
                                        ? "bg-indigo-600 text-white border-transparent shadow-md" 
                                        : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
                                    )}
                                  >
                                    {p.name}
                                  </button>
                                );
                              })}
                            </div>
                            {setProducts && (
                              <div className="flex gap-2 mt-2">
                                <input
                                  type="text"
                                  value={newProductName}
                                  onChange={(e) => setNewProductName(e.target.value)}
                                  placeholder="Add new product..."
                                  className="flex-1 px-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-indigo-600 outline-none"
                                  onKeyDown={(e) => e.key === 'Enter' && handleAddProduct()}
                                />
                                <button
                                  onClick={handleAddProduct}
                                  disabled={!newProductName.trim()}
                                  className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-sm font-bold disabled:opacity-50"
                                >
                                  Add
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="space-y-4">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                              Services
                              <HelpTooltip content="Which services are involved in this project?" />
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {services.map(s => {
                                const isSelected = (newProject.services || []).some(ss => ss.id === s.id);
                                return (
                                  <button
                                    key={s.id}
                                    onClick={() => {
                                      const currentServices = newProject.services || [];
                                      if (isSelected) {
                                        setNewProject({ ...newProject, services: currentServices.filter(ss => ss.id !== s.id) });
                                      } else {
                                        setNewProject({ ...newProject, services: [...currentServices, s] });
                                      }
                                    }}
                                    className={cn(
                                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
                                      isSelected 
                                        ? "bg-indigo-600 text-white border-transparent shadow-md" 
                                        : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
                                    )}
                                  >
                                    {s.name}
                                  </button>
                                );
                              })}
                            </div>
                            {setServices && (
                              <div className="flex gap-2 mt-2">
                                <input
                                  type="text"
                                  value={newServiceName}
                                  onChange={(e) => setNewServiceName(e.target.value)}
                                  placeholder="Add new service..."
                                  className="flex-1 px-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-indigo-600 outline-none"
                                  onKeyDown={(e) => e.key === 'Enter' && handleAddService()}
                                />
                                <button
                                  onClick={handleAddService}
                                  disabled={!newServiceName.trim()}
                                  className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-sm font-bold disabled:opacity-50"
                                >
                                  Add
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="space-y-4 md:col-span-2">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                Custom Tags
                                <HelpTooltip content="Add any other tags that are relevant to this project for filtering and reporting." />
                              </label>
                              <button onClick={() => addField('taxonomy')} className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 text-xs font-bold">
                                <PlusCircle className="w-4 h-4" />
                                Add Tag
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              {newProject.taxonomy?.map((tag, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 shadow-sm">
                                  <input 
                                    type="text"
                                    value={tag}
                                    onChange={(e) => updateField('taxonomy', idx, e.target.value)}
                                    placeholder="Tag"
                                    className="bg-transparent text-sm font-bold outline-none w-24"
                                  />
                                  <button onClick={() => removeField('taxonomy', idx)} className="text-zinc-400 hover:text-rose-500">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 6 && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                        <div className="text-center py-4">
                          <div className="w-20 h-20 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Users className="w-10 h-10" />
                          </div>
                          <h4 className="text-2xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight">Select Personas</h4>
                          <p className="text-zinc-500 dark:text-zinc-400">Which personas are relevant to this project?</p>
                        </div>

                        <div className="flex justify-center gap-4 mb-6">
                          <button className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-colors">
                            <Briefcase className="w-4 h-4" />
                            Persona Library
                          </button>
                          <button className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                            <PlusCircle className="w-4 h-4" />
                            Create New Persona
                          </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[300px] overflow-y-auto p-2">
                          {personas.map(p => (
                            <button
                              key={p.id}
                              onClick={() => togglePersona(p.id)}
                              className={cn(
                                "p-4 rounded-2xl border-2 transition-all flex flex-col items-center text-center gap-3 relative",
                                selectedPersonas.includes(p.id)
                                  ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                                  : "border-zinc-100 hover:border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                              )}
                            >
                              <img src={p.imageUrl} alt={p.name} className="w-16 h-16 rounded-full object-cover" referrerPolicy="no-referrer" />
                              <div>
                                <p className="text-sm font-bold text-zinc-900 dark:text-white truncate w-full">{p.name}</p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate w-full">{p.role}</p>
                              </div>
                              {selectedPersonas.includes(p.id) && (
                                <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center">
                                  <Check className="w-3 h-3" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {step === 7 && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                        <div className="text-center py-4">
                          <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <UserPlus className="w-10 h-10" />
                          </div>
                          <h4 className="text-2xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight">Add Project Team</h4>
                          <p className="text-zinc-500 dark:text-zinc-400">Select existing users or create new ones for your team.</p>
                        </div>

                        <div className="flex justify-center mb-6">
                          <button className="px-6 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-xl font-bold flex items-center gap-2 transition-colors">
                            <Plus className="w-5 h-5" />
                            Create New User
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto p-2">
                          {/* List of available users */}
                          {users.map(user => {
                            const isSelected = (newProject.team || []).some(m => m.userId === user.id);
                            return (
                              <button
                                key={user.id}
                                onClick={() => {
                                  const currentTeam = newProject.team || [];
                                  if (isSelected) {
                                    setNewProject({ ...newProject, team: currentTeam.filter(m => m.userId !== user.id) });
                                  } else {
                                    setNewProject({ 
                                      ...newProject, 
                                      team: [...currentTeam, {
                                        id: `tm_${Date.now()}`,
                                        userId: user.id,
                                        name: user.name,
                                        photoUrl: user.photoUrl,
                                        jobTitle: user.role,
                                        projectRole: 'Member'
                                      }] 
                                    });
                                  }
                                }}
                                className={cn(
                                  "p-4 rounded-2xl border transition-all flex items-center gap-4 text-left group",
                                  isSelected 
                                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" 
                                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-indigo-500"
                                )}
                              >
                                <img 
                                  src={user.photoUrl} 
                                  alt={user.name} 
                                  className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-zinc-900 dark:text-white truncate">{user.name}</p>
                                  <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                                </div>
                                <div className={cn(
                                  "p-2 rounded-full transition-colors",
                                  isSelected ? "bg-indigo-600 text-white" : "bg-zinc-50 dark:bg-zinc-800 text-zinc-400"
                                )}>
                                  {isSelected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center shrink-0">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5, 6, 7].map(i => (
                        <div key={i} className={cn("h-2 rounded-full transition-all", step === i ? "w-8 bg-indigo-600" : "w-2 bg-zinc-200 dark:bg-zinc-700")} />
                      ))}
                    </div>
                    <div className="flex gap-3">
                      {step > 1 ? (
                        <button 
                          onClick={() => setStep(step - 1)}
                          className="px-4 py-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 dark:bg-zinc-800 rounded-lg transition-colors"
                        >
                          Back
                        </button>
                      ) : (
                        <button 
                          onClick={handleCloseModal}
                          className="px-4 py-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 dark:bg-zinc-800 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                      
                      {step < 5 ? (
                        <>
                          <button 
                            onClick={() => setStep(step + 1)}
                            className="px-4 py-2 text-sm font-semibold text-zinc-400 hover:text-zinc-600 transition-colors"
                          >
                            Skip
                          </button>
                          <button 
                            onClick={() => setStep(step + 1)}
                            disabled={step === 1 && !newProject.name}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors shadow-md"
                          >
                            Next
                          </button>
                        </>
                      ) : step === 5 ? (
                        <>
                          <button 
                            onClick={handleCreateProject}
                            className="px-4 py-2 text-sm font-semibold text-zinc-400 hover:text-zinc-600 transition-colors"
                          >
                            Skip
                          </button>
                          <button 
                            onClick={handleCreateProject}
                            disabled={!newProject.name}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors shadow-md"
                          >
                            Next
                          </button>
                        </>
                      ) : step < 7 ? (
                        <>
                          <button 
                            onClick={() => setStep(step + 1)}
                            className="px-4 py-2 text-sm font-semibold text-zinc-400 hover:text-zinc-600 transition-colors"
                          >
                            Skip
                          </button>
                          <button 
                            onClick={() => setStep(step + 1)}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors shadow-md"
                          >
                            Next
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={handleCompleteSetup}
                          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors shadow-md"
                        >
                          Complete Setup
                        </button>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center space-y-8 animate-in zoom-in-95 duration-500">
                  <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                    <Sparkles className="w-12 h-12" />
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Congratulations!</h2>
                    <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
                      You have now set-up your project. Your journey to improvement starts here.
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      if (createdProjectId) onSelectProject(createdProjectId);
                      handleCloseModal();
                    }}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xl shadow-xl shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Let's get started
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
