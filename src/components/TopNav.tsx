import React from 'react';
import { Settings, Bell, MessageSquare, Menu, ChevronDown, BrainCircuit, Users, Briefcase, LayoutDashboard, Home } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { User, AppModule } from '../types';
import { Logo } from './Logo';
import { motion } from 'motion/react';

interface TopNavProps {
  onOpenSidebar: () => void;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  onOpenFeedback: () => void;
  onOpenAccount: () => void;
  unreadNotificationsCount: number;
  isDarkMode: boolean;
  currentUser?: User;
  activeModule: AppModule;
  setActiveModule: (module: AppModule) => void;
  onNavigate: (tab: string) => void;
}

export function TopNav({ 
  onOpenSidebar, 
  onOpenSettings, 
  onOpenNotifications, 
  onOpenFeedback, 
  onOpenAccount,
  unreadNotificationsCount,
  isDarkMode,
  currentUser,
  activeModule,
  setActiveModule,
  onNavigate
}: TopNavProps) {
  const modules = [
    { id: 'home' as AppModule, label: 'Home', icon: Home, color: 'text-zinc-500', activeBg: 'bg-zinc-50 dark:bg-zinc-900/20', activeText: 'text-zinc-900 dark:text-white', defaultTab: 'welcome' },
    { id: 'overview' as AppModule, label: 'Global Overview', icon: LayoutDashboard, color: 'text-cyan-500', activeBg: 'bg-cyan-50 dark:bg-cyan-900/20', activeText: 'text-cyan-600 dark:text-cyan-400', defaultTab: 'dashboard' },
    { id: 'intelligence' as AppModule, label: 'Intelligence', icon: BrainCircuit, color: 'text-indigo-500', activeBg: 'bg-indigo-50 dark:bg-indigo-900/20', activeText: 'text-indigo-600 dark:text-indigo-400', defaultTab: 'intelligence' },
    { id: 'customers' as AppModule, label: 'Customers', icon: Users, color: 'text-emerald-500', activeBg: 'bg-emerald-50 dark:bg-emerald-900/20', activeText: 'text-emerald-600 dark:text-emerald-400', defaultTab: 'customers' },
    { id: 'projects' as AppModule, label: 'Projects', icon: Briefcase, color: 'text-amber-500', activeBg: 'bg-amber-50 dark:bg-amber-900/20', activeText: 'text-amber-600 dark:text-amber-400', defaultTab: 'project_dashboard' }
  ];

  return (
    <header className={cn(
      "sticky top-0 z-40 w-full h-16 border-b transition-all duration-300 backdrop-blur-md",
      isDarkMode 
        ? "bg-zinc-950/80 border-zinc-800 text-zinc-100" 
        : "bg-white/80 border-zinc-200 text-zinc-900"
    )}>
      <div className="h-full px-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-1/4">
          <button 
            onClick={onOpenSidebar}
            className={cn(
              "p-2 rounded-lg transition-colors lg:hidden",
              isDarkMode ? "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
            )}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex justify-center items-center gap-2 md:gap-4">
          {modules.map((mod) => {
            const isActive = activeModule === mod.id;
            const Icon = mod.icon;
            return (
              <button
                key={mod.id}
                onClick={() => {
                  setActiveModule(mod.id);
                  onNavigate(mod.defaultTab);
                }}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all relative group",
                  isActive 
                    ? mod.activeBg + " " + mod.activeText
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                )}
              >
                <div className={cn(
                  "transition-transform duration-300 group-hover:scale-110",
                  isActive && "scale-110"
                )}>
                  <Icon className={cn("w-5 h-5", isActive ? mod.activeText : mod.color)} />
                </div>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest transition-opacity font-sans opacity-100",
                  isActive ? mod.activeText : "text-zinc-500"
                )}>
                  {mod.label}
                </span>
                {isActive && (
                  <motion.div 
                    layoutId="activeModuleLine"
                    className={cn("absolute -bottom-[1px] left-4 right-4 h-0.5 rounded-full", mod.id === 'home' ? 'bg-zinc-500 dark:bg-zinc-400' : mod.id === 'overview' ? 'bg-cyan-500' : mod.id === 'intelligence' ? 'bg-indigo-500' : mod.id === 'customers' ? 'bg-emerald-500' : 'bg-amber-500')}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-1 md:gap-2 w-1/4">
          <button 
            onClick={onOpenFeedback}
            className={cn(
              "p-2 rounded-xl transition-all relative group",
              isDarkMode ? "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100" : "hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900"
            )}
            title="Give Feedback"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="absolute top-full right-0 mt-2 px-2 py-1 bg-zinc-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Feedback
            </span>
          </button>

          <button 
            onClick={onOpenSettings}
            className={cn(
              "p-2 rounded-xl transition-all relative group",
              isDarkMode ? "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100" : "hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900"
            )}
            title="Settings"
          >
            <Settings className="w-5 h-5" />
            <span className="absolute top-full right-0 mt-2 px-2 py-1 bg-zinc-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Settings
            </span>
          </button>

          <button 
            onClick={onOpenNotifications}
            className={cn(
              "p-2 rounded-xl transition-all relative group",
              isDarkMode ? "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100" : "hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900"
            )}
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-white dark:ring-zinc-950">
                {unreadNotificationsCount}
              </span>
            )}
            <span className="absolute top-full right-0 mt-2 px-2 py-1 bg-zinc-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Notifications
            </span>
          </button>

          <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-1" />

          <button 
            onClick={onOpenAccount}
            className={cn(
              "flex items-center gap-2 p-1.5 rounded-xl transition-all",
              isDarkMode ? "hover:bg-zinc-800" : "hover:bg-zinc-100"
            )}
          >
            <div className="relative">
              <img 
                src={currentUser?.photoUrl || `https://ui-avatars.com/api/?name=${currentUser?.name || 'User'}&background=random`} 
                alt={currentUser?.name || 'User'} 
                className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700 object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-zinc-950 rounded-full" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold leading-none">{currentUser?.name || 'User'}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">{currentUser?.role || 'Member'}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-zinc-400 hidden sm:block" />
          </button>
        </div>
      </div>
    </header>
  );
}
