import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Briefcase, 
  Users, 
  Map, 
  KanbanSquare, 
  Clock, 
  ArrowUpRight, 
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Project, User } from '../types';

interface ProjectDashboardProps {
  projects: Project[];
  currentUser?: User;
  onNavigate: (tab: string, subTab?: string) => void;
  onSelectProject: (id: string) => void;
}

export function ProjectDashboard({ projects, currentUser, onNavigate, onSelectProject }: ProjectDashboardProps) {
  const isAdmin = currentUser?.role === 'Admin';
  // If not admin, filter to projects where user is in team
  const viewableProjects = isAdmin 
    ? projects 
    : projects.filter(p => p.team?.some(member => member.name === currentUser?.name));

  const stats = [
    { label: 'Active Projects', value: viewableProjects.filter(p => p.status !== 'Deliver' && p.status !== 'Done').length, icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Completed', value: viewableProjects.filter(p => p.status === 'Deliver' || p.status === 'Done').length, icon: KanbanSquare, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Upcoming Tasks', value: viewableProjects.length * 5, icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Team Members', value: new Set(viewableProjects.flatMap(p => p.team || []).map(m => m.name)).size, icon: Users, color: 'text-rose-600', bg: 'bg-rose-50' }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight italic uppercase font-sans">
            Project Dashboard
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-sans">
            {isAdmin ? 'System Administrator view - All organization projects' : `Welcome back, ${currentUser?.name}. Viewing your assigned projects.`}
          </p>
        </div>
        <button 
          onClick={() => onNavigate('projects', 'new')}
          className="flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold hover:bg-indigo-600 dark:hover:bg-indigo-400 transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Launch Project
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-2xl", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <div className="flex items-center text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                12%
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">{stat.label}</p>
              <h4 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{stat.value}</h4>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2 font-sans">
            Recent Projects
            <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-black rounded-full uppercase italic font-sans">
              {viewableProjects.length} Total
            </span>
          </h2>
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search projects..." 
                className="pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 w-64"
              />
            </div>
            <button className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-zinc-500 hover:text-zinc-900 transition-colors">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {viewableProjects.map((project, idx) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + (idx * 0.05) }}
              onClick={() => {
                onSelectProject(project.id);
                onNavigate('project_detail');
              }}
              className="group bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-500 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-16 bg-zinc-50 dark:bg-zinc-800 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-indigo-50 group-hover:dark:bg-indigo-900/20 transition-colors" />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center font-black italic">
                    {project.name.charAt(0)}
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                    project.status === 'Deliver' ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"
                  )}>
                    {project.status}
                  </div>
                </div>

                <div className="space-y-1 mb-6 flex-1">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 transition-colors tracking-tight font-sans">
                    {project.name}
                  </h3>
                  <p className="text-sm text-zinc-500 line-clamp-2 leading-relaxed font-sans">
                    {project.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold">
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                    {viewableProjects.length > 3 && (
                      <div className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold">
                        +{viewableProjects.length - 3}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <Map className="w-4 h-4" />
                      <span className="text-xs font-medium">4 Map</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-medium">2d</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* New Project Placeholder */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            onClick={() => onNavigate('projects', 'new')}
            className="rounded-[2.5rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center gap-4 p-8 text-zinc-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all cursor-pointer group"
          >
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-current flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-8 h-8" />
            </div>
            <div className="text-center">
              <p className="font-bold text-lg">New Project</p>
              <p className="text-sm">Kick off a new project</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
