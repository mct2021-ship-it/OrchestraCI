import React from 'react';
import { Settings, Bell, MessageSquare, Menu, Search, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import { Logo } from './Logo';

interface TopNavProps {
  onOpenSidebar: () => void;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  onOpenFeedback: () => void;
  onOpenAccount: () => void;
  unreadNotificationsCount: number;
  isDarkMode: boolean;
  currentUser?: User;
}

export function TopNav({ 
  onOpenSidebar, 
  onOpenSettings, 
  onOpenNotifications, 
  onOpenFeedback, 
  onOpenAccount,
  unreadNotificationsCount,
  isDarkMode,
  currentUser
}: TopNavProps) {
  return (
    <header className={cn(
      "sticky top-0 z-40 w-full h-16 border-b transition-all duration-300 backdrop-blur-md",
      isDarkMode 
        ? "bg-zinc-950/80 border-zinc-800 text-zinc-100" 
        : "bg-white/80 border-zinc-200 text-zinc-900"
    )}>
      <div className="h-full px-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onOpenSidebar}
            className={cn(
              "p-2 rounded-lg transition-colors lg:hidden",
              isDarkMode ? "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
            )}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="hidden lg:block">
            <Logo className="h-8" />
          </div>
          <div className="lg:hidden">
             <Logo className="h-8" />
          </div>
        </div>

        <div className="flex-1 max-w-xl hidden md:block">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search projects, tasks, or intelligence..." 
              className={cn(
                "w-full pl-10 pr-4 py-2 rounded-xl text-sm border transition-all outline-none",
                isDarkMode 
                  ? "bg-zinc-900 border-zinc-800 focus:border-indigo-500 text-white" 
                  : "bg-zinc-50 border-zinc-200 focus:border-indigo-500 text-zinc-900"
              )}
            />
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
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
