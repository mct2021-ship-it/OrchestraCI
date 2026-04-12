import React, { useState } from 'react';
import { X, Bell, CheckCircle2, MessageSquare, Info } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  type?: 'system' | 'chat' | 'assignment';
  sourceId?: string;
  link?: {
    type: 'task' | 'journey' | 'process' | 'project';
    id: string;
    projectId?: string;
  };
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNavigate?: (tab: string, subTab?: string) => void;
  isDarkMode?: boolean;
}

export function NotificationsModal({ isOpen, onClose, notifications, onMarkAsRead, onMarkAllAsRead, onNavigate, isDarkMode }: NotificationsModalProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'system' | 'chat' | 'assignment'>('all');

  if (!isOpen) return null;

  const handleNotificationClick = (notification: Notification) => {
    onMarkAsRead(notification.id);
    if (notification.link && onNavigate) {
      if (notification.link.type === 'task') {
        onNavigate('tasks', notification.link.id);
      } else if (notification.link.type === 'journey') {
        onNavigate('journeys', notification.link.id);
      } else if (notification.link.type === 'process') {
        onNavigate('process_maps', notification.link.id);
      } else if (notification.link.type === 'project') {
        onNavigate('project_detail', notification.link.id);
      }
      onClose();
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') return true;
    return n.type === activeTab;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={cn(
              "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[80vh]",
              isDarkMode ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-200"
            )}
          >
            <div className={cn(
              "p-6 border-b flex items-center justify-between",
              isDarkMode ? "border-zinc-800" : "border-zinc-200"
            )}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h2 className={cn("text-xl font-bold", isDarkMode ? "text-white" : "text-zinc-900")}>
                    Notifications
                  </h2>
                  <p className={cn("text-sm", isDarkMode ? "text-zinc-400" : "text-zinc-500")}>
                    Stay updated with Orchestra CI
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {notifications.some(n => !n.read) && (
                  <button
                    onClick={onMarkAllAsRead}
                    className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                  >
                    Mark all as read
                  </button>
                )}
                <button
                  onClick={onClose}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    isDarkMode ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-zinc-100 text-zinc-500"
                  )}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className={cn(
              "flex items-center p-1 border-b",
              isDarkMode ? "border-zinc-800 bg-zinc-900/50" : "border-zinc-200 bg-zinc-50/50"
            )}>
              {(['all', 'system', 'chat', 'assignment'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold rounded-lg transition-all capitalize",
                    activeTab === tab
                      ? (isDarkMode ? "bg-zinc-800 text-white shadow-sm" : "bg-white text-zinc-900 shadow-sm")
                      : (isDarkMode ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-500 hover:text-zinc-700")
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
                  </div>
                  <p className={cn("font-bold text-lg", isDarkMode ? "text-zinc-400" : "text-zinc-500")}>
                    No {activeTab !== 'all' ? activeTab : ''} notifications
                  </p>
                  <p className={cn("text-sm mt-1", isDarkMode ? "text-zinc-500" : "text-zinc-400")}>
                    You're all caught up!
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden group",
                      !notification.read 
                        ? (isDarkMode ? "bg-zinc-800/50 border-indigo-500/30" : "bg-indigo-50/50 border-indigo-200") 
                        : (isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"),
                      isDarkMode ? "hover:border-zinc-700" : "hover:border-zinc-300"
                    )}
                  >
                    {!notification.read && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
                    )}
                    <div className="flex items-start justify-between gap-4">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                        {notification.type === 'chat' ? (
                          <MessageSquare className="w-4 h-4 text-indigo-500" />
                        ) : notification.type === 'assignment' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Info className="w-4 h-4 text-zinc-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={cn(
                            "text-sm font-bold",
                            isDarkMode ? "text-white" : "text-zinc-900"
                          )}>
                            {notification.title}
                          </h4>
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800",
                            notification.type === 'chat' ? "text-indigo-500" : 
                            notification.type === 'assignment' ? "text-emerald-500" :
                            "text-zinc-400"
                          )}>
                            {notification.type || 'system'}
                          </span>
                        </div>
                        <p className={cn(
                          "text-sm leading-relaxed",
                          isDarkMode ? "text-zinc-400" : "text-zinc-600"
                        )}>
                          {notification.message}
                        </p>
                        <p className={cn(
                          "text-[10px] mt-2 font-bold uppercase tracking-widest",
                          isDarkMode ? "text-zinc-600" : "text-zinc-400"
                        )}>
                          {new Date(notification.createdAt).toLocaleDateString()} • {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
