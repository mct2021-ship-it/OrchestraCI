import React, { useState } from 'react';
import { Project, Persona } from '../types';
import { X, Users, UserPlus, Map as MapIcon, ArrowRight, Check, Plus } from 'lucide-react';
import { cn } from '../lib/utils';

interface ProjectOnboardingWizardProps {
  project: Project;
  personas: Persona[];
  onComplete: () => void;
  onUpdateProject: (updates: Partial<Project>) => void;
  onAddTeamMember: () => void;
  onNavigate: (tab: string, subTab?: string) => void;
}

export function ProjectOnboardingWizard({
  project,
  personas,
  onComplete,
  onUpdateProject,
  onAddTeamMember,
  onNavigate
}: ProjectOnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>(project.personaIds || []);

  const handleNext = () => {
    if (step === 1) {
      onUpdateProject({ personaIds: selectedPersonas });
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else {
      onComplete();
    }
  };

  const togglePersona = (id: string) => {
    if (selectedPersonas.includes(id)) {
      setSelectedPersonas(selectedPersonas.filter(pId => pId !== id));
    } else {
      setSelectedPersonas([...selectedPersonas, id]);
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {[1, 2, 3].map(s => (
                <div 
                  key={s} 
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-colors",
                    s === step ? "bg-indigo-600" : s < step ? "bg-indigo-200 dark:bg-indigo-900" : "bg-zinc-200 dark:bg-zinc-800"
                  )}
                />
              ))}
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
              {step === 1 && "Select Personas"}
              {step === 2 && "Add Project Team"}
              {step === 3 && "Create Journey Map"}
            </h3>
          </div>
          <button onClick={onComplete} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="text-center max-w-lg mx-auto mb-8">
                <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8" />
                </div>
                <h4 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Who is this project for?</h4>
                <p className="text-zinc-500 dark:text-zinc-400">Select an existing persona that is the primary focus of this improvement project, or skip to add your own later.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {personas.map(p => (
                  <button
                    key={p.id}
                    onClick={() => togglePersona(p.id)}
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all flex flex-col items-center text-center gap-3",
                      selectedPersonas.includes(p.id)
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-zinc-100 hover:border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                    )}
                  >
                    <img src={p.imageUrl} alt={p.name} className="w-16 h-16 rounded-full object-cover" referrerPolicy="no-referrer" />
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white truncate w-full">{p.name}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate w-full">{p.role}</p>
                    </div>
                    {selectedPersonas.includes(p.id) && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="text-center max-w-lg mx-auto mb-8">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-8 h-8" />
                </div>
                <h4 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Build your team</h4>
                <p className="text-zinc-500 dark:text-zinc-400">Add team members who will be working on this project.</p>
              </div>

              <div className="flex justify-center">
                <button 
                  onClick={onAddTeamMember}
                  className="px-6 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-xl font-bold flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add Team Member
                </button>
              </div>

              {(project.team || []).length > 0 && (
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(project.team || []).map(member => (
                    <div key={member.id} className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <img src={member.photoUrl || `https://i.pravatar.cc/150?u=${member.id}`} alt={member.name} className="w-12 h-12 rounded-full object-cover" referrerPolicy="no-referrer" />
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-white">{member.name}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{member.projectRole}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="text-center max-w-lg mx-auto mb-8">
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MapIcon className="w-8 h-8" />
                </div>
                <h4 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Map the current state</h4>
                <p className="text-zinc-500 dark:text-zinc-400">Create an "As-Is" journey map to understand the current customer experience before planning improvements. You can also skip this and create one later.</p>
              </div>

              <div className="flex justify-center">
                <button 
                  onClick={() => {
                    onComplete();
                    onNavigate('journeys', 'new');
                  }}
                  className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold flex items-center gap-3 transition-colors shadow-lg shadow-indigo-600/20 text-lg"
                >
                  Create Journey Map
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-50 dark:bg-zinc-900/50">
          <button 
            onClick={handleSkip}
            className="px-6 py-2.5 text-zinc-500 dark:text-zinc-400 font-bold hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            Skip
          </button>
          
          {step < 3 && (
            <button 
              onClick={handleNext}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
