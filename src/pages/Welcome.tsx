import React, { useState, useRef } from 'react';
import { ArrowRight, Sparkles, Map, GitMerge, Target, Users, LayoutDashboard, KanbanSquare, BrainCircuit, Info, Plus, ChevronLeft, Zap, Clock, Tags, ShieldAlert, Image, Briefcase, Building2, Check, UsersRound } from 'lucide-react';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { cn } from '../lib/utils';
import { CompanyProfile } from '../components/YourCompany';
import { Persona, Project } from '../types';
import { mockPersonas, mockProjects } from '../data/mockData';

export function Welcome({ onNavigate, onSelectProject, userName, companyProfile, personas = [], projects = [] }: { onNavigate: (tab: string, subTab?: string) => void, onSelectProject: (id: string) => void, userName?: string, companyProfile?: CompanyProfile, personas?: Persona[], projects?: Project[] }) {
  const name = userName || "there";
  const controls = useAnimation();
  const [scrollX, setScrollX] = useState(0);

  const hasCompanyInfo = companyProfile && companyProfile.name && companyProfile.name.trim() !== '';
  const hasPersonas = personas && personas.some(p => !mockPersonas.find(mp => mp.id === p.id));
  const hasProjects = projects && projects.some(p => !mockProjects.find(mp => mp.id === p.id));

  const handleScrollClick = () => {
    const newX = scrollX - 350;
    setScrollX(newX);
    controls.start({ x: newX });
  };

  const globalFeatures = [
    { 
      id: 'taxonomy', 
      label: 'Global Taxonomy', 
      icon: Tags, 
      description: 'Standardize your language and data structures across the entire organization.',
      details: 'Ensure consistency in how you define products, services, and customer interactions.',
      color: 'bg-emerald-500'
    },
    { 
      id: 'personas', 
      label: 'User Personas', 
      icon: Users, 
      description: 'Create research-based profiles to represent your target audience.',
      details: 'Understand who your customers are, what they need, and what drives their behavior.',
      color: 'bg-blue-500'
    },
    { 
      id: 'intelligence', 
      label: 'Intelligence Hub', 
      icon: BrainCircuit, 
      description: 'Centralize customer research and data to drive evidence-based decisions.',
      details: 'Connect real-world feedback to your journey maps and personas for a single source of truth.',
      color: 'bg-indigo-500'
    },
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      description: 'Get a high-level view of your CX performance and project status.',
      details: 'Track key metrics, recent activity, and overall health of your customer experience initiatives.',
      color: 'bg-violet-500'
    }
  ];

  const projectFeatures = [
    { 
      id: 'team', 
      label: 'Project Teams', 
      icon: UsersRound, 
      description: 'Collaborate with cross-functional teams on specific CX initiatives.',
      details: 'Assign roles, track contributions, and ensure the right people are involved.',
      color: 'bg-orange-500'
    },
    { 
      id: 'journeys', 
      label: 'Journey Maps', 
      icon: Map, 
      description: 'Design, analyze, and optimize customer pathways from awareness to advocacy.',
      details: 'Visualize emotional peaks and valleys, identify friction points, and map cross-functional ownership.',
      color: 'bg-amber-500'
    },
    { 
      id: 'kanban', 
      label: 'Kanban Boards', 
      icon: KanbanSquare, 
      description: 'Manage tasks and workflows visually to ensure timely delivery.',
      details: 'Track progress from backlog to done, identifying bottlenecks and optimizing flow.',
      color: 'bg-rose-500'
    },
    { 
      id: 'raid', 
      label: 'RAID Logs', 
      icon: ShieldAlert, 
      description: 'Track Risks, Assumptions, Issues, and Dependencies.',
      details: 'Proactively manage project risks and ensure nothing falls through the cracks.',
      color: 'bg-red-500'
    },
    { 
      id: 'process_maps', 
      label: 'Process Maps', 
      icon: GitMerge, 
      description: 'Align internal operations with the customer experience.',
      details: 'Bridge the gap between what the customer sees and how your back-office systems function.',
      color: 'bg-teal-500'
    }
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-16 pb-24 transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6 py-12"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-bold mb-4 border border-indigo-100 dark:border-indigo-800">
          <Sparkles className="w-4 h-4" />
          Orchestra CI
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight">
          Hello, <span className="text-indigo-600 dark:text-indigo-400">{name}</span>.<br />
          Welcome to the future of customer centric transformation.
        </h1>
        <p className="text-xl text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          The central hub for orchestrating world-class customer experiences through data-driven intelligence, personas, and journey maps.
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-zinc-900 rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl"
      >
        <div className="absolute top-0 right-0 p-32 bg-indigo-500/20 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 p-24 bg-emerald-500/10 rounded-full -translate-x-1/2 translate-y-1/2 blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-indigo-300">
              Get Started
            </div>
            <h3 className="text-4xl font-bold tracking-tight">Your Onboarding Checklist</h3>
            <p className="text-zinc-400 text-lg max-w-md leading-relaxed mb-8">
              Complete these key steps to unlock the full potential of Orchestra CI and start your customer-centric transformation.
            </p>
            
            <div className="space-y-4 w-full max-w-lg">
              {/* Step 1: Company Info */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={cn("p-3 rounded-xl", hasCompanyInfo ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-400")}>
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Setup company information</h4>
                    <p className="text-sm text-zinc-400">Establish your profile for AI insights</p>
                  </div>
                </div>
                <button
                  onClick={() => !hasCompanyInfo && onNavigate('intelligence', 'edit-company')}
                  className={cn(
                    "px-6 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2",
                    hasCompanyInfo 
                      ? "bg-emerald-500/20 text-emerald-400 cursor-default" 
                      : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg"
                  )}
                >
                  {hasCompanyInfo ? (
                    <>
                      <Check className="w-4 h-4" />
                      Completed
                    </>
                  ) : (
                    "Start"
                  )}
                </button>
              </div>

              {/* Step 2: First Persona */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={cn("p-3 rounded-xl", hasPersonas ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-400")}>
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Create your First Persona</h4>
                    <p className="text-sm text-zinc-400">Understand your target audience</p>
                  </div>
                </div>
                <button
                  onClick={() => !hasPersonas && onNavigate('personas', 'new')}
                  className={cn(
                    "px-6 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2",
                    hasPersonas 
                      ? "bg-emerald-500/20 text-emerald-400 cursor-default" 
                      : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg"
                  )}
                >
                  {hasPersonas ? (
                    <>
                      <Check className="w-4 h-4" />
                      Completed
                    </>
                  ) : (
                    "Start"
                  )}
                </button>
              </div>

              {/* Step 3: First Project */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={cn("p-3 rounded-xl", hasProjects ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-400")}>
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Create your first project</h4>
                    <p className="text-sm text-zinc-400">Start building customer experiences</p>
                  </div>
                </div>
                <button
                  onClick={() => !hasProjects && onNavigate('projects', 'new')}
                  className={cn(
                    "px-6 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2",
                    hasProjects 
                      ? "bg-emerald-500/20 text-emerald-400 cursor-default" 
                      : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg"
                  )}
                >
                  {hasProjects ? (
                    <>
                      <Check className="w-4 h-4" />
                      Completed
                    </>
                  ) : (
                    "Start"
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="hidden lg:block relative">
            <div className="w-64 h-64 bg-indigo-600/20 rounded-full animate-pulse blur-2xl absolute inset-0" />
            <div className="relative bg-zinc-800 p-8 rounded-3xl border border-white/10 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
              <LayoutDashboard className="w-32 h-32 text-indigo-400 opacity-50" />
              <div className="absolute -top-4 -right-4 bg-emerald-500 p-4 rounded-2xl shadow-lg -rotate-12">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="space-y-12">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-4">
            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
              <Info className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Global Features</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
            {globalFeatures.map((feature, idx) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <FlipCard feature={feature} index={idx} onNavigate={onNavigate} />
              </motion.div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3 px-4">
            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
              <LayoutDashboard className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Project Features</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
            {projectFeatures.map((feature, idx) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (idx + 3) * 0.1 }}
              >
                <FlipCard feature={feature} index={idx + 3} onNavigate={onNavigate} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FlipCard({ feature, index, onNavigate }: { feature: any, index: number, onNavigate: (tab: string) => void }) {
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
              onNavigate(feature.id);
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


