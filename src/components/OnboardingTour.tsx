import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft, Sparkles, Target, Users, Map as MapIcon } from 'lucide-react';

interface Step {
  title: string;
  content: string;
  icon: any;
  target?: string; // CSS selector for highlighting
  tab?: string; // Tab to navigate to
  subTab?: string; // Sub-tab for project_detail
}

interface OnboardingTourProps {
  isActive: boolean;
  onClose: () => void;
  onNavigate: (tab: string, subTab?: string) => void;
  currentTab: string;
}

export function OnboardingTour({ isActive, onClose, onNavigate, currentTab }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: Step[] = [
    {
      title: "Welcome to the Playground!",
      content: "This test project is a safe space to explore the platform. We've pre-populated it with data so you can see how everything connects.",
      icon: Sparkles,
      tab: "project_detail"
    },
    {
      title: "Understanding Personas",
      content: "Personas represent your target audience. In this project, we've linked specific personas to journey maps to ensure customer-centricity.",
      icon: Users,
      tab: "project_detail"
    },
    {
      title: "Project Overview",
      content: "Here you can see the high-level goals, metrics, and team members for this project. It's the central hub for your CX strategy.",
      icon: Target,
      tab: "project_detail"
    },
    {
      title: "Journey Orchestration",
      content: "This is where the magic happens. Visualize customer pathways, identify friction points, and map out the 'To-Be' experience.",
      icon: MapIcon,
      tab: "project_detail"
    },
    {
      title: "Execution with Kanban",
      content: "Turn insights into action. Use the Kanban board to track improvements through the Double Diamond workflow.",
      icon: Target,
      tab: "project_detail"
    }
  ];

  useEffect(() => {
    if (isActive && steps[currentStep].tab && steps[currentStep].tab !== currentTab) {
      onNavigate(steps[currentStep].tab!, steps[currentStep].subTab);
    }
  }, [currentStep, isActive]);

  if (!isActive) return null;

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-end justify-center p-6 sm:items-center sm:p-0">
      <div className="absolute inset-0 bg-zinc-900/20 backdrop-blur-[2px] pointer-events-auto" onClick={onClose} />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-8 pointer-events-auto overflow-hidden"
        >
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-zinc-100 dark:bg-zinc-800">
            <motion.div 
              className="h-full bg-indigo-600"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-zinc-400 dark:text-zinc-400 hover:text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 dark:bg-zinc-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                <step.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{step.title}</h3>
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Step {currentStep + 1} of {steps.length}</p>
              </div>
            </div>

            <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {step.content}
            </p>

            <div className="flex items-center justify-between pt-4">
              <button
                onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-white disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              {currentStep < steps.length - 1 ? (
                <button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-lg"
                >
                  Next Step
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/200 transition-all shadow-lg"
                >
                  Got it!
                  <Sparkles className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
