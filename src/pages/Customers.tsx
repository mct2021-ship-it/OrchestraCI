import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  UserCircle, 
  Heart, 
  BrainCircuit, 
  TrendingUp, 
  MessageSquare, 
  ArrowRight, 
  Target, 
  Sparkles,
  PieChart,
  Layers,
  Search,
  Filter,
  Plus,
  Globe,
  RefreshCw,
  X,
  List
} from 'lucide-react';
import { Persona, IntelligenceSignal, Project, Task, Segment, Product, Service, PersonaOpportunity } from '../types';
import { cn } from '../lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '../context/ToastContext';

interface CustomersProps {
  personas: Persona[];
  setPersonas: React.Dispatch<React.SetStateAction<Persona[]>>;
  signals: IntelligenceSignal[];
  onNavigate: (tab: string, subTab?: string) => void;
  onSelectPersona?: (id: string) => void;
  selectedPersonaId?: string | null;
  projects?: Project[];
  setProjects?: React.Dispatch<React.SetStateAction<Project[]>>;
  setTasks?: React.Dispatch<React.SetStateAction<Task[]>>;
  segments?: Segment[];
  products?: Product[];
  services?: Service[];
}

export function Customers({ 
  personas, 
  setPersonas, 
  signals, 
  onNavigate, 
  onSelectPersona, 
  projects = [], 
  setProjects, 
  setTasks, 
  segments = [], 
  products = [], 
  services = [] 
}: CustomersProps) {
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'opportunities' | 'segments'>('overview');
  const [promotingOpportunity, setPromotingOpportunity] = useState<string | null>(null);
  const [promotionType, setPromotionType] = useState<'project' | 'task' | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('new');

  const allOpportunities = personas.flatMap(p => (p.opportunities || []).map(o => ({ ...o, personaName: p.name, personaId: p.id })));
  const filteredOpportunities = allOpportunities.filter(o => 
    o.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    o.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.personaName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const sortedOpportunities = [...filteredOpportunities].sort((a, b) => b.votes.length - a.votes.length);
  const acceptedOpps = allOpportunities.filter(o => o.status === 'accepted');
  const pendingOpps = allOpportunities.filter(o => o.status === 'pending');

  const handlePromote = (personaId: string, opp: PersonaOpportunity) => {
    if (promotionType === 'project') {
      const newProject: Project = {
        id: `proj_${uuidv4()}`,
        name: opp.title,
        description: opp.description,
        purpose: `Strategic transformation seeded from Customer Hub.`,
        goals: [opp.title],
        expectedOutcomes: ["Value realization"],
        taxonomy: ["Transformation"],
        status: 'Discover',
        updatedAt: new Date().toISOString()
      };
      setProjects?.(prev => [newProject, ...prev]);
      
      // Update Persona Opportunity
      setPersonas(prev => prev.map(p => {
        if (p.id === personaId) {
          return {
            ...p,
            opportunities: (p.opportunities || []).map(o => 
              o.id === opp.id ? { ...o, status: 'accepted', promotedTo: 'project', destinationId: newProject.id } : o
            )
          };
        }
        return p;
      }));
      addToast('Project created successfully', 'success');
    } else if (promotionType === 'task') {
      const targetProjectId = selectedProjectId === 'new' ? `proj_${uuidv4()}` : selectedProjectId;
      
      if (selectedProjectId === 'new') {
        const newProject: Project = {
          id: targetProjectId,
          name: `Pipeline: ${opp.title}`,
          description: `Automatically created project container.`,
          purpose: `Task-driven exploration.`,
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

      setPersonas(prev => prev.map(p => {
        if (p.id === personaId) {
          return {
            ...p,
            opportunities: (p.opportunities || []).map(o => 
              o.id === opp.id ? { ...o, status: 'accepted', promotedTo: 'task', destinationId: targetProjectId } : o
            )
          };
        }
        return p;
      }));
      addToast('Task added to backlog', 'success');
    }
    setPromotingOpportunity(null);
  };

  const stats = [
    { label: 'Total Personas', value: personas.length, icon: UserCircle, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { label: 'Customer Signals', value: signals.length, icon: BrainCircuit, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Pending Opps', value: pendingOpps.length, icon: Target, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Accepted Opps', value: acceptedOpps.length, icon: Sparkles, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  ];

  const tools = [
    {
      id: 'personas',
      title: 'Personas',
      description: 'Manage and evolve your behavioral archetypes based on real-world intelligence.',
      icon: Users,
      count: personas.length,
      action: () => onNavigate('personas'),
      color: 'bg-indigo-500',
    },
    {
      id: 'empathy',
      title: 'Empathy Mapping',
      description: 'Deep dive into customer feelings, thoughts, and behaviors across your library.',
      icon: Heart,
      action: () => onNavigate('personas'),
      color: 'bg-rose-500',
    },
    {
      id: 'stakeholders',
      title: 'Stakeholder Hub',
      description: 'Manage executive sponsors, partners, and internal champions.',
      icon: Globe,
      action: () => onNavigate('stakeholders'),
      color: 'bg-indigo-600',
    },
    {
      id: 'segments',
      title: 'Segment Analysis',
      description: 'Analyze market segments and demographic distribution for targeted strategy.',
      icon: PieChart,
      isPro: true,
      color: 'bg-emerald-500',
    },
    {
      id: 'voc',
      title: 'VOC Dashboard',
      description: 'Aggregated view of customer feedback, complaints, and praises.',
      icon: MessageSquare,
      action: () => onNavigate('intelligence'),
      color: 'bg-amber-500',
    }
  ];

  const filteredPersonas = personas.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-[1440px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-white uppercase italic tracking-tight flex items-center gap-3">
            Customer Hub
            <span className="text-sm not-italic font-bold bg-indigo-600 text-white px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-indigo-500/20">
              Intelligence
            </span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 max-w-xl">
            The central engine for customer understanding. Orchestrate personas, map empathy, and monitor live signals across your entire project ecosystem.
          </p>
        </div>
        <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-700">
          <button 
            onClick={() => setActiveTab('overview')} 
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all",
              activeTab === 'overview' ? "bg-white dark:bg-zinc-900 text-indigo-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
            )}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('segments')} 
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all",
              activeTab === 'segments' ? "bg-white dark:bg-zinc-900 text-indigo-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
            )}
          >
            Segments
          </button>
          <button 
            onClick={() => setActiveTab('opportunities')} 
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all",
              activeTab === 'opportunities' ? "bg-white dark:bg-zinc-900 text-indigo-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
            )}
          >
            Opportunities
          </button>
          <button onClick={() => onNavigate('personas')} className="px-6 py-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 text-sm font-bold">Personas</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", stat.bg)}>
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest leading-none mb-1">{stat.label}</p>
            <p className="text-2xl font-black text-zinc-900 dark:text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {activeTab === 'segments' ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {segments.map(segment => (
                 <div key={segment.id} className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all group">
                    <div className="flex items-center justify-between mb-6">
                       <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center">
                          <Users className="w-6 h-6 text-indigo-600" />
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Personas</p>
                          <p className="text-xl font-black text-zinc-900 dark:text-white">
                             {personas.filter(p => p.segmentId === segment.id).length}
                          </p>
                       </div>
                    </div>
                    <h4 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{segment.name}</h4>
                    <p className="text-sm text-zinc-500 mb-6 font-medium leading-relaxed">
                       Consolidated strategic view for the {segment.name} segment archetypes. 
                    </p>
                    <div className="space-y-3">
                       {personas.filter(p => p.segmentId === segment.id).slice(0, 3).map(p => (
                          <button 
                             key={p.id}
                             onClick={() => {
                                onSelectPersona?.(p.id);
                                onNavigate('personas');
                             }}
                             className="w-full flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition-all border border-transparent hover:border-zinc-200 group/item"
                          >
                             <img src={p.imageUrl} className="w-8 h-8 rounded-lg object-cover" />
                             <div className="flex-1 text-left">
                                <p className="text-xs font-bold text-zinc-900 dark:text-white group-hover/item:text-indigo-600 transition-colors uppercase italic">{p.name}</p>
                                <p className="text-[8px] text-zinc-400 font-black uppercase tracking-widest">{p.role}</p>
                             </div>
                             <ArrowRight className="w-4 h-4 text-zinc-300 opacity-0 group-hover/item:opacity-100 transition-all" />
                          </button>
                       ))}
                       {personas.filter(p => p.segmentId === segment.id).length === 0 && (
                         <div className="py-8 text-center bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-dashed border-zinc-100 dark:border-zinc-800">
                           <p className="text-[10px] font-black text-zinc-400 uppercase">No personas mapped</p>
                         </div>
                       )}
                    </div>
                 </div>
              ))}
           </div>
        </div>
      ) : activeTab === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Hub Tools */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Core Customer Tools
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {tools.map((tool) => (
                <motion.button
                  key={tool.id}
                  whileHover={{ y: -4 }}
                  onClick={tool.action}
                  className="text-left bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:border-indigo-500/50 transition-all group relative overflow-hidden"
                >
                  <div className={cn("absolute top-0 right-0 w-32 h-32 opacity-5 rounded-full -translate-y-8 translate-x-8 transition-transform group-hover:scale-125", tool.color)} />
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg", tool.color)}>
                    <tool.icon className="w-7 h-7" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xl font-bold text-zinc-900 dark:text-white">{tool.title}</h4>
                      {tool.isPro && (
                        <span className="text-[8px] font-black bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-sm uppercase tracking-widest">PRO</span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-500 leading-relaxed font-medium">
                      {tool.description}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center justify-between">
                     <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                       {tool.count !== undefined ? `${tool.count} Assets` : 'Connect Live'}
                     </div>
                     <ArrowRight className="w-5 h-5 text-indigo-600 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all" />
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Featured Persona Slice */}
            <div className="bg-white dark:bg-zinc-900 rounded-[3rem] border-2 border-indigo-500/30 overflow-hidden shadow-2xl shadow-indigo-500/10 group relative">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(79,70,229,0.1),transparent)]" />
               <div className="flex flex-col lg:flex-row items-stretch min-h-[320px]">
                  <div className="lg:w-2/5 p-10 bg-indigo-600 text-white flex flex-col justify-center space-y-6 relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-24 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl group-hover:scale-125 transition-transform duration-1000" />
                     <div className="flex items-center gap-3 relative z-10">
                       <Sparkles className="w-8 h-8 text-indigo-200 animate-pulse" />
                       <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">Orchestra Core</p>
                     </div>
                     <h4 className="text-4xl font-black uppercase italic tracking-tighter leading-[0.9] relative z-10">Evolve with AI Intelligence</h4>
                     <p className="text-indigo-100 text-sm font-medium leading-relaxed relative z-10">
                        Sync live customer signals directly into your persona archetypes to prevent profile stagnation.
                     </p>
                  </div>
                  <div className="flex-1 p-10 bg-white dark:bg-zinc-900 group relative flex flex-col justify-center">
                     <div className="flex flex-col sm:flex-row items-center gap-8">
                        <div className="flex -space-x-8 shrink-0">
                          {personas.slice(0, 4).map((p, i) => (
                            <div key={i} className="relative group/persona">
                              <div className="w-16 h-16 rounded-[1.5rem] border-4 border-white dark:border-zinc-900 overflow-hidden shadow-xl transition-all group-hover/persona:-translate-y-2 group-hover/persona:rotate-6 group-hover/persona:z-10 group-hover/persona:scale-110">
                                 <img src={p.imageUrl} className="w-full h-full object-cover" alt={p.name} />
                              </div>
                            </div>
                          ))}
                          {personas.length > 4 && (
                            <div className="w-16 h-16 rounded-[1.5rem] border-4 border-white dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-black text-indigo-600 shadow-xl">
                              +{personas.length - 4}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-4">
                           <div className="space-y-1">
                              <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Active Synchronization</p>
                              <p className="text-xl font-bold text-zinc-900 dark:text-white leading-tight italic">"{signals.length} live intelligence signals detected from all sources"</p>
                           </div>
                           <button 
                             onClick={() => onNavigate('personas')}
                             className="bg-zinc-900 dark:bg-indigo-600 hover:bg-black dark:hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95 flex items-center gap-3"
                           >
                             <RefreshCw className="w-5 h-5" />
                             Synchronize Now
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Sidebar: Activity & Search */}
          <div className="space-y-8">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
              <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                <Search className="w-4 h-4" />
                Quick Find
              </h3>
              <div className="relative">
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search personas..."
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all pl-10"
                />
                <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>

              <div className="space-y-3">
                {filteredPersonas.slice(0, 5).map(p => (
                  <button
                    key={p.id}
                    onClick={() => onSelectPersona?.(p.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all group"
                  >
                    <img src={p.imageUrl} className="w-10 h-10 rounded-xl object-cover grayscale group-hover:grayscale-0 transition-all" alt="" />
                    <div className="text-left">
                      <p className="text-sm font-bold text-zinc-900 dark:text-white leading-tight">{p.name}</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-tight">{p.role}</p>
                    </div>
                  </button>
                ))}
                {filteredPersonas.length === 0 && (
                  <p className="text-center text-xs text-zinc-500 py-4 italic">No matches found</p>
                )}
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900/40 p-8 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 space-y-6">
               <div className="text-center space-y-4">
                  <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                     <Target className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                     <h4 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight">Insight Generator</h4>
                     <p className="text-xs text-zinc-500 mt-1">Struggling to define your customer base?</p>
                  </div>
                  <button 
                    onClick={() => onNavigate('personas')}
                    className="w-full py-3 bg-zinc-900 dark:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-3 h-3" />
                    Generate with AI
                  </button>
               </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">Strategic Opportunities</h3>
                  <p className="text-zinc-500 font-medium">Prioritize transformation projects based on customer persona needs.</p>
                </div>
                <div className="flex items-center gap-4">
                   <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
                      <span className="px-4 py-1.5 text-[10px] font-black uppercase text-zinc-400">Total: {allOpportunities.length}</span>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
                 {promotingOpportunity && (
                   <motion.div 
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                   >
                     <div className="bg-indigo-900 w-full max-w-md rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl" />
                        <div className="flex items-center justify-between mb-8 relative z-10">
                           <h5 className="text-xl font-black uppercase italic italic">Seeding Strategy</h5>
                           <button onClick={() => setPromotingOpportunity(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                              <X className="w-5 h-5" />
                           </button>
                        </div>

                        <div className="space-y-6 relative z-10">
                           <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-1">Target Concept</p>
                              <p className="text-sm font-bold">
                                {allOpportunities.find(o => o.id === promotingOpportunity)?.title}
                              </p>
                           </div>

                           <div className="grid grid-cols-2 gap-4">
                              <button 
                                onClick={() => setPromotionType('project')}
                                className={cn(
                                  "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                                  promotionType === 'project' ? "bg-white text-indigo-900 border-white" : "bg-white/5 border-white/10 hover:border-white/30"
                                )}
                              >
                                <Sparkles className="w-6 h-6" />
                                <span className="text-[10px] font-black uppercase">Project</span>
                              </button>
                              <button 
                                onClick={() => setPromotionType('task')}
                                className={cn(
                                  "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                                  promotionType === 'task' ? "bg-white text-indigo-900 border-white" : "bg-white/5 border-white/10 hover:border-white/30"
                                )}
                              >
                                <List className="w-6 h-6" />
                                <span className="text-[10px] font-black uppercase">Task</span>
                              </button>
                           </div>

                           {promotionType === 'task' && (
                              <div className="space-y-3">
                                 <label className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Select Roadmap</label>
                                 <select 
                                   value={selectedProjectId}
                                   onChange={(e) => setSelectedProjectId(e.target.value)}
                                   className="w-full bg-indigo-800 border-2 border-indigo-700 p-4 rounded-2xl font-bold text-sm outline-none focus:border-white transition-all appearance-none"
                                 >
                                   <option value="new">+ NEW TRANSFORMATION PIPELINE</option>
                                   {projects.map(p => (
                                     <option key={p.id} value={p.id}>{p.name}</option>
                                   ))}
                                 </select>
                              </div>
                           )}

                           {promotionType && (
                             <button 
                               onClick={() => {
                                 const opp = allOpportunities.find(o => o.id === promotingOpportunity);
                                 if (opp) handlePromote(opp.personaId, opp);
                               }}
                               className="w-full bg-indigo-500 hover:bg-indigo-400 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-indigo-500/40"
                             >
                               Confirm Execution
                             </button>
                           )}
                        </div>
                     </div>
                   </motion.div>
                 )}

                 {sortedOpportunities.map((opp) => (
                   <div key={opp.id} className="bg-zinc-50 dark:bg-zinc-800/50 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 hover:border-indigo-500/50 transition-all group flex flex-col shadow-sm hover:shadow-xl hover:shadow-indigo-500/5">
                      <div className="flex items-center justify-between mb-6">
                        <div className={cn(
                          "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                          opp.status === 'accepted' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                        )}>
                          {opp.status}
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="flex -space-x-2">
                             {opp.votes.slice(0, 3).map((v, idx) => (
                               <div key={idx} className="w-6 h-6 rounded-full border-2 border-white dark:border-zinc-800 bg-zinc-200 dark:bg-zinc-700" />
                             ))}
                           </div>
                           <span className="text-[10px] font-black text-zinc-400">{opp.votes.length} Votes</span>
                        </div>
                      </div>

                      <div className="flex-1 space-y-4">
                        <h4 className="text-xl font-black text-zinc-900 dark:text-white leading-tight">{opp.title}</h4>
                        <p className="text-sm text-zinc-500 font-medium leading-relaxed line-clamp-3">{opp.description}</p>
                        
                        <div className="flex flex-wrap gap-2">
                           <div className="px-3 py-1 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg text-[8px] font-black uppercase tracking-widest text-zinc-400">
                             Impact: <span className={cn(opp.impact === 'High' ? "text-indigo-600" : "text-zinc-500")}>{opp.impact}</span>
                           </div>
                           <div className="px-3 py-1 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg text-[8px] font-black uppercase tracking-widest text-zinc-400">
                             Effort: <span className={cn(opp.effort === 'High' ? "text-rose-600" : "text-zinc-500")}>{opp.effort}</span>
                           </div>
                        </div>
                      </div>
                      
                      <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <img 
                              src={personas.find(p => p.id === opp.personaId)?.imageUrl} 
                              className="w-10 h-10 rounded-2xl object-cover border-2 border-white dark:border-zinc-800 shadow-md group-hover:scale-110 transition-transform" 
                              alt={opp.personaName}
                            />
                            <div>
                               <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Source Archetype</p>
                               <button 
                                 onClick={() => {
                                   onSelectPersona?.(opp.personaId);
                                   onNavigate('personas');
                                 }}
                                 className="text-xs font-black text-zinc-900 dark:text-zinc-200 hover:text-indigo-600 transition-colors uppercase italic"
                               >
                                 {opp.personaName}
                               </button>
                            </div>
                         </div>
                         <div className="flex items-center gap-2">
                            {opp.status === 'pending' && (
                              <button 
                                onClick={() => {
                                  setPromotingOpportunity(opp.id);
                                  setPromotionType('project');
                                }}
                                className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
                                title="Promote to Project"
                              >
                                <Sparkles className="w-5 h-5" />
                              </button>
                            )}
                            <button 
                               onClick={() => {
                                 onSelectPersona?.(opp.personaId);
                                 onNavigate('personas');
                                 setTimeout(() => {
                                   // We don't have direct path to 'opportunities' view in App.tsx routing yet, 
                                   // but Personas.tsx handles selected persona ID.
                                 }, 100);
                               }}
                               className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 hover:text-indigo-600 border border-zinc-100 dark:border-zinc-800 transition-all shadow-sm"
                             >
                               <ArrowRight className="w-5 h-5" />
                             </button>
                         </div>
                      </div>
                   </div>
                 ))}
                 {allOpportunities.length === 0 && (
                   <div className="col-span-full py-24 text-center">
                      <Target className="w-16 h-16 text-zinc-200 dark:text-zinc-800 mx-auto mb-4" />
                      <p className="text-zinc-400 font-bold">No opportunities discovered yet.</p>
                      <p className="text-xs text-zinc-500 mt-1 italic">Run AI analysis on your personas to generate strategic insights.</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
