import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Sparkles, 
  Search, 
  Filter, 
  TrendingUp, 
  Zap, 
  Clock, 
  Target, 
  CheckCircle2, 
  ArrowUpRight, 
  ChevronRight, 
  MessageSquare,
  Users,
  LayoutTemplate,
  Trash2,
  MoreVertical,
  Check,
  X,
  History,
  List
} from 'lucide-react';
import { Persona, PersonaOpportunity, Project, Task } from '../types';
import { cn } from '../lib/utils';
import { useToast } from '../context/ToastContext';
import { v4 as uuidv4 } from 'uuid';

interface OpportunitiesProps {
  personas: Persona[];
  projects: Project[];
  setPersonas: (personas: Persona[] | ((prev: Persona[]) => Persona[])) => void;
  setProjects?: React.Dispatch<React.SetStateAction<Project[]>>;
  setTasks?: React.Dispatch<React.SetStateAction<Task[]>>;
  onNavigate: (tab: string, subTab?: string) => void;
  onAddToAuditLog?: (action: string, details: string, type: any, entityType?: string, entityId?: string, source?: string) => void;
}

export const Opportunities: React.FC<OpportunitiesProps> = ({ 
  personas, 
  projects, 
  setPersonas, 
  setProjects,
  setTasks,
  onNavigate,
  onAddToAuditLog
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterImpact, setFilterImpact] = useState<string>('All');
  const [filterEffort, setFilterEffort] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);
  const [promotingOpp, setPromotingOpp] = useState<any | null>(null);
  const [promotionType, setPromotionType] = useState<'project' | 'task' | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('new');
  const { addToast } = useToast();

  const handlePromoteConfirm = () => {
    if (!promotingOpp) return;
    const opp = promotingOpp;

    if (promotionType === 'project') {
      const newProject: Project = {
        id: `proj_${uuidv4()}`,
        name: opp.title,
        description: opp.description,
        purpose: `Strategic transformation based on ${opp.personaName} feedback.`,
        goals: [opp.title],
        expectedOutcomes: ["Improved customer experience"],
        taxonomy: ["Transformation"],
        status: 'Discover',
        updatedAt: new Date().toISOString()
      };
      setProjects?.(prev => [newProject, ...prev]);
      
      // Update Persona Opportunity
      setPersonas(prev => prev.map(p => {
        if (p.id === opp.personaId) {
          return {
            ...p,
            opportunities: (p.opportunities || []).map(o => 
              o.id === opp.id ? { ...o, status: 'accepted', promotedTo: 'project', destinationId: newProject.id } : o
            )
          };
        }
        return p;
      }));
    } else if (promotionType === 'task') {
      const targetProjectId = selectedProjectId === 'new' ? `proj_${uuidv4()}` : selectedProjectId;
      
      if (selectedProjectId === 'new') {
        const newProject: Project = {
          id: targetProjectId,
          name: `Discovery: ${opp.title}`,
          description: `New project pipeline seeded from persona discovery.`,
          purpose: `Transformation based on ${opp.personaName} roadmap.`,
          goals: [opp.title],
          expectedOutcomes: [],
          taxonomy: ["Discovery"],
          status: 'Discover',
          updatedAt: new Date().toISOString()
        };
        setProjects?.(prev => [newProject, ...prev]);
      }

      const newTask: Task = {
        id: `task_${uuidv4()}`,
        projectId: targetProjectId,
        title: opp.title,
        description: opp.description,
        status: 'Discover',
        kanbanStatus: 'Backlog',
        impact: opp.impact,
        effort: opp.effort,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setTasks?.(prev => [newTask, ...prev]);

      // Update Persona Opportunity
      setPersonas(prev => prev.map(p => {
        if (p.id === opp.personaId) {
          return {
            ...p,
            opportunities: (p.opportunities || []).map(o => 
              o.id === opp.id ? { ...o, status: 'accepted', promotedTo: 'task', destinationId: targetProjectId } : o
            )
          };
        }
        return p;
      }));
    }

    addToast(`${promotionType === 'project' ? 'Project' : 'Task'} promoted successfully`, 'success');
    onAddToAuditLog?.('Discovery Promotion', `"${opp.title}" promoted to ${promotionType}`, 'Create', promotionType === 'project' ? 'Project' : 'Task', 'new', 'Manual');
    setPromotingOpp(null);
    setPromotionType(null);
  };

  // Flatten all opportunities from all personas
  const allOpportunities = useMemo(() => {
    return personas.flatMap(persona => 
      (persona.opportunities || []).map(opp => ({
        ...opp,
        personaName: persona.name,
        personaId: persona.id,
        personaImageUrl: persona.imageUrl
      }))
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [personas]);

  const filteredOpportunities = useMemo(() => {
    return allOpportunities.filter(opp => {
      const matchesSearch = opp.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           opp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           opp.personaName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesImpact = filterImpact === 'All' || opp.impact === filterImpact;
      const matchesEffort = filterEffort === 'All' || opp.effort === filterEffort;
      const matchesStatus = filterStatus === 'All' || opp.status === filterStatus;
      
      return matchesSearch && matchesImpact && matchesEffort && matchesStatus;
    });
  }, [allOpportunities, searchQuery, filterImpact, filterEffort, filterStatus]);

  const stats = useMemo(() => {
    return {
      total: allOpportunities.length,
      accepted: allOpportunities.filter(o => o.status === 'accepted').length,
      pending: allOpportunities.filter(o => o.status === 'pending').length,
      highImpact: allOpportunities.filter(o => o.impact === 'High').length
    };
  }, [allOpportunities]);

  const updateOpportunityStatus = (personaId: string, opportunityId: string, status: 'accepted' | 'rejected' | 'pending') => {
    setPersonas(prev => prev.map(p => {
      if (p.id === personaId) {
        return {
          ...p,
          opportunities: (p.opportunities || []).map(o => o.id === opportunityId ? { ...o, status } : o)
        };
      }
      return p;
    }));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Opportunities</h2>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">Prioritize and promote discovery insights into active pipelines.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 p-2 rounded-2xl flex items-center gap-6 px-4">
            <div className="text-center">
              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Discovered</p>
              <p className="text-lg font-black text-zinc-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="w-px h-8 bg-zinc-100 dark:bg-zinc-800" />
            <div className="text-center">
              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Accepted</p>
              <p className="text-lg font-black text-emerald-500">{stats.accepted}</p>
            </div>
            <div className="w-px h-8 bg-zinc-100 dark:bg-zinc-800" />
            <div className="text-center">
              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">High Impact</p>
              <p className="text-lg font-black text-indigo-500">{stats.highImpact}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text"
            placeholder="Search opportunities or personas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 py-3 pl-10 pr-4 rounded-2xl font-bold text-sm focus:border-indigo-500 transition-all outline-none"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <select 
            value={filterImpact}
            onChange={(e) => setFilterImpact(e.target.value)}
            className="bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 py-3 px-4 rounded-2xl font-bold text-sm outline-none"
          >
            <option value="All">All Impact</option>
            <option value="High">High Impact</option>
            <option value="Medium">Medium Impact</option>
            <option value="Low">Low Impact</option>
          </select>

          <select 
            value={filterEffort}
            onChange={(e) => setFilterEffort(e.target.value)}
            className="bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 py-3 px-4 rounded-2xl font-bold text-sm outline-none"
          >
            <option value="All">All Effort</option>
            <option value="High">High Effort</option>
            <option value="Medium">Medium Effort</option>
            <option value="Low">Low Effort</option>
          </select>

          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 py-3 px-4 rounded-2xl font-bold text-sm outline-none"
          >
            <option value="All">All Status</option>
            <option value="accepted">Accepted</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredOpportunities.map((opp) => (
            <motion.div
              key={`${opp.personaId}-${opp.id}`}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn(
                "group relative bg-white dark:bg-zinc-900 border-2 rounded-[2rem] p-6 transition-all hover:shadow-2xl hover:shadow-indigo-500/10",
                opp.status === 'accepted' ? 'border-emerald-100 dark:border-emerald-900/30' : 
                opp.status === 'rejected' ? 'border-rose-100 dark:border-rose-900/30' : 'border-zinc-100 dark:border-zinc-800'
              )}
            >
              <div className="flex items-top justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <img src={opp.personaImageUrl} alt={opp.personaName} className="w-10 h-10 rounded-xl object-crop border-2 border-white dark:border-zinc-800 shadow-sm" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Persona Context</p>
                    <p className="text-xs font-bold text-zinc-900 dark:text-white">{opp.personaName}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                    opp.impact === 'High' ? 'bg-indigo-100 text-indigo-700' : 'bg-zinc-100 text-zinc-600'
                  )}>
                    {opp.impact} Impact
                  </span>
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                    opp.effort === 'High' ? 'bg-rose-100 text-rose-700' : 
                    opp.effort === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  )}>
                    {opp.effort} Effort
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <h3 className="text-lg font-black text-zinc-900 dark:text-white leading-tight group-hover:text-indigo-600 transition-colors">
                  {opp.title}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-3">
                  {opp.description}
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-50 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-[10px] font-black text-zinc-500">
                      {new Date(opp.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {opp.status === 'pending' ? (
                    <>
                      <button 
                        onClick={() => updateOpportunityStatus(opp.personaId, opp.id, 'rejected')}
                        className="p-2 hover:bg-rose-50 text-zinc-400 hover:text-rose-600 rounded-xl transition-all"
                        title="Reject Opportunity"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => updateOpportunityStatus(opp.personaId, opp.id, 'accepted')}
                        className="p-2 hover:bg-emerald-50 text-zinc-400 hover:text-emerald-600 rounded-xl transition-all"
                        title="Accept Opportunity"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    </>
                  ) : opp.status === 'accepted' ? (
                    <div className="flex items-center gap-2">
                      {!opp.promotedTo ? (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              setPromotingOpp(opp);
                              setPromotionType('project');
                            }}
                            className="bg-indigo-600 text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
                          >
                            + Project
                          </button>
                          <button 
                            onClick={() => {
                              setPromotingOpp(opp);
                              setPromotionType('task');
                            }}
                            className="bg-emerald-600 text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20"
                          >
                            + Task
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-xl border border-emerald-100 dark:border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-black uppercase">{opp.promotedTo} Active</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button 
                      onClick={() => updateOpportunityStatus(opp.personaId, opp.id, 'pending')}
                      className="text-[10px] font-black uppercase text-zinc-400 hover:text-indigo-600 transition-colors"
                    >
                      Undo Dejection
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredOpportunities.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-zinc-300" />
            </div>
            <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2">No transformation items found</h3>
            <p className="text-zinc-500 font-medium">Try discovery mode within a Persona profile to generate new opportunities.</p>
            <button 
              onClick={() => onNavigate('personas')}
              className="mt-8 bg-zinc-900 text-white px-8 py-4 rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-xl"
            >
              Go to Personas
            </button>
          </div>
        )}
      </div>

      {/* Promotion Modal */}
      <AnimatePresence>
        {promotingOpp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-zinc-900 text-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-white/10"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500 rounded-xl">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black tracking-tight">Active Promotion</h3>
                </div>
                <button onClick={() => setPromotingOpp(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1">Observation</p>
                  <p className="text-lg font-bold leading-tight mb-2">{promotingOpp.title}</p>
                  <p className="text-sm text-zinc-400 line-clamp-2 italic">"{promotingOpp.description}"</p>
                </div>

                <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5">
                  <button 
                    onClick={() => setPromotionType('project')}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                      promotionType === 'project' ? "bg-white text-zinc-950 shadow-lg" : "text-zinc-400 hover:text-white"
                    )}
                  >
                    New Project
                  </button>
                  <button 
                    onClick={() => setPromotionType('task')}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                      promotionType === 'task' ? "bg-white text-zinc-950 shadow-lg" : "text-zinc-400 hover:text-white"
                    )}
                  >
                    Task Item
                  </button>
                </div>

                {promotionType === 'task' && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Destination Pipeline</label>
                    <select 
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="w-full bg-white/5 border-2 border-white/10 p-3 rounded-xl font-bold text-sm outline-none focus:border-indigo-500"
                    >
                      <option value="new">+ Seed New Project with Task</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <button 
                  onClick={handlePromoteConfirm}
                  className="w-full bg-white text-zinc-950 py-4 rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2"
                >
                  Confirm Deployment <CheckCircle2 className="w-4 h-4" />
                </button>

                <p className="text-[10px] text-center text-zinc-500 font-bold uppercase tracking-widest">
                  Promoting from {promotingOpp.personaName}'s roadmap
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
