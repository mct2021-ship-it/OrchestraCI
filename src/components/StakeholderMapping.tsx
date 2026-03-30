import React, { useState, useMemo, useRef } from 'react';
import { Users, Plus, Search, Filter, Trash2, Edit2, Globe, Building2, Mail, Tag, AlertCircle, Target, TrendingUp, MessageSquare, Link as LinkIcon, ChevronRight, ChevronDown, Sparkles, Loader2 } from 'lucide-react';
import { Stakeholder, ProjectStakeholder, Project, StakeholderSentiment } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { getGeminiClient, ensureApiKey } from '../lib/gemini';
import { ThinkingLevel } from '@google/genai';
import { stripPIData } from '../lib/piStripper';

interface StakeholderMappingProps {
  project: Project;
  globalStakeholders: Stakeholder[];
  projectStakeholders: ProjectStakeholder[];
  setProjectStakeholders: (items: ProjectStakeholder[] | ((prev: ProjectStakeholder[]) => ProjectStakeholder[])) => void;
  setGlobalStakeholders: (items: Stakeholder[] | ((prev: Stakeholder[]) => Stakeholder[])) => void;
  onNavigate: (tab: string, subTab?: string) => void;
  isDarkMode?: boolean;
}

export function StakeholderMapping({ project, globalStakeholders, projectStakeholders, setProjectStakeholders, setGlobalStakeholders, onNavigate, isDarkMode }: StakeholderMappingProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showGlobalLibrary, setShowGlobalLibrary] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleDragEnd = (id: string, event: any, info: any) => {
    if (!gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    
    const x = info.point.x - rect.left;
    const y = info.point.y - rect.top;
    
    let percentX = (x / rect.width) * 100;
    let percentY = (y / rect.height) * 100;
    
    // Reverse the 10-90 padding to calculate true 0-100 value
    let adjustedX = ((percentX - 10) / 80) * 100;
    let adjustedY = ((percentY - 10) / 80) * 100;
    
    adjustedX = Math.max(0, Math.min(100, adjustedX));
    adjustedY = Math.max(0, Math.min(100, adjustedY));
    
    // Convert to 1-10 scale
    const newInterest = Math.max(1, Math.min(10, Math.round((adjustedX / 100) * 9) + 1));
    const newPower = Math.max(1, Math.min(10, 10 - Math.round((adjustedY / 100) * 9)));
    
    setProjectStakeholders(prev => prev.map(s => 
      s.id === id ? { ...s, interest: newInterest, power: newPower } : s
    ));
  };

  const [formData, setFormData] = useState<Partial<ProjectStakeholder>>({
    name: '',
    category: 'Operational Manager',
    organization: '',
    email: '',
    power: 5,
    interest: 5,
    sentiment: 'Neutral',
    engagementStrategy: '',
    linkedItems: []
  });

  const categories = [
    'Operational Manager',
    'Frontline Staff',
    'Service User',
    'Contractor',
    'Community Group',
    'Internal Champion',
    'Internal Blocker',
    'Project Board Member',
    'Executive Sponsor',
    'Director/Head of Service',
    'Other'
  ];

  const filteredStakeholders = useMemo(() => {
    return projectStakeholders.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.organization?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projectStakeholders, searchTerm]);

  const handleAddFromGlobal = (global: Stakeholder) => {
    const alreadyExists = projectStakeholders.some(ps => ps.id === global.id || (ps.name === global.name && ps.projectId === project.id));
    if (alreadyExists) {
      alert('This stakeholder is already added to the project.');
      return;
    }

    const newProjectStakeholder: ProjectStakeholder = {
      ...global,
      projectId: project.id,
      power: 5,
      interest: 5,
      sentiment: 'Neutral',
      sentimentHistory: [{ date: new Date().toISOString(), sentiment: 'Neutral', note: 'Added to project' }],
      engagementStrategy: '',
      linkedItems: []
    };

    setProjectStakeholders(prev => [...prev, newProjectStakeholder]);
    setShowGlobalLibrary(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category) return;

    if (editingId) {
      setProjectStakeholders(prev => prev.map(s => s.id === editingId ? { ...s, ...formData } as ProjectStakeholder : s));
      setEditingId(null);
    } else {
      const newStakeholder: ProjectStakeholder = {
        id: `pstk_${Date.now()}`,
        projectId: project.id,
        name: formData.name!,
        category: formData.category!,
        organization: formData.organization,
        email: formData.email,
        isGlobal: false,
        power: formData.power || 5,
        interest: formData.interest || 5,
        sentiment: formData.sentiment || 'Neutral',
        sentimentHistory: [{ date: new Date().toISOString(), sentiment: formData.sentiment || 'Neutral', note: 'Initial entry' }],
        engagementStrategy: formData.engagementStrategy || '',
        linkedItems: []
      };
      setProjectStakeholders(prev => [...prev, newStakeholder]);
    }

    setFormData({ name: '', category: 'Operational Manager', organization: '', email: '', power: 5, interest: 5, sentiment: 'Neutral', engagementStrategy: '', linkedItems: [] });
    setIsAdding(false);
  };

  const handleUpdateSentiment = (id: string, newSentiment: 'Positive' | 'Neutral' | 'Negative', note?: string) => {
    setProjectStakeholders(prev => prev.map(s => {
      if (s.id === id) {
        const newHistory: StakeholderSentiment = {
          date: new Date().toISOString(),
          sentiment: newSentiment,
          note
        };
        return {
          ...s,
          sentiment: newSentiment,
          sentimentHistory: [...s.sentimentHistory, newHistory]
        };
      }
      return s;
    }));
  };

  const generateStrategy = async (stakeholder: ProjectStakeholder) => {
    const targetId = stakeholder.id || 'new';
    setIsGeneratingStrategy(targetId);
    try {
      const hasKey = await ensureApiKey();
      if (!hasKey) {
        setIsGeneratingStrategy(null);
        return;
      }

      const ai = await getGeminiClient();
      if (!ai) {
        setIsGeneratingStrategy(null);
        return;
      }
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a concise engagement strategy for a stakeholder in a project.
        
        Project: ${stripPIData(project.name)}
        Project Description: ${stripPIData(project.description)}
        Stakeholder Name: ${stripPIData(stakeholder.name)}
        Category: ${stripPIData(stakeholder.category)}
        About/Context: ${stripPIData(stakeholder.about || 'No additional context provided.')}
        Power: ${stakeholder.power}/10
        Interest: ${stakeholder.interest}/10
        Current Sentiment: ${stakeholder.sentiment}
        
        Provide 3-4 actionable bullet points for how to engage this person effectively.`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        }
      });

      const strategy = response.text;
      if (strategy) {
        if (editingId === stakeholder.id || !stakeholder.id) {
          setFormData(prev => ({ ...prev, engagementStrategy: strategy }));
        } else {
          setProjectStakeholders(prev => prev.map(s => s.id === stakeholder.id ? { ...s, engagementStrategy: strategy } : s));
        }
      }
    } catch (err) {
      console.error('Failed to generate strategy', err);
      alert('Failed to generate AI strategy. Please try again.');
    } finally {
      setIsGeneratingStrategy(null);
    }
  };

  const gridStakeholders = useMemo(() => {
    return projectStakeholders.map(s => ({
      ...s,
      // Map 1-10 scale to 10-90% to keep cards within visual grid bounds
      x: 10 + (((s.interest - 1) / 9) * 80),
      y: 90 - (((s.power - 1) / 9) * 80)
    }));
  }, [projectStakeholders]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Target className="w-6 h-6 text-indigo-600" />
              Stakeholder Mapping
            </h2>
            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium border border-indigo-200 dark:border-indigo-500/30">
              {project.name}
            </span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Map and manage stakeholders specific to {project.name}.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowGlobalLibrary(true)}
            className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
          >
            <Globe className="w-4 h-4" />
            From Library
          </button>
          <button
            onClick={() => {
              setIsAdding(true);
              setEditingId(null);
              setFormData({ name: '', category: 'Operational Manager', organization: '', email: '', power: 5, interest: 5, sentiment: 'Neutral', engagementStrategy: '', linkedItems: [] });
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            Add Project Specific
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Power-Interest Grid */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">High Power</div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Low Power</div>
            <div className="absolute left-4 top-1/2 -rotate-90 -translate-y-1/2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest origin-center">Low Interest</div>
            <div className="absolute right-4 top-1/2 rotate-90 -translate-y-1/2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest origin-center">High Interest</div>

            <div ref={gridRef} className="aspect-square w-full relative border-2 border-zinc-100 dark:border-zinc-800 rounded-lg overflow-hidden">
              {/* Grid Lines */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-full h-px bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-full w-px bg-zinc-200 dark:bg-zinc-800" />
              </div>

              {/* Quadrant Labels */}
              <div className="absolute top-4 left-4 text-xs font-bold text-zinc-400/50 pointer-events-none">Keep Satisfied</div>
              <div className="absolute top-4 right-4 text-xs font-bold text-zinc-400/50 pointer-events-none">Manage Closely</div>
              <div className="absolute bottom-4 left-4 text-xs font-bold text-zinc-400/50 pointer-events-none">Monitor</div>
              <div className="absolute bottom-4 right-4 text-xs font-bold text-zinc-400/50 pointer-events-none">Keep Informed</div>

              {/* Stakeholder Points */}
              {gridStakeholders.map(s => (
                <motion.div
                  key={s.id}
                  drag
                  dragConstraints={gridRef}
                  dragElastic={0}
                  dragMomentum={false}
                  onDragStart={() => { isDragging.current = true; }}
                  onDragEnd={(e, info) => {
                    setTimeout(() => { isDragging.current = false; }, 100);
                    handleDragEnd(s.id, e, info);
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-grab active:cursor-grabbing z-10"
                  style={{ left: `${s.x}%`, top: `${s.y}%` }}
                  onClick={(e) => {
                    if (isDragging.current) return;
                    setFormData(s);
                    setEditingId(s.id);
                    setIsAdding(true);
                  }}
                >
                  <div className="bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl p-3 shadow-xl min-w-[140px] max-w-[180px] transition-all group-hover:scale-105 group-hover:border-indigo-500">
                    <div className="flex items-center justify-between mb-2">
                      <div className={cn(
                        "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
                        s.sentiment === 'Positive' ? "bg-emerald-100 text-emerald-700" :
                        s.sentiment === 'Negative' ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {s.sentiment}
                      </div>
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                      </div>
                    </div>
                    <p className="text-xs font-black text-zinc-900 dark:text-white truncate mb-0.5">{s.name}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mb-2">{s.category}</p>
                    <div className="flex items-center gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-700">
                      <div className="flex flex-col">
                        <span className="text-[8px] text-zinc-400 uppercase font-bold">Power</span>
                        <span className="text-xs font-black text-indigo-600">{s.power}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] text-zinc-400 uppercase font-bold">Interest</span>
                        <span className="text-xs font-black text-indigo-600">{s.interest}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 text-xs text-zinc-500">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" /> Positive
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500" /> Neutral
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-rose-500" /> Negative
            </div>
          </div>
        </div>

        {/* Stakeholder List & Details */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search project stakeholders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {filteredStakeholders.map(s => (
              <div 
                key={s.id}
                className={cn(
                  "p-4 rounded-2xl border transition-all cursor-pointer group",
                  editingId === s.id 
                    ? "bg-indigo-50/50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800" 
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                )}
                onClick={() => {
                  setFormData(s);
                  setEditingId(s.id);
                  setIsAdding(true);
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      s.sentiment === 'Positive' ? 'bg-emerald-500' : 
                      s.sentiment === 'Negative' ? 'bg-rose-500' : 'bg-amber-500'
                    )} />
                    <h4 className="font-bold text-sm truncate">{s.name}</h4>
                  </div>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                    P:{s.power} I:{s.interest}
                  </div>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mb-3">{s.category}</p>
                
                {s.engagementStrategy && (
                  <div className="text-[10px] text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-lg line-clamp-2 italic">
                    {s.engagementStrategy}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Global Library Modal */}
      <AnimatePresence>
        {showGlobalLibrary && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col border border-zinc-200 dark:border-zinc-800"
            >
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-500" />
                  Select from Global Library
                </h3>
                <button onClick={() => setShowGlobalLibrary(false)} className="text-zinc-400 hover:text-zinc-600">
                  Cancel
                </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-4">
                {globalStakeholders.length > 0 ? (
                  globalStakeholders.map(s => (
                    <div 
                      key={s.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <div>
                        <p className="font-bold text-sm">{s.name}</p>
                        <p className="text-xs text-zinc-500">{s.category} • {s.organization || 'No Org'}</p>
                      </div>
                      <button
                        onClick={() => handleAddFromGlobal(s)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors"
                      >
                        Add to Project
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-zinc-500">
                    No global stakeholders found. Add some in the Global Library first.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-zinc-200 dark:border-zinc-800"
            >
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  {editingId ? <Edit2 className="w-5 h-5 text-indigo-500" /> : <Plus className="w-5 h-5 text-indigo-500" />}
                  {editingId ? 'Edit Project Stakeholder' : 'Add Project Stakeholder'}
                </h3>
                <button onClick={() => setIsAdding(false)} className="text-zinc-400 hover:text-zinc-600">
                  Cancel
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Name *</label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Category *</label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">About / Context</label>
                    <textarea
                      value={formData.about || ''}
                      onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                      placeholder="Background information to help contextualize AI engagement plans..."
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Power</label>
                        <span className="text-xs font-bold text-indigo-600">{formData.power}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={formData.power}
                        onChange={(e) => setFormData({ ...formData, power: parseInt(e.target.value) })}
                        className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Interest</label>
                        <span className="text-xs font-bold text-indigo-600">{formData.interest}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={formData.interest}
                        onChange={(e) => setFormData({ ...formData, interest: parseInt(e.target.value) })}
                        className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Current Sentiment</label>
                    <div className="flex gap-2">
                      {(['Positive', 'Neutral', 'Negative'] as const).map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setFormData({ ...formData, sentiment: s })}
                          className={cn(
                            "flex-1 py-2 rounded-xl border text-xs font-bold transition-all",
                            formData.sentiment === s 
                              ? (s === 'Positive' ? 'bg-emerald-500 border-emerald-600 text-white' : 
                                 s === 'Negative' ? 'bg-rose-500 border-rose-600 text-white' : 
                                 'bg-amber-500 border-amber-600 text-white')
                              : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500'
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Engagement Strategy</label>
                    <button
                      type="button"
                      onClick={() => generateStrategy(formData as ProjectStakeholder)}
                      disabled={isGeneratingStrategy === (formData.id || 'new') || !formData.name}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 disabled:text-zinc-400 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      {isGeneratingStrategy === (formData.id || 'new') ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> Generating...</>
                      ) : (
                        <><Sparkles className="w-3 h-3" /> AI Suggestion</>
                      )}
                    </button>
                  </div>
                  <textarea
                    value={formData.engagementStrategy}
                    onChange={(e) => setFormData({ ...formData, engagementStrategy: e.target.value })}
                    className="w-full h-32 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="Describe how you will engage this stakeholder..."
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-6 py-3 border border-rose-200 text-rose-600 rounded-xl font-bold hover:bg-rose-50 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={!!isGeneratingStrategy}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20"
                  >
                    {editingId ? 'Update Stakeholder' : 'Add to Project'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-zinc-200 dark:border-zinc-800"
            >
              <div className="flex items-center gap-3 mb-4 text-rose-600">
                <AlertCircle className="w-6 h-6" />
                <h3 className="text-lg font-bold">Remove Stakeholder?</h3>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                Are you sure you want to remove this stakeholder from the project? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setProjectStakeholders(prev => prev.filter(s => s.id !== editingId));
                    setIsAdding(false);
                    setShowDeleteConfirm(false);
                  }}
                  className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/20"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
