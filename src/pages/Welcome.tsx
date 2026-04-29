import React, { useState, useRef } from 'react';
import { ArrowRight, Sparkles, Map, GitMerge, Target, Users, LayoutDashboard, KanbanSquare, BrainCircuit, Info, Plus, ChevronLeft, Zap, Clock, Tags, ShieldAlert, Image, Briefcase, Building2, Check, UsersRound } from 'lucide-react';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { cn } from '../lib/utils';
import { Logo } from '../components/Logo';
import { CompanyProfile } from '../components/YourCompany';
import { Persona, Project, IntelligenceSignal } from '../types';
import { mockPersonas, mockProjects } from '../data/mockData';

export function Welcome({ 
  onNavigate, 
  onSelectProject, 
  userName, 
  companyProfile, 
  personas = [], 
  projects = [],
  signals = [],
  activeModule,
  setActiveModule
}: { 
  onNavigate: (tab: string, subTab?: string) => void, 
  onSelectProject: (id: string) => void, 
  userName?: string, 
  companyProfile?: CompanyProfile, 
  personas?: Persona[], 
  projects?: Project[],
  signals?: IntelligenceSignal[],
  activeModule: string,
  setActiveModule: (module: any) => void
}) {
  const name = userName || "there";
  const controls = useAnimation();
  
  const hasCompanyInfo = companyProfile && companyProfile.name && companyProfile.name.trim() !== '';
  const hasPersonas = personas && personas.some(p => !mockPersonas.find(mp => mp.id === p.id));
  const hasProjects = projects && projects.some(p => !mockProjects.find(mp => mp.id === p.id));
  const hasSignals = signals && signals.length > 5; // Assuming mock signals total is roughly 3-5

  const launchpads = [
    {
      id: 'intelligence',
      title: 'Intelligence',
      icon: BrainCircuit,
      description: 'AI-driven synthesis of signals, reviews, and strategic opportunities.',
      color: 'from-indigo-600 to-purple-600',
      iconColor: 'text-indigo-400',
      defaultTab: 'intelligence',
      metrics: `${signals.length} Active Signals`
    },
    {
      id: 'customers',
      title: 'Customers',
      icon: Users,
      description: 'Research-backed personas and stakeholder ecosystems.',
      color: 'from-emerald-600 to-teal-600',
      iconColor: 'text-emerald-400',
      defaultTab: 'personas',
      metrics: `${personas.length} Persona Profiles`
    },
    {
      id: 'projects',
      title: 'Projects',
      icon: Briefcase,
      description: 'Strategic roadmap execution, journey maps, and Kanban boards.',
      color: 'from-amber-600 to-orange-600',
      iconColor: 'text-amber-400',
      defaultTab: 'project_dashboard',
      metrics: `${projects.length} Management Hubs`
    }
  ];

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-16 pb-24 transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6 pt-12 pb-6"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-bold mb-4 border border-indigo-100 dark:border-indigo-800">
          <Sparkles className="w-4 h-4" />
          Orchestra CI
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight font-sans">
          Hello, <span className="text-indigo-600 dark:text-indigo-400">{name}</span>.<br />
          Where would you like to focus today?
        </h1>
      </motion.div>

      {(!hasCompanyInfo || (hasCompanyInfo && !hasPersonas) || (hasCompanyInfo && hasPersonas && !hasProjects)) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-4 overflow-hidden relative group"
        >
          <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                {!hasCompanyInfo ? <Building2 className="w-8 h-8" /> : !hasPersonas ? <Users className="w-8 h-8" /> : <Briefcase className="w-8 h-8" />}
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white font-sans italic uppercase tracking-tight">
                  {!hasCompanyInfo ? "Set-up your company information" : !hasPersonas ? "Create Customer Personas" : "Launch Your First Initiative"}
                </h3>
                <p className="text-zinc-500 dark:text-zinc-400 max-w-md">
                  {!hasCompanyInfo 
                    ? "Establish your company profile to enable AI-powered insights and standardized reporting."
                    : !hasPersonas 
                      ? "Create research-based personas to better understand your target audience and map their needs."
                      : "Start your first project to begin mapping customer journeys and managing strategic initiatives."}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (!hasCompanyInfo) {
                  onNavigate('intelligence', 'edit-company');
                } else if (!hasPersonas) {
                  onNavigate('personas', 'new');
                } else {
                  setActiveModule('projects');
                  onNavigate('projects', 'new');
                }
              }}
              className="px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black uppercase italic tracking-tighter hover:bg-indigo-600 dark:hover:bg-indigo-400 transition-all flex items-center gap-2 group/btn shadow-lg"
            >
              {!hasCompanyInfo ? "Setup Profile" : !hasPersonas ? "Create Persona" : "Start Project"}
              <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
        {launchpads.map((lp, idx) => (
          <motion.div
            key={lp.id}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => {
              setActiveModule(lp.id);
              onNavigate(lp.defaultTab);
            }}
            className="group relative cursor-pointer"
          >
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl blur-2xl",
              lp.color
            )} />
            <div className="relative bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 flex flex-col h-full shadow-xl transition-transform group-hover:-translate-y-2">
              <div className={cn(
                "w-16 h-16 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center mb-8 border border-zinc-100 dark:border-zinc-700 transition-all group-hover:scale-110",
                lp.iconColor
              )}>
                <lp.icon className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-black text-zinc-900 dark:text-white mb-4 italic uppercase tracking-tighter font-sans">
                {lp.title}
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed mb-12 flex-1">
                {lp.description}
              </p>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  {lp.metrics}
                </span>
                <div className="w-10 h-10 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center transition-transform group-hover:rotate-45 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-400 group-hover:text-white">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Access or Recently Active Projects section */}
      <div className="pt-12 px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Briefcase className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight italic font-sans">Jump Back In</h2>
          </div>
          <button 
            onClick={() => {
              setActiveModule('projects');
              onNavigate('projects');
            }}
            className="text-sm font-bold text-indigo-600 hover:text-indigo-500 transition-colors font-sans"
          >
            View all projects
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.slice(0, 3).map((project, idx) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + (idx * 0.1) }}
              onClick={() => {
                onSelectProject(project.id);
                setActiveModule('projects');
                onNavigate('project_detail');
              }}
              className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-500 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-700">
                  <Building2 className="w-6 h-6 text-indigo-600" />
                </div>
                <div className={cn(
                  "px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest",
                  project.status === 'Deliver' ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"
                )}>
                  {project.status}
                </div>
              </div>
              <h4 className="font-bold text-zinc-900 dark:text-white mb-2 group-hover:text-indigo-600 transition-colors">{project.name}</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">{project.description}</p>
            </motion.div>
          ))}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            onClick={() => {
              setActiveModule('projects');
              onNavigate('projects', 'new');
            }}
            className="p-6 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center gap-3 text-zinc-400 hover:border-indigo-300 hover:text-indigo-500 transition-all group"
          >
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-current flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold">Launch New Project</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function FlipCard({ feature, index, onNavigate }: { feature: any, index: number, onNavigate: (tab: string, subTab?: string) => void }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="h-72 perspective-1000 group cursor-pointer touch-manipulation relative"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div 
        className="relative w-full h-full transition-all duration-500 preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {/* Front */}
        <div className="absolute inset-0 backface-hidden bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center text-center gap-4 group-hover:border-indigo-300 dark:group-hover:border-indigo-500 group-hover:shadow-lg transition-all">
          <div className={`p-4 rounded-2xl ${feature.color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
            <feature.icon className="w-8 h-8" />
          </div>
          <h4 className="font-bold text-zinc-900 dark:text-white text-lg">{feature.label}</h4>
          <p className="text-sm md:text-xs text-zinc-600 md:text-zinc-500 dark:text-zinc-300 md:dark:text-zinc-400 leading-relaxed px-4">{feature.description}</p>
          <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-indigo-600 md:text-indigo-500 dark:text-indigo-400 flex items-center gap-1 opacity-100 md:opacity-60 group-hover:opacity-100 transition-opacity">
            <span>Click to learn more</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
          
          {/* Mobile indicator */}
          <div className="md:hidden absolute bottom-4 right-4 p-2 bg-zinc-50 dark:bg-zinc-800 rounded-full border border-zinc-100 dark:border-zinc-700">
            <BrainCircuit className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          </div>
        </div>

        {/* Back */}
        <div 
          className="absolute inset-0 backface-hidden bg-indigo-600 dark:bg-indigo-900 rounded-2xl p-8 text-white flex flex-col items-center justify-center text-center gap-4 shadow-xl"
          style={{ transform: 'rotateY(180deg)' }}
        >
          <h4 className="font-bold text-white text-lg">Why it matters</h4>
          <p className="text-base md:text-sm text-white md:text-indigo-50 dark:text-indigo-100 leading-relaxed">{feature.details}</p>
          <div className="mt-4 text-[10px] font-bold uppercase tracking-widest text-indigo-200 md:text-indigo-300 dark:text-indigo-400 flex items-center gap-1">
            <ChevronLeft className="w-3 h-3" />
            Click to flip back
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (feature.id === 'taxonomy') {
                onNavigate('settings', 'taxonomy');
              } else {
                onNavigate(feature.id);
              }
            }}
            className="mt-2 text-sm md:text-xs font-bold text-white hover:text-indigo-200 underline decoration-indigo-400 underline-offset-4 transition-colors"
          >
            Want to try {feature.label} out now?
          </button>
        </div>
      </motion.div>
    </div>
  );
}


