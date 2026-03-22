import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, ArrowRight, Zap, Building2, UsersRound } from 'lucide-react';
import { cn } from '../lib/utils';

interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  limitType: 'projects' | 'personas' | 'credits' | 'journeys';
  currentUsage: number;
  maxLimit: number;
  onUpgrade: () => void;
  isDarkMode?: boolean;
}

export function LimitReachedModal({
  isOpen,
  onClose,
  title,
  description,
  limitType,
  currentUsage,
  maxLimit,
  onUpgrade,
  isDarkMode
}: LimitReachedModalProps) {
  const getIcon = () => {
    switch (limitType) {
      case 'projects': return Building2;
      case 'personas': return UsersRound;
      case 'credits': return Zap;
      default: return AlertTriangle;
    }
  };

  const Icon = getIcon();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={cn(
              "relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border",
              isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
            )}
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className={cn(
                  "p-3 rounded-2xl",
                  isDarkMode ? "bg-amber-500/10" : "bg-amber-50"
                )}>
                  <Icon className="w-8 h-8 text-amber-500" />
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>

              <h2 className={cn(
                "text-2xl font-bold mb-2",
                isDarkMode ? "text-white" : "text-zinc-900"
              )}>
                {title}
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 mb-8">
                {description}
              </p>

              <div className={cn(
                "p-6 rounded-2xl mb-8 border",
                isDarkMode ? "bg-zinc-950 border-zinc-800" : "bg-zinc-50 border-zinc-100"
              )}>
                <div className="flex justify-between items-center mb-3 text-sm font-medium">
                  <span className="text-zinc-500">Current Usage</span>
                  <span className={isDarkMode ? "text-white" : "text-zinc-900"}>
                    {currentUsage} / {maxLimit}
                  </span>
                </div>
                <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((currentUsage / maxLimit) * 100, 100)}%` }}
                    className="h-full bg-amber-500 rounded-full"
                  />
                </div>
                <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 font-medium">
                  You've reached the maximum limit for your current plan.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onClose}
                  className={cn(
                    "flex-1 px-6 py-3.5 rounded-2xl font-bold transition-all border",
                    isDarkMode 
                      ? "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700" 
                      : "bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50"
                  )}
                >
                  Maybe Later
                </button>
                <button
                  onClick={() => {
                    onUpgrade();
                    onClose();
                  }}
                  className="flex-1 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 group shadow-lg shadow-indigo-500/20"
                >
                  Upgrade Now
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
