import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

interface ContextualHelpProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

export function ContextualHelp({ title, description, children }: ContextualHelpProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl overflow-hidden mb-8">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-indigo-100/50 dark:hover:bg-indigo-900/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-800 rounded-lg">
            <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-indigo-900 dark:text-indigo-100">{title}</h3>
            {!isExpanded && (
              <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-0.5 line-clamp-1">{description}</p>
            )}
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-indigo-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-indigo-500" />
        )}
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-6 pb-6 pt-2 text-indigo-800 dark:text-indigo-200 text-sm leading-relaxed border-t border-indigo-100 dark:border-indigo-800/50 mt-2">
              <p className="mb-4">{description}</p>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
