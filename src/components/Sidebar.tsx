import React, { useMemo } from 'react';
import { LayoutDashboard, Users, Map, Target, GitMerge, Sparkles, Menu, X as CloseIcon, Settings, BrainCircuit, Shield, Building2, Activity, LayoutList, Briefcase, FileText, UsersRound, KanbanSquare, MonitorSmartphone, Calendar, MessageSquare, Bell } from 'lucide-react';
import { cn } from '../lib/utils';
import { usePlan } from '../context/PlanContext';
import { useAuth } from '../context/AuthContext';
import { CompanyProfile } from './YourCompany';
import { Project } from '../types';
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
}

export function Sidebar({ currentTab, setCurrentTab, isOpen, onClose, activeProject, isDarkMode, companyProfile, onOpenFeedback, onOpenNotifications, unreadNotificationsCount = 0 }: SidebarProps) {
  const { plan } = usePlan();
  const { user } = useAuth();

  const mainNav = useMemo(() => [
    { id: 'welcome', label: 'Welcome', icon: Sparkles, color: 'text-indigo-500' },
    ...(plan !== 'starter' ? [{ id: 'intelligence', label: 'Intelligence', icon: BrainCircuit, color: 'text-purple-500' }] : []),
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-emerald-500' },
    { id: 'personas', label: 'Personas', icon: Users, color: 'text-rose-500' },
    { id: 'stakeholders', label: 'Stakeholders', icon: UsersRound, color: 'text-indigo-500' },
    { id: 'pricing', label: 'Pricing', icon: Target, color: 'text-blue-500' },
  ], [plan]);

  const projectNav = useMemo(() => [
    { id: 'project_detail', label: 'Project Overview', icon: FileText, color: 'text-cyan-500' },
    { id: 'project_team', label: 'Project Team', icon: UsersRound, color: 'text-blue-500' },
    { id: 'stakeholder_mapping', label: 'Stakeholder Mapping', icon: Target, color: 'text-purple-500' },
    { id: 'journeys', label: 'Journey Maps', icon: Map, color: 'text-orange-500' },
    { id: 'kanban', label: 'Kanban Board', icon: KanbanSquare, color: 'text-amber-500' },
    { id: 'backlog', label: 'Backlog', icon: LayoutList, color: 'text-indigo-500' },
    { id: 'sprints', label: 'Sprint Management', icon: Calendar, color: 'text-emerald-500' },
    ...(activeProject?.features?.processMaps !== false ? [{ id: 'process_maps', label: 'Process Maps', icon: GitMerge, color: 'text-pink-500' }] : []),
    ...(activeProject?.features?.raidLog !== false ? [{ id: 'raid', label: 'RAID Log', icon: Shield, color: 'text-rose-500' }] : []),
  ], [activeProject]);

  const isProjectContext = currentTab === 'projects' || projectNav.some(nav => nav.id === currentTab);

  const renderNavItem = (item: { id: string, label: string, icon: any, color?: string }, isNested = false) => {
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
          "w-full flex items-center gap-3 py-2 rounded-lg font-medium transition-colors",
          isNested ? "px-3 text-xs" : "px-3 text-sm",
          isActive 
            ? (isDarkMode ? "bg-zinc-800 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white")
            : (isDarkMode ? "text-zinc-400 dark:text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100" : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-900 hover:text-zinc-900 dark:text-white")
        )}
      >
        <Icon className={cn(isNested ? "w-4 h-4" : "w-5 h-5", isActive ? (isDarkMode ? "text-white" : "text-zinc-900 dark:text-white") : (item.color || "text-zinc-500 dark:text-zinc-400"))} />
        {item.label}
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
        
        <div className="flex-1 px-4 space-y-6 overflow-y-auto">
          <nav className="space-y-1">
            {mainNav.map(item => renderNavItem(item))}
          </nav>

          <hr className="my-4 border-zinc-200 dark:border-zinc-800" />

          <div className="space-y-2">
            <nav className="space-y-1">
              {renderNavItem({ id: 'projects', label: 'Projects', icon: Briefcase, color: 'text-amber-500' })}
            </nav>
            {activeProject?.name && isProjectContext && (
              <div className="ml-[22px] pl-3 mt-1 space-y-1 border-l border-zinc-200 dark:border-zinc-800">
                <nav className="space-y-1">
                  {projectNav.map(item => renderNavItem(item, true))}
                </nav>
              </div>
            )}
          </div>

          <hr className="my-4 border-zinc-200 dark:border-zinc-800" />

          <nav className="space-y-1">
            {renderNavItem({ id: 'settings', label: 'Settings', icon: Settings })}
            {renderNavItem({ id: 'audit_log', label: 'Audit Log', icon: Activity })}
            <button
              onClick={() => {
                onOpenNotifications?.();
                onClose?.();
              }}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isDarkMode ? "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100" : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-900 hover:text-zinc-900 dark:text-white"
              )}
            >
              <div className="flex items-center gap-3">
                <Bell className={cn("w-5 h-5", isDarkMode ? "text-zinc-400" : "text-zinc-500 dark:text-zinc-400")} />
                Notifications
              </div>
              {unreadNotificationsCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                onOpenFeedback?.();
                onClose?.();
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isDarkMode ? "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100" : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-900 hover:text-zinc-900 dark:text-white"
              )}
            >
              <MessageSquare className={cn("w-5 h-5", isDarkMode ? "text-zinc-400" : "text-zinc-500 dark:text-zinc-400")} />
              Give Feedback
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-zinc-800">
          <button 
            onClick={() => {
              setCurrentTab('account');
              onClose?.();
            }}
            className={cn(
              "flex items-center gap-3 w-full text-left p-2 rounded-xl transition-colors",
              currentTab === 'account' 
                ? (isDarkMode ? "bg-zinc-800" : "bg-zinc-100 dark:bg-zinc-800")
                : (isDarkMode ? "hover:bg-zinc-800/50" : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50")
            )}
          >
            <img 
              src={user?.photoUrl || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random`} 
              alt={user?.name || 'User'} 
              className={cn(
                "w-10 h-10 rounded-full border",
                isDarkMode ? "border-zinc-700" : "border-zinc-200 dark:border-zinc-700"
              )} 
              referrerPolicy="no-referrer" 
            />
            <div className="text-sm overflow-hidden">
              <p className={cn(
                "font-medium truncate",
                isDarkMode ? "text-white" : "text-zinc-900 dark:text-white"
              )}>{user?.name || 'User'}</p>
              <p className="text-zinc-500 dark:text-zinc-400 truncate">{user?.role || 'CX Director'}</p>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
