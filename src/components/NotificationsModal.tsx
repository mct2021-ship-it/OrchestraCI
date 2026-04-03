import React from 'react';
import { X, Bell, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  isDarkMode?: boolean;
}

export function NotificationsModal({ isOpen, onClose, notifications, onMarkAsRead, onMarkAllAsRead, isDarkMode }: NotificationsModalProps) {
  if (!isOpen) return null;

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

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
                  <p className={cn("font-medium", isDarkMode ? "text-zinc-400" : "text-zinc-500")}>
                    No notifications yet
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => onMarkAsRead(notification.id)}
                    className={cn(
                      "p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden",
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
                      <div className="flex-1 min-w-0">
                        <h4 className={cn(
                          "text-sm font-bold mb-1",
                          isDarkMode ? "text-white" : "text-zinc-900"
                        )}>
                          {notification.title}
                        </h4>
                        <p className={cn(
                          "text-sm leading-relaxed",
                          isDarkMode ? "text-zinc-400" : "text-zinc-600"
                        )}>
                          {notification.message}
                        </p>
                        <p className={cn(
                          "text-xs mt-2 font-medium",
                          isDarkMode ? "text-zinc-500" : "text-zinc-400"
                        )}>
                          {new Date(notification.createdAt).toLocaleDateString()} at {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
