import React, { useState, useMemo } from 'react';
import { mockJourneyMaps, mockProcessMaps, mockTasks } from '../data/mockData';
import { Plus, Folder, Map as MapIcon, MoreVertical, Clock, GitMerge, Target, X, PlusCircle, Trash2, Info, ChevronDown, ChevronUp, Archive, Briefcase, AlertCircle } from 'lucide-react';
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
  onProjectCreated
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
      raidLog: true
    }
  });

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
    setProjects(projects.map(p => p.id === projectId ? { ...p, archived: true } : p));
    if (activeProjectId === projectId) {
      onSelectProject('');
    }
  };

  const handleRestoreProject = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setProjects(projects.map(p => p.id === projectId ? { ...p, archived: false } : p));
  };

  const handleCreateProject = () => {
    const project: Project = {
      id: `proj-${Date.now()}`,
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
      features: newProject.features || { processMaps: true, raidLog: true },
      team: user ? [{
        id: `team-${Date.now()}`,
        name: user.name,
        jobTitle: 'Creator',
        projectRole: 'Project Lead',
        photoUrl: user.photoUrl
      }] : []
    };
    setProjects([project, ...projects]);
    handleCloseModal();
    if (onProjectCreated) onProjectCreated(project.id);
    onSelectProject(project.id);
    setNewProject({
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
        raidLog: true
      }
    });
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
          title="Improvement Projects" 
          description="Manage and track your CX improvement initiatives. Group related journey maps, process maps, and tasks into cohesive projects to drive meaningful change."
        />
      </div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 shrink-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Improvement Projects</h2>
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
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-2">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => { setFilter(f); setShowArchived(false); }}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                  filter === f && !showArchived
                    ? 'bg-zinc-900 text-white shadow-md' 
                    : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800'
                }`}
              >
                {f}
                {f !== 'All' && (
                  <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] ${
                    filter === f && !showArchived ? 'bg-white dark:bg-zinc-900/20 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                  }`}>
                    {projects.filter(p => p.status === f && !p.archived).length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="w-px h-6 bg-zinc-200 mx-2 shrink-0" />
          <button
            onClick={() => { setShowArchived(true); setFilter('All'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
              showArchived
                ? 'bg-zinc-900 text-white shadow-md' 
                : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800'
            }`}
          >
            <Archive className="w-4 h-4" />
            Archived
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-1 pb-4">
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
            const projectJourneys = mockJourneyMaps.filter(j => j.projectId === project.id);
            const projectProcessMaps = mockProcessMaps.filter(pm => pm.projectId === project.id);
            const projectTasks = mockTasks.filter(t => t.projectId === project.id);
            const isActive = activeProjectId === project.id;
            
            return (
              <motion.div 
                layout
                key={project.id} 
                onClick={() => onSelectProject(project.id)}
                className={`bg-white dark:bg-zinc-900 rounded-2xl border transition-all cursor-pointer group flex flex-col md:flex-row md:items-start sm:items-center gap-4 sm:gap-6 p-4 sm:p-6 ${
                  isActive ? 'ring-2 ring-indigo-600 border-transparent shadow-xl' : 'border-zinc-200 dark:border-zinc-800 hover:shadow-lg hover:border-zinc-300'
                }`}
              >
                <div className={`p-3 sm:p-4 rounded-2xl shrink-0 ${isActive ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                  <Folder className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-xl text-zinc-900 dark:text-white truncate">{project.name}</h3>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      project.status === 'Discover' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                      project.status === 'Define' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                      project.status === 'Develop' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                      project.status === 'Deliver' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      'bg-zinc-100 text-zinc-700 border border-zinc-200'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-1 mb-3">{project.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      <MapIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      {projectJourneys.length} Journeys
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      <GitMerge className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      {projectProcessMaps.length} Processes
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      <Target className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      {projectTasks.length} Tasks
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      Updated {new Date(project.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {project.taxonomy && project.taxonomy.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {project.taxonomy.map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-md text-[10px] font-bold uppercase tracking-wider border border-zinc-200 dark:border-zinc-800">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-start gap-3 shrink-0 pt-4 sm:pt-0 border-t sm:border-0 border-zinc-100">
                  <div className="flex items-center gap-2">
                    {canDeleteProject(project) && (
                      <>
                        {project.archived ? (
                          <button 
                            onClick={(e) => handleRestoreProject(e, project.id)}
                            className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                            title="Restore Project"
                          >
                            <Archive className="w-5 h-5" />
                          </button>
                        ) : (
                          <button 
                            onClick={(e) => handleArchiveProject(e, project.id)}
                            className="p-2 text-zinc-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl transition-all"
                            title="Archive Project"
                          >
                            <Archive className="w-5 h-5" />
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
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    <button className="p-2 text-zinc-400 hover:text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 dark:bg-zinc-800 rounded-full transition-all">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                  {isActive ? (
                    <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-indigo-600/20">
                      Active
                    </span>
                  ) : (
                    <button className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-600 dark:text-zinc-300 px-4 py-1.5 rounded-full text-xs font-bold">
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
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between shrink-0">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Create New Project</h3>
                <button onClick={handleCloseModal} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 dark:bg-zinc-800 rounded-full transition-colors">
                  <X className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Project Name</label>
                    <input 
                      type="text"
                      value={newProject.name}
                      onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                      placeholder="e.g. Mobile App Redesign"
                      className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 flex items-center">
                      Initial Status
                      <HelpTooltip position="bottom" content="Select the current phase of your project. 'Discover' for research, 'Define' for scoping, 'Develop' for building, and 'Deliver' for launch." />
                    </label>
                    <select 
                      value={newProject.status}
                      onChange={(e) => setNewProject({ ...newProject, status: e.target.value as any })}
                      className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none"
                    >
                      {columns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Description</label>
                  <textarea 
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    placeholder="Brief overview of what this project is about..."
                    rows={2}
                    className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Purpose</label>
                  <textarea 
                    value={newProject.purpose}
                    onChange={(e) => setNewProject({ ...newProject, purpose: e.target.value })}
                    placeholder="Why are we doing this project?"
                    rows={2}
                    className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 flex items-center">
                        Improvement Focus (Metrics)
                        <HelpTooltip content="What key metrics are you trying to improve? (e.g., CSAT, NPS, Churn Rate). You can add or modify these later." />
                      </label>
                      <button onClick={() => addField('improvementFocus')} className="text-indigo-600 hover:text-indigo-700">
                        <PlusCircle className="w-4 h-4" />
                      </button>
                    </div>
                    {newProject.improvementFocus?.map((focus, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input 
                          type="text"
                          value={focus.metric}
                          onChange={(e) => updateImprovementFocus(idx, 'metric', e.target.value)}
                          placeholder="Metric (e.g. CSAT)"
                          className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-600 outline-none"
                        />
                        <input 
                          type="text"
                          value={focus.target}
                          onChange={(e) => updateImprovementFocus(idx, 'target', e.target.value)}
                          placeholder="Target (e.g. +15%)"
                          className="w-1/3 px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-600 outline-none"
                        />
                        {idx > 0 && (
                          <button onClick={() => removeField('improvementFocus', idx)} className="text-zinc-400 hover:text-rose-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 flex items-center">
                        Goals
                        <HelpTooltip content="What are the high-level objectives of this project? You can add or modify these later." />
                      </label>
                      <button onClick={() => addField('goals')} className="text-indigo-600 hover:text-indigo-700">
                        <PlusCircle className="w-4 h-4" />
                      </button>
                    </div>
                    {newProject.goals?.map((goal, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input 
                          type="text"
                          value={goal}
                          onChange={(e) => updateField('goals', idx, e.target.value)}
                          placeholder={`Goal ${idx + 1}`}
                          className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-600 outline-none"
                        />
                        {idx > 0 && (
                          <button onClick={() => removeField('goals', idx)} className="text-zinc-400 hover:text-rose-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 flex items-center">
                        Expected Outcomes
                        <HelpTooltip content="What tangible results do you expect to deliver? You can add or modify these later." />
                      </label>
                      <button onClick={() => addField('expectedOutcomes')} className="text-indigo-600 hover:text-indigo-700">
                        <PlusCircle className="w-4 h-4" />
                      </button>
                    </div>
                    {newProject.expectedOutcomes?.map((outcome, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input 
                          type="text"
                          value={outcome}
                          onChange={(e) => updateField('expectedOutcomes', idx, e.target.value)}
                          placeholder={`Outcome ${idx + 1}`}
                          className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-600 outline-none"
                        />
                        {idx > 0 && (
                          <button onClick={() => removeField('expectedOutcomes', idx)} className="text-zinc-400 hover:text-rose-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 flex items-center">
                      Project Features
                      <HelpTooltip content="Enable additional tools for this project. Process Maps align internal operations, and RAID Log tracks risks. You can toggle these on or off later from the project page." />
                    </label>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={newProject.features?.processMaps} 
                          onChange={(e) => setNewProject({...newProject, features: {...newProject.features, processMaps: e.target.checked}})} 
                          className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" 
                        />
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Process Maps</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={newProject.features?.raidLog} 
                          onChange={(e) => setNewProject({...newProject, features: {...newProject.features, raidLog: e.target.checked}})} 
                          className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" 
                        />
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">RAID Log</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Products</label>
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
                              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
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
                          placeholder="Add new product to taxonomy..."
                          className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-600 outline-none"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddProduct()}
                        />
                        <button
                          onClick={handleAddProduct}
                          disabled={!newProductName.trim()}
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-sm font-medium disabled:opacity-50"
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Services</label>
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
                              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
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
                          placeholder="Add new service to taxonomy..."
                          className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-600 outline-none"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddService()}
                        />
                        <button
                          onClick={handleAddService}
                          disabled={!newServiceName.trim()}
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-sm font-medium disabled:opacity-50"
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Custom Tags</label>
                      <button onClick={() => addField('taxonomy')} className="text-indigo-600 hover:text-indigo-700">
                        <PlusCircle className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {newProject.taxonomy?.map((tag, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1">
                          <input 
                            type="text"
                            value={tag}
                            onChange={(e) => updateField('taxonomy', idx, e.target.value)}
                            placeholder="Tag"
                            className="bg-transparent text-xs font-medium outline-none w-20"
                          />
                          <button onClick={() => removeField('taxonomy', idx)} className="text-zinc-400 hover:text-rose-500">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-zinc-100 flex justify-end gap-3 shrink-0">
                <button 
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 dark:bg-zinc-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateProject}
                  disabled={!newProject.name}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors shadow-md"
                >
                  Create Project
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
