import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HelpTooltipProps {
  content: React.ReactNode;
  position?: 'top' | 'bottom';
}

export function HelpTooltip({ content, position = 'top' }: HelpTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative inline-flex items-center ml-1.5"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={() => setIsVisible(!isVisible)}
    >
      <HelpCircle className="w-4 h-4 text-zinc-400 hover:text-indigo-500 cursor-help transition-colors" />
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: position === 'top' ? 5 : -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: position === 'top' ? 5 : -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 w-64 p-3 text-xs font-normal text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl left-1/2 -translate-x-1/2 pointer-events-none ${
              position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
            }`}
          >
            {content}
            <div className={`absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-zinc-800 rotate-45 ${
              position === 'top' 
                ? '-bottom-1.5 border-b border-r border-zinc-200 dark:border-zinc-700' 
                : '-top-1.5 border-t border-l border-zinc-200 dark:border-zinc-700'
            }`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
