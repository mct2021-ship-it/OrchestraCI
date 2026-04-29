import React, { useMemo } from 'react';
import { LayoutDashboard, Users, Map, Target, GitMerge, Sparkles, Menu, X as CloseIcon, Settings, BrainCircuit, Shield, Building2, Activity, LayoutList, Briefcase, FileText, UsersRound, KanbanSquare, MonitorSmartphone, Calendar, MessageSquare, Bell, Layers, Leaf, Tags, BarChart3, Home, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { usePlan } from '../context/PlanContext';
import { useAuth } from '../context/AuthContext';
import { CompanyProfile } from './YourCompany';
import { Project, AppModule } from '../types';
import { Logo } from './Logo';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
  activeProject?: Project | null;
  isDarkMode?: boolean;
  companyProfile?: CompanyProfile;
  onOpenFeedback?: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
  activeModule: AppModule;
}

export function Sidebar({ currentTab, setCurrentTab, isOpen, onClose, activeProject, isDarkMode, companyProfile, onOpenFeedback, onOpenNotifications, unreadNotificationsCount = 0, activeModule }: SidebarProps) {
  const { plan } = usePlan();
  const { user } = useAuth();

  const overviewNav = [
    { id: 'dashboard', label: 'Global Overview', icon: LayoutDashboard, color: 'text-cyan-500' },
    { id: 'single_view_of_change', label: 'Single View of Change', icon: GitMerge, color: 'text-indigo-500' },
    { id: 'decarb', label: 'Decarb Dashboard', icon: Leaf, color: 'text-emerald-500' },
  ];

  const hasCompanyInfo = companyProfile && companyProfile.name && companyProfile.name.trim() !== '';

  const intelligenceNav = [
    { id: 'intelligence', label: 'Overview', icon: BrainCircuit, color: 'text-zinc-500' },
    { id: 'profile', label: 'Company Profile', icon: Building2, color: 'text-zinc-500', notify: !hasCompanyInfo },
    { id: 'portfolio', label: 'Product Portfolio', icon: Layers, color: 'text-zinc-500' },
    { id: 'reviews', label: 'Intelligence Hub', icon: Sparkles, color: 'text-purple-500', badge: 'Pro' },
    { id: 'connectors', label: 'Connectors', icon: RefreshCw, color: 'text-purple-500', badge: 'Pro' }
  ];

  const customersNav = [
    { id: 'customers', label: 'Customer Hub', icon: Activity, color: 'text-indigo-600' },
    { id: 'personas', label: 'Persona Library', icon: Users, color: 'text-rose-500' },
    { id: 'stakeholders', label: 'Global Stakeholders', icon: UsersRound, color: 'text-indigo-500' },
  ];

  const projectsNav = [
    { id: 'project_dashboard', label: 'Project Dashboard', icon: BarChart3, color: 'text-amber-500' },
    { id: 'projects', label: 'All Projects', icon: Briefcase, color: 'text-amber-600' },
  ];

  const activeProjectNav = useMemo(() => [
    { id: 'project_detail', label: 'Overview', icon: FileText, color: 'text-cyan-500' },
    { id: 'project_team', label: 'Team', icon: UsersRound, color: 'text-blue-500' },
    { id: 'stakeholder_mapping', label: 'Mapping', icon: Target, color: 'text-purple-500' },
    { id: 'journeys', label: 'Journeys', icon: Map, color: 'text-orange-500' },
    { id: 'kanban', label: 'Board', icon: KanbanSquare, color: 'text-amber-500' },
    { id: 'backlog_sprints', label: 'Backlog', icon: LayoutList, color: 'text-indigo-500' },
    ...(activeProject?.features?.processMaps !== false ? [{ id: 'process_maps', label: 'Process', icon: GitMerge, color: 'text-pink-500', badge: 'Pro' }] : []),
    ...(activeProject?.features?.raidLog !== false ? [{ id: 'raid', label: 'RAID', icon: Shield, color: 'text-rose-500' }] : []),
  ], [activeProject]);

  const homeNav = useMemo(() => [
    { id: 'welcome', label: 'Home Page', icon: Home, color: 'text-indigo-500' }
  ], []);

  const bottomNav = useMemo(() => [
    ...(user?.role === 'Admin' ? [
      { id: 'audit_log', label: 'Audit Log', icon: Activity, color: 'text-zinc-500' },
      { id: 'pricing', label: 'Pricing', icon: Target, color: 'text-zinc-500' }
    ] : [])
  ], [user]);

  const renderNavItem = (item: { id: string, label: string, icon: any, color?: string, badge?: string, notify?: boolean }, isNested = false) => {
    const Icon = item.icon;
    const isActive = currentTab === item.id;
    return (
      <button
        key={item.id}
        onClick={() => {
          setCurrentTab(item.id);
          onClose?.();
        }}
        className={cn(
          "w-full flex items-center justify-between py-2 rounded-lg font-medium transition-all group",
          isNested ? "px-3 text-xs" : "px-3 text-sm",
          isActive 
            ? (isDarkMode ? "bg-zinc-800 text-white shadow-sm" : "bg-zinc-100 text-zinc-900 border border-zinc-200")
            : (isDarkMode ? "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900")
        )}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Icon className={cn(isNested ? "w-4 h-4" : "w-5 h-5", isActive ? (isDarkMode ? "text-white" : "text-zinc-900") : (item.color || "text-zinc-500"))} />
            {item.notify && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 border border-white dark:border-zinc-900" />
            )}
          </div>
          {item.label}
        </div>
        {item.badge && (
          <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[8px] font-black uppercase rounded border border-indigo-200 dark:border-indigo-800">
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <div className={cn(
        "fixed inset-y-0 left-0 w-64 flex flex-col transition-transform duration-300 z-50 lg:relative lg:translate-x-0 border-r",
        isDarkMode 
          ? "bg-zinc-950 border-zinc-800 text-zinc-100" 
          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Logo className="h-10" />
            <button onClick={onClose} className={cn(
              "lg:hidden",
              isDarkMode ? "text-zinc-400 hover:text-white" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-white"
            )}>
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>

          {companyProfile && (companyProfile.name || companyProfile.logoUrl) && (
            <div className={cn(
              "flex items-center gap-3 p-3 rounded-xl border transition-all",
              isDarkMode 
                ? "bg-zinc-900 border-zinc-800" 
                : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
            )}>
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden shrink-0",
                isDarkMode ? "bg-zinc-800" : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700"
              )}>
                {companyProfile.logoUrl ? (
                  <img src={companyProfile.logoUrl} alt={companyProfile.name} className="w-full h-full object-contain p-1" />
                ) : (
                  <Building2 className="w-5 h-5 text-zinc-400" />
                )}
              </div>
              <div className="min-w-0">
                <p className={cn(
                  "text-sm font-bold truncate",
                  isDarkMode ? "text-white" : "text-zinc-900 dark:text-white"
                )}>
                  {companyProfile.name || 'Your Company'}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                  {companyProfile.vertical || 'Industry Not Set'}
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex-1 px-4 space-y-6 overflow-y-auto mt-2">
          {/* Main Module Nav */}
          <nav className="space-y-4">
            
            {/* Home */}
            <div className="space-y-1">
              <button 
                onClick={() => { setCurrentTab('welcome'); onClose?.(); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold transition-all",
                  activeModule === 'home' 
                    ? (isDarkMode ? "bg-zinc-800 text-white shadow-sm" : "bg-zinc-100 text-zinc-900 border border-zinc-200 shadow-sm")
                    : (isDarkMode ? "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900")
                )}
              >
                <Home className={cn("w-5 h-5", activeModule === 'home' ? (isDarkMode ? "text-white" : "text-zinc-900") : "text-zinc-500")} />
                Home
              </button>
            </div>

            {/* Global Overview */}
            <div className="space-y-1">
              <button 
                onClick={() => { setCurrentTab('dashboard'); onClose?.(); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold transition-all",
                  activeModule === 'overview' 
                    ? (isDarkMode ? "bg-cyan-900/20 text-cyan-400 border border-cyan-800/50 shadow-sm" : "bg-cyan-50 text-cyan-700 border border-cyan-100 shadow-sm")
                    : (isDarkMode ? "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900")
                )}
              >
                <LayoutDashboard className={cn("w-5 h-5", activeModule === 'overview' ? "text-cyan-500" : "text-zinc-500")} />
                Global Overview
              </button>
              {activeModule === 'overview' && (
                <div className="ml-5 pl-4 border-l border-cyan-100 dark:border-cyan-900/30 space-y-1 mt-1 animate-in slide-in-from-top-2 duration-200">
                  {overviewNav.map(item => renderNavItem(item, true))}
                </div>
              )}
            </div>

            {/* Intelligence */}
            <div className="space-y-1">
              <button 
                onClick={() => { setCurrentTab('intelligence'); onClose?.(); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold transition-all",
                  activeModule === 'intelligence' 
                    ? (isDarkMode ? "bg-indigo-900/20 text-indigo-400 border border-indigo-800/50 shadow-sm" : "bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm")
                    : (isDarkMode ? "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900")
                )}
              >
                <BrainCircuit className={cn("w-5 h-5", activeModule === 'intelligence' ? "text-indigo-500" : "text-zinc-500")} />
                Intelligence
              </button>
              {activeModule === 'intelligence' && (
                <div className="ml-5 pl-4 border-l border-indigo-100 dark:border-indigo-900/30 space-y-1 mt-1 animate-in slide-in-from-top-2 duration-200">
                  {intelligenceNav.map(item => renderNavItem(item, true))}
                </div>
              )}
            </div>

            {/* Customers */}
            <div className="space-y-1">
              <button 
                onClick={() => { setCurrentTab('customers'); onClose?.(); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold transition-all",
                  activeModule === 'customers' 
                    ? (isDarkMode ? "bg-emerald-900/20 text-emerald-400 border border-emerald-800/50 shadow-sm" : "bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm")
                    : (isDarkMode ? "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900")
                )}
              >
                <Users className={cn("w-5 h-5", activeModule === 'customers' ? "text-emerald-500" : "text-zinc-500")} />
                Customers
              </button>
              {activeModule === 'customers' && (
                <div className="ml-5 pl-4 border-l border-emerald-100 dark:border-emerald-900/30 space-y-1 mt-1 animate-in slide-in-from-top-2 duration-200">
                  {customersNav.map(item => renderNavItem(item, true))}
                </div>
              )}
            </div>

            {/* Projects */}
            <div className="space-y-1">
              <button 
                onClick={() => { setCurrentTab('project_dashboard'); onClose?.(); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold transition-all",
                  activeModule === 'projects' 
                    ? (isDarkMode ? "bg-amber-900/20 text-amber-400 border border-amber-800/50 shadow-sm" : "bg-amber-50 text-amber-700 border border-amber-100 shadow-sm")
                    : (isDarkMode ? "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900")
                )}
              >
                <Briefcase className={cn("w-5 h-5", activeModule === 'projects' ? "text-amber-500" : "text-zinc-500")} />
                Projects
              </button>
              {activeModule === 'projects' && (
                <div className="ml-5 pl-4 border-l border-amber-100 dark:border-amber-900/30 space-y-1 mt-1 animate-in slide-in-from-top-2 duration-200">
                  {projectsNav.map(item => renderNavItem(item, true))}
                  
                  {/* Active Project Context */}
                  {activeProject?.name && (
                    <div className="mt-4 pt-4 border-t border-amber-100 dark:border-amber-900/30 space-y-1 animate-in slide-in-from-left-4 duration-300">
                      <div className="px-3 py-2 flex items-center gap-2 -ml-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-[0.2em] truncate">
                          Active: {activeProject.name}
                        </span>
                      </div>
                      {activeProjectNav.map(item => renderNavItem(item, true))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
          </nav>

          <hr className="my-4 border-zinc-100 dark:border-zinc-800" />
          
          <nav className="space-y-1">
            {bottomNav.map(item => renderNavItem(item))}
          </nav>
        </div>

      </div>
    </>
  );
}
