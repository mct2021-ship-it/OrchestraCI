import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit2, 
  Globe, 
  Building2, 
  Mail, 
  Tag, 
  AlertCircle, 
  Sparkles, 
  Loader2, 
  Check, 
  X, 
  CheckCircle2, 
  MessageSquare, 
  ArrowRight, 
  UserCircle, 
  Briefcase, 
  ExternalLink,
  ChevronLeft,
  Quote,
  Target,
  Frown,
  Sliders,
  Calendar,
  Save,
  RotateCcw
} from 'lucide-react';
import { Stakeholder, DemographicSlider } from '../types';
import { cn } from '../lib/utils';
import { CompanyProfile } from '../components/YourCompany';
import { getGeminiClient, ensureApiKey } from '../lib/gemini';
import { AI_MODELS } from '../lib/aiConfig';
import { Type } from '@google/genai';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'motion/react';
import { PersonaInterview } from '../components/PersonaInterview';
import { v4 as uuidv4 } from 'uuid';

interface StakeholdersProps {
  stakeholders: Stakeholder[];
  setStakeholders: (items: Stakeholder[] | ((prev: Stakeholder[]) => Stakeholder[])) => void;
  onDeleteItem: (item: any, type: any) => void;
  isDarkMode?: boolean;
  onAddToAuditLog?: (action: string, details: string, type: 'Create' | 'Update' | 'Delete' | 'Restore' | 'Login', entityType?: string, entityId?: string, source?: 'Manual' | 'AI' | 'Data Source') => void;
  companyProfile?: CompanyProfile;
}

export function Stakeholders({ stakeholders, setStakeholders, onDeleteItem, isDarkMode, onAddToAuditLog, companyProfile }: StakeholdersProps) {
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isInterviewOpen, setIsInterviewOpen] = useState(false);
  const [selectedInterviewer, setSelectedInterviewer] = useState<any>(null);
  const [viewingStakeholder, setViewingStakeholder] = useState<Stakeholder | null>(null);
  const [activeView, setActiveView] = useState<'profile' | 'context' | 'influence'>('profile');
  
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Partial<Stakeholder>[]>([]);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);

  const [formData, setFormData] = useState<Partial<Stakeholder>>({
    name: '',
    category: 'Executive Sponsor',
    organization: '',
    email: '',
    about: '',
    contextData: '',
    quote: '',
    goals: [],
    frustrations: [],
    demographics: [],
    isGlobal: true
  });

  const [categories, setCategories] = useState([
    'Executive Sponsor',
    'Director/Head of Service',
    'Corporate Function (IT, Finance, HR, Legal, Comms)',
    'Key Partner (Contractor, Housing, NHS, Third Sector)',
    'Regulator',
    'Resident/Tenant Group',
    'Union',
    'Other'
  ]);
  const [newCategory, setNewCategory] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);

  const handleAddCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories(prev => [...prev, newCategory]);
      setFormData(prev => ({ ...prev, category: newCategory }));
      setNewCategory('');
      setShowAddCategory(false);
    }
  };

  const filteredStakeholders = useMemo(() => {
    return stakeholders.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           s.organization?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || s.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [stakeholders, searchTerm, categoryFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category) return;

    if (editingId) {
      setStakeholders(prev => prev.map(s => s.id === editingId ? { ...s, ...formData } as Stakeholder : s));
      onAddToAuditLog?.('Updated Stakeholder', `Updated stakeholder ${formData.name}`, 'Update', 'Stakeholder', editingId, 'Manual');
      setEditingId(null);
      setViewingStakeholder(null);
    } else {
      const newStakeholder: Stakeholder = {
        id: `stk_${Date.now()}`,
        name: formData.name!,
        category: formData.category!,
        organization: formData.organization,
        email: formData.email,
        about: formData.about,
        contextData: formData.contextData,
        quote: formData.quote,
        goals: formData.goals || [],
        frustrations: formData.frustrations || [],
        demographics: formData.demographics || [
            { id: uuidv4(), label: 'Power', value: 50 },
            { id: uuidv4(), label: 'Interest', value: 50 }
        ],
        imageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`,
        isGlobal: true
      };
      setStakeholders(prev => [...prev, newStakeholder]);
      onAddToAuditLog?.('Created Stakeholder', `Created stakeholder ${newStakeholder.name}`, 'Create', 'Stakeholder', newStakeholder.id, 'Manual');
    }

    setFormData({ name: '', category: 'Executive Sponsor', organization: '', email: '', about: '', contextData: '', quote: '', goals: [], frustrations: [], demographics: [], isGlobal: true });
    setIsAdding(false);
  };

  const handleEdit = (stakeholder: Stakeholder) => {
    setFormData(stakeholder);
    setEditingId(stakeholder.id);
    setIsAdding(true);
    setViewingStakeholder(null);
  };

  const handleAiSuggest = async () => {
    if (!companyProfile?.name || !companyProfile?.description) {
      addToast("Please complete your company profile to use AI suggestions.", "info");
      return;
    }

    setIsAiGenerating(true);
    setShowAiSuggestions(true);
    try {
      const hasKey = await ensureApiKey();
      if (!hasKey) {
        addToast("Gemini API key is required.", "error");
        setIsAiGenerating(false);
        return;
      }

      const ai = await getGeminiClient();
      if (!ai) throw new Error("Failed to initialize AI client");

      const prompt = `Based on the following company profile, suggest 5 key stakeholders that this company should engage with. 
      For each stakeholder, provide:
      - name: A specific job title or role (e.g., "Director of Sustainability", "Lead Systems Architect").
      - category: One of the existing categories: ${categories.join(', ')}.
      - organization: A likely department or external entity type.
      - about: A brief context on why this stakeholder is important for the company's continuous improvement goals.
      - quote: A likely slogan or mantra they live by.
      - goals: 3 key goals they likely have.
      - frustrations: 3 key frustrations they likely face.

      Company Profile:
      Name: ${companyProfile.name}
      Vertical: ${companyProfile.vertical}
      Description: ${companyProfile.description}
      Strategic Goals: ${companyProfile.goals?.join(', ') || 'N/A'}
      
      Respond with a JSON object containing a "suggestions" array.`;

      const result = await ai.models.generateContent({
        model: AI_MODELS.chat,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    category: { type: Type.STRING },
                    organization: { type: Type.STRING },
                    about: { type: Type.STRING },
                    quote: { type: Type.STRING },
                    goals: { type: Type.ARRAY, items: { type: Type.STRING } },
                    frustrations: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["name", "category", "organization", "about", "quote", "goals", "frustrations"]
                }
              }
            },
            required: ["suggestions"]
          }
        }
      });

      const data = JSON.parse(result.text || '{}');
      setAiSuggestions(data.suggestions || []);
    } catch (err: any) {
      console.error(err);
      addToast(err.message || "Failed to generate stakeholder suggestions", "error");
      setShowAiSuggestions(false);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleAcceptAiSuggestion = (suggestion: Partial<Stakeholder>) => {
    const newStakeholder: Stakeholder = {
      id: `stk_ai_${Date.now()}_${Math.random()}`,
      name: suggestion.name!,
      category: suggestion.category!,
      organization: suggestion.organization,
      about: suggestion.about,
      quote: suggestion.quote,
      goals: suggestion.goals || [],
      frustrations: suggestion.frustrations || [],
      demographics: [
        { id: uuidv4(), label: 'Power', value: 50 },
        { id: uuidv4(), label: 'Interest', value: 50 }
      ],
      imageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${suggestion.name}`,
      isGlobal: true
    };
    setStakeholders(prev => [...prev, newStakeholder]);
    setAiSuggestions(prev => prev.filter(s => s !== suggestion));
    onAddToAuditLog?.('Created AI Stakeholder', `Added suggested stakeholder ${newStakeholder.name}`, 'Create', 'Stakeholder', newStakeholder.id, 'AI');
    addToast(`Added ${newStakeholder.name} to library`, 'success');
  };

  const handleDelete = (id: string) => {
    const stakeholder = stakeholders.find(s => s.id === id);
    if (stakeholder) {
      onDeleteItem(stakeholder, 'Stakeholder');
      setViewingStakeholder(null);
    }
  };

  return (
    <div className="p-8 max-w-[1440px] mx-auto space-y-8 animate-in fade-in duration-700 font-sans">
      {/* List Header */}
      {!viewingStakeholder && !isAdding && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
              <Globe className="w-10 h-10 text-indigo-600" />
              Stakeholder Hub
              <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-black uppercase rounded-full shadow-lg shadow-indigo-500/20">Enterprise</span>
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-lg font-medium">Orchestrate and manage strategic partnerships across your organization.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleAiSuggest}
              disabled={isAiGenerating}
              className="px-6 py-3 bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 border-2 border-indigo-100 dark:border-indigo-800 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all shadow-sm disabled:opacity-50 group"
            >
              {isAiGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
              AI Intelligence
            </button>
            <button
              onClick={() => {
                setIsAdding(true);
                setEditingId(null);
                setFormData({ name: '', category: 'Executive Sponsor', organization: '', email: '', about: '', contextData: '', quote: '', goals: [], frustrations: [], demographics: [
                    { id: uuidv4(), label: 'Power', value: 50 },
                    { id: uuidv4(), label: 'Interest', value: 50 }
                ], isGlobal: true });
              }}
              className="bg-zinc-900 dark:bg-indigo-600 hover:scale-[1.02] active:scale-95 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all shadow-xl shadow-indigo-500/10"
            >
              <Plus className="w-5 h-5" />
              Add Stakeholder
            </button>
          </div>
        </div>
      )}

      {/* Detail Header */}
      {(viewingStakeholder || isAdding) && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { setViewingStakeholder(null); setIsAdding(false); setEditingId(null); }}
              className="p-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-zinc-500 hover:text-indigo-600 transition-all shadow-sm"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-3xl font-black text-zinc-900 dark:text-white uppercase italic tracking-tighter">
                {isAdding ? (editingId ? 'Refining Stakeholder' : 'New Strategic Partner') : 'Stakeholder View'}
              </h2>
              <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest mt-1">
                {viewingStakeholder ? viewingStakeholder.name : 'Configuring resource profile'}
              </p>
            </div>
          </div>

          {!isAdding && viewingStakeholder && (
            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <button
                onClick={() => setActiveView('profile')}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
                  activeView === 'profile'
                    ? "bg-white dark:bg-zinc-900 text-indigo-600 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                )}
              >
                <UserCircle className="w-4 h-4" />
                Profile
              </button>
              <button
                onClick={() => setActiveView('context')}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
                  activeView === 'context'
                    ? "bg-white dark:bg-zinc-900 text-indigo-600 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                )}
              >
                <Sparkles className="w-4 h-4" />
                Context
              </button>
              <button
                onClick={() => setActiveView('influence')}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
                  activeView === 'influence'
                    ? "bg-white dark:bg-zinc-900 text-indigo-600 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                )}
              >
                <Sliders className="w-4 h-4" />
                Influence
              </button>
            </div>
          )}
        </div>
      )}

      <AnimatePresence mode="wait">
        {showAiSuggestions && !viewingStakeholder && !isAdding && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-zinc-900 border-2 border-indigo-500/20 rounded-[3rem] p-10 mb-12 shadow-2xl shadow-indigo-500/5">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-black text-2xl text-zinc-900 dark:text-white uppercase italic tracking-tight">AI Strategic Alignment</h3>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">Stakeholder Ecosystem Mapping</p>
                  </div>
                </div>
                <button onClick={() => setShowAiSuggestions(false)} className="w-10 h-10 rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-rose-500 transition-colors shadow-sm">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {isAiGenerating ? (
                <div className="py-24 text-center space-y-6">
                  <div className="relative inline-block">
                    <div className="w-24 h-24 border-8 border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin" />
                    <Sparkles className="w-8 h-8 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-zinc-900 dark:text-white uppercase italic tracking-tight">Cross-Referencing Vertical...</p>
                    <p className="text-sm text-zinc-500 font-medium">Identifying critical champions and potential detractors</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {aiSuggestions.map((suggestion, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border-2 border-zinc-100 dark:border-zinc-800 p-8 shadow-sm hover:border-indigo-500 transition-all flex flex-col justify-between group relative overflow-hidden"
                    >
                       <div className="absolute top-0 right-0 p-8 bg-indigo-600/5 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-125 transition-transform duration-700" />
                      <div className="space-y-6 relative z-10">
                        <div className="space-y-2">
                           <h4 className="font-black text-xl text-zinc-900 dark:text-white leading-tight group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{suggestion.name}</h4>
                           <span className="inline-block px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase rounded-lg border border-indigo-100 dark:border-indigo-800 shadow-sm">
                            {suggestion.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-black text-zinc-400 uppercase tracking-widest">
                           <Building2 className="w-4 h-4 text-indigo-400" />
                           {suggestion.organization}
                        </div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-bold italic">"{suggestion.about}"</p>
                      </div>
                      <div className="flex gap-3 mt-8 relative z-10">
                        <button
                          onClick={() => handleAcceptAiSuggestion(suggestion)}
                          className="flex-1 py-4 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20"
                        >
                          <Check className="w-4 h-4" /> Import
                        </button>
                        <button
                          onClick={() => setAiSuggestions(prev => prev.filter(s => s !== suggestion))}
                          className="w-14 h-14 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-all"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                  {aiSuggestions.length === 0 && !isAiGenerating && (
                    <div className="col-span-full py-20 text-center bg-white/50 dark:bg-zinc-900/50 rounded-[3rem] border-2 border-dashed border-emerald-500/20">
                      <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                      </div>
                      <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase italic">Strategic Mapping Complete</h3>
                      <p className="text-sm text-zinc-500 font-bold uppercase tracking-widest mt-2">All suggested partners have been cataloged.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!viewingStakeholder && !isAdding ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="relative md:col-span-3 group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-400 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                placeholder="Search hub by name, role, or organization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-16 pr-6 py-5 rounded-[2rem] border-2 border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold text-zinc-700 dark:text-zinc-200 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all shadow-sm text-lg"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full pl-16 pr-6 py-5 rounded-[2rem] border-2 border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold text-zinc-700 dark:text-zinc-200 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none appearance-none transition-all shadow-sm"
              >
                <option value="All">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredStakeholders.length > 0 ? (
              filteredStakeholders.map((s, idx) => (
                <motion.div 
                  key={s.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setViewingStakeholder(s)}
                  className="group bg-white dark:bg-zinc-900 rounded-[2.5rem] border-2 border-zinc-100 dark:border-zinc-800 p-10 cursor-pointer hover:border-indigo-500 transition-all hover:shadow-2xl hover:shadow-indigo-500/10 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-8">
                    <div className="relative">
                      <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-3xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform duration-500 overflow-hidden border-2 border-zinc-100 dark:border-zinc-800 shadow-inner">
                        {s.imageUrl ? (
                          <img src={s.imageUrl} className="w-full h-full object-cover" alt={s.name} />
                        ) : (
                          <UserCircle className="w-10 h-10" />
                        )}
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                        <Briefcase className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInterviewer({
                            id: s.id,
                            name: s.name,
                            role: s.category,
                            about: s.about,
                            imageUrl: s.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.name}`,
                            goals: s.goals,
                            frustrations: s.frustrations,
                            quote: s.quote,
                            power: s.demographics?.find(d => d.label.toLowerCase() === 'power')?.value || 50,
                            interest: s.demographics?.find(d => d.label.toLowerCase() === 'interest')?.value || 50
                          });
                          setIsInterviewOpen(true);
                        }}
                        className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all"
                        title="AI Interview"
                      >
                        <MessageSquare className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEdit(s); }}
                        className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-indigo-600 rounded-xl flex items-center justify-center transition-all"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                        className="w-10 h-10 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-3xl font-black text-zinc-900 dark:text-white leading-tight group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{s.name}</h3>
                      <div className="flex items-center gap-2 mt-2">
                         <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase rounded-xl border border-indigo-100 dark:border-indigo-800 shadow-sm">
                           {s.category}
                         </span>
                      </div>
                    </div>

                    <div className="space-y-3 pt-6 border-t border-zinc-50 dark:border-zinc-800/50">
                      <div className="flex items-center gap-3 text-xs font-black text-zinc-400 uppercase tracking-widest">
                        <Building2 className="w-4 h-4 text-indigo-400" />
                        <span className="truncate">{s.organization || 'Strategic Entity'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3 text-xs font-black text-zinc-400 uppercase tracking-widest">
                          <Mail className="w-4 h-4 text-indigo-400" />
                          <span className="truncate">{s.email || 'Encrypted Communication'}</span>
                        </div>
                        <ArrowRight className="w-6 h-6 text-indigo-600 -translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 p-12 bg-indigo-600/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl" />
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-40 text-center bg-white dark:bg-zinc-900 rounded-[4rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 space-y-8">
                <div className="w-24 h-24 bg-zinc-50 dark:bg-zinc-800 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner border-2 border-zinc-100 dark:border-zinc-800">
                  <Users className="w-12 h-12 text-zinc-300" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-black text-zinc-900 dark:text-white uppercase italic tracking-tighter">Hub Standby</h3>
                  <p className="text-zinc-500 font-bold text-lg max-w-sm mx-auto">Your stakeholder ecosystem is ready to be mapped. Add your first champion manually or use AI suggest.</p>
                </div>
                <button 
                  onClick={() => setIsAdding(true)}
                  className="px-12 py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-2xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 mx-auto"
                >
                  <Plus className="w-6 h-6" />
                  Initialize Resource
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Full Page View/Edit for Stakeholder */
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8 pt-4"
        >
          {activeView === 'profile' || isAdding ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Main Content Area */}
              <div className="lg:col-span-8 space-y-8">
                 {/* Profile Card */}
                 <div className="bg-gradient-to-br from-zinc-900 to-black rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl border-2 border-white/5 group">
                    <div className="absolute top-0 right-0 p-40 bg-indigo-600/20 rounded-full translate-x-1/4 -translate-y-1/4 blur-3xl" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                       <div className="relative">
                          <div className="w-32 h-32 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-4xl font-black text-white shadow-2xl overflow-hidden border-4 border-white/10 group/img">
                            { (viewingStakeholder || formData).name?.charAt(0) || <UserCircle className="w-16 h-16" />}
                          </div>
                          {(isAdding || editingId) && (
                            <div className="absolute -bottom-2 -right-2 p-2.5 bg-white text-indigo-600 rounded-2xl shadow-xl animate-pulse">
                              <Edit2 className="w-4 h-4" />
                            </div>
                          )}
                       </div>
                       <div className="flex-1 text-center md:text-left space-y-3">
                          {isAdding ? (
                            <input 
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              className="bg-transparent text-4xl md:text-5xl font-black uppercase italic tracking-tighter outline-none border-b-2 border-white/20 focus:border-indigo-400 w-full placeholder:text-zinc-700"
                              placeholder="Partner Name"
                            />
                          ) : (
                            <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">{viewingStakeholder?.name}</h2>
                          )}
                          
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                             {isAdding ? (
                               <select 
                                 value={formData.category}
                                 onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                 className="bg-white/10 text-white rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none border border-white/20"
                               >
                                 {categories.map(c => <option key={c} value={c} className="text-zinc-900">{c}</option>)}
                               </select>
                             ) : (
                               <span className="px-4 py-1.5 bg-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20">
                                 {viewingStakeholder?.category}
                               </span>
                             )}
                             <div className="flex items-center gap-2 text-zinc-400 font-bold uppercase text-[10px] tracking-widest">
                               <Building2 className="w-4 h-4 text-indigo-400" />
                               {isAdding ? (
                                 <input 
                                   value={formData.organization}
                                   onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                                   className="bg-transparent border-b border-white/10 outline-none focus:border-indigo-400"
                                   placeholder="Organization"
                                 />
                               ) : viewingStakeholder?.organization}
                             </div>
                          </div>
                       </div>
                       <div className="flex flex-col gap-3 shrink-0">
                          {!isAdding ? (
                            <button 
                              onClick={() => {
                                setSelectedInterviewer({
                                  id: viewingStakeholder!.id,
                                  name: viewingStakeholder!.name,
                                  role: viewingStakeholder!.category,
                                  about: viewingStakeholder!.about,
                                  imageUrl: viewingStakeholder!.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${viewingStakeholder!.name}`,
                                  goals: viewingStakeholder!.goals,
                                  frustrations: viewingStakeholder!.frustrations,
                                  quote: viewingStakeholder!.quote,
                                  power: viewingStakeholder!.demographics?.find(d => d.label.toLowerCase() === 'power')?.value || 50,
                                  interest: viewingStakeholder!.demographics?.find(d => d.label.toLowerCase() === 'interest')?.value || 50
                                });
                                setIsInterviewOpen(true);
                              }}
                              className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                            >
                              <MessageSquare className="w-4 h-4" />
                              AI Interview
                            </button>
                          ) : (
                            <button 
                              onClick={handleSubmit}
                              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-500 transition-all flex items-center gap-3"
                            >
                              <Save className="w-4 h-4" />
                              Commit Changes
                            </button>
                          )}
                          
                          {!isAdding && (
                            <button 
                              onClick={() => handleEdit(viewingStakeholder!)}
                              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl font-black uppercase text-xs tracking-widest transition-all"
                            >
                              Modify Structure
                            </button>
                          )}
                       </div>
                    </div>
                 </div>

                 {/* Goals & Frustrations - Parity with Persona */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border-2 border-zinc-100 dark:border-zinc-800 shadow-sm space-y-8">
                       <div className="space-y-6">
                          <h4 className="text-xs font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            Key Objectives
                          </h4>
                          <div className="space-y-3">
                            {(isAdding ? formData.goals : viewingStakeholder?.goals)?.map((goal, i) => (
                              <div key={i} className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 group">
                                 <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                 </div>
                                 {isAdding ? (
                                   <input 
                                     value={goal}
                                     onChange={(e) => {
                                       const newGoals = [...(formData.goals || [])];
                                       newGoals[i] = e.target.value;
                                       setFormData({ ...formData, goals: newGoals });
                                     }}
                                     className="flex-1 bg-transparent outline-none text-sm font-bold"
                                   />
                                 ) : (
                                   <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{goal}</span>
                                 )}
                                 {isAdding && (
                                   <button 
                                     onClick={() => setFormData({ ...formData, goals: (formData.goals || []).filter((_, idx) => idx !== i) })}
                                     className="text-zinc-300 hover:text-rose-500"
                                   >
                                     <Trash2 className="w-4 h-4" />
                                   </button>
                                 )}
                              </div>
                            ))}
                            {isAdding && (
                              <button 
                                onClick={() => setFormData({ ...formData, goals: [...(formData.goals || []), ''] })}
                                className="w-full py-3 border-2 border-dashed border-zinc-100 rounded-2xl text-[10px] font-black uppercase text-zinc-400 hover:text-emerald-500 transition-all"
                              >
                                 + Add Objective
                              </button>
                            )}
                            {!(isAdding ? formData.goals : viewingStakeholder?.goals)?.length && !isAdding && (
                              <p className="text-xs text-zinc-400 italic">No objectives identified.</p>
                            )}
                          </div>
                       </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border-2 border-zinc-100 dark:border-zinc-800 shadow-sm space-y-8">
                       <div className="space-y-6">
                          <h4 className="text-xs font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                            <Frown className="w-4 h-4 text-rose-500" />
                            Critical Roadblocks
                          </h4>
                          <div className="space-y-3">
                            {(isAdding ? formData.frustrations : viewingStakeholder?.frustrations)?.map((f, i) => (
                              <div key={i} className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 group">
                                 <div className="w-6 h-6 bg-rose-100 rounded-full flex items-center justify-center shrink-0">
                                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                 </div>
                                 {isAdding ? (
                                   <input 
                                     value={f}
                                     onChange={(e) => {
                                       const newF = [...(formData.frustrations || [])];
                                       newF[i] = e.target.value;
                                       setFormData({ ...formData, frustrations: newF });
                                     }}
                                     className="flex-1 bg-transparent outline-none text-sm font-bold"
                                   />
                                 ) : (
                                   <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{f}</span>
                                 )}
                                 {isAdding && (
                                   <button 
                                     onClick={() => setFormData({ ...formData, frustrations: (formData.frustrations || []).filter((_, idx) => idx !== i) })}
                                     className="text-zinc-300 hover:text-rose-500"
                                   >
                                     <Trash2 className="w-4 h-4" />
                                   </button>
                                 )}
                              </div>
                            ))}
                            {isAdding && (
                              <button 
                                onClick={() => setFormData({ ...formData, frustrations: [...(formData.frustrations || []), ''] })}
                                className="w-full py-3 border-2 border-dashed border-zinc-100 rounded-2xl text-[10px] font-black uppercase text-zinc-400 hover:text-rose-500 transition-all"
                              >
                                 + Add Roadblock
                              </button>
                            )}
                             {!(isAdding ? formData.frustrations : viewingStakeholder?.frustrations)?.length && !isAdding && (
                              <p className="text-xs text-zinc-400 italic">No roadblocks identified.</p>
                            )}
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Side Panel: Demographics / Metadata */}
              <div className="lg:col-span-4 space-y-8">
                 <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border-2 border-zinc-100 dark:border-zinc-800 shadow-sm space-y-6">
                    <h4 className="text-xs font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                       <Mail className="w-4 h-4 text-indigo-600" />
                       Engagement Channels
                    </h4>
                    <div className="space-y-4">
                       <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.1em]">Direct Contact</label>
                          {isAdding ? (
                            <input 
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              className="w-full bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 text-sm font-bold outline-none focus:border-indigo-500"
                              placeholder="partner@organization.com"
                            />
                          ) : (
                            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{viewingStakeholder?.email || 'No contact specified'}</p>
                          )}
                       </div>
                    </div>
                 </div>

                 {/* Impact Snapshot in Side Panel */}
                 <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border-2 border-zinc-100 dark:border-zinc-800 shadow-sm space-y-6">
                    <h4 className="text-xs font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                       <Target className="w-4 h-4 text-indigo-600" />
                       Impact Snapshot
                    </h4>
                    <div className="space-y-6">
                       {(isAdding ? formData.demographics : viewingStakeholder?.demographics)?.filter(d => ['Power', 'Interest'].includes(d.label)).map((d, i) => (
                          <div key={d.id} className="space-y-2">
                             <div className="flex justify-between text-[10px] font-black uppercase text-zinc-500">
                                <span>{d.label}</span>
                                <span>{d.value}%</span>
                             </div>
                             <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${d.value}%` }}
                                  className="h-full bg-indigo-600"
                                />
                             </div>
                          </div>
                       ))}
                    </div>
                    <button 
                      onClick={() => setActiveView('influence')}
                      className="w-full py-3 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 transition-all font-bold"
                    >
                      View Detailed Matrix
                    </button>
                 </div>
              </div>
            </div>
          ) : activeView === 'context' ? (
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
               <div className="lg:col-span-8 space-y-8">
                  {/* Mantra / Vision */}
                  <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border-2 border-zinc-100 dark:border-zinc-800 shadow-sm space-y-6">
                    <h4 className="text-xs font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                        <Quote className="w-4 h-4 text-indigo-600" />
                        Partner Mantra
                    </h4>
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-10 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 relative">
                        <p className="text-3xl font-black text-zinc-800 dark:text-zinc-200 italic leading-tight">
                          "{viewingStakeholder?.quote || 'No core mantra defined.'}"
                        </p>
                        <Quote className="absolute -top-4 -left-4 w-16 h-16 text-indigo-100 dark:text-indigo-900/40 -z-10" />
                    </div>
                  </div>

                  {/* Strategic Background */}
                  <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border-2 border-zinc-100 dark:border-zinc-800 shadow-sm space-y-6">
                    <h4 className="text-xs font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                        <UserCircle className="w-4 h-4 text-indigo-600" />
                        Strategic Background
                    </h4>
                    <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed font-medium italic">
                      {viewingStakeholder?.about || 'No detailed background provided.'}
                    </p>
                  </div>
               </div>

               <div className="lg:col-span-4 space-y-8">
                  <div className="bg-zinc-900 rounded-[3rem] p-8 border border-zinc-800 shadow-2xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-20 bg-indigo-600/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl" />
                     <div className="relative z-10 space-y-6">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                           <Sparkles className="w-6 h-6" />
                        </div>
                        <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">Raw Intelligence Ingestion</h4>
                        <div className="bg-black/40 rounded-2xl p-6 border border-zinc-800 min-h-[300px]">
                           <p className="text-[11px] font-mono text-zinc-500 leading-relaxed uppercase tracking-widest">
                              {viewingStakeholder?.contextData || 'Awaiting dynamic context link for real-time AI grounding...'}
                           </p>
                        </div>
                        <button className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all">
                           Sync with Universal Engine
                        </button>
                     </div>
                  </div>
               </div>
             </div>
          ) : (
            /* Influence Matrix Detail */
            <div className="max-w-4xl mx-auto space-y-12 py-10">
               <div className="text-center space-y-4">
                  <h3 className="text-5xl font-black uppercase italic tracking-tighter text-zinc-900 dark:text-white">Stakeholder Mapping</h3>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Positioning based on Influence and Impact Metrics</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div className="grid gap-8">
                     {(viewingStakeholder?.demographics || []).map((d) => (
                       <div key={d.id} className="p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border-2 border-zinc-100 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
                          <div className="relative z-10 space-y-4">
                             <div className="flex justify-between items-end">
                                <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{d.label}</h5>
                                <span className="text-4xl font-black text-indigo-600 tracking-tighter">{d.value}%</span>
                             </div>
                             <div className="h-6 bg-zinc-50 dark:bg-zinc-800 rounded-full p-1 shadow-inner border border-zinc-100 dark:border-zinc-700">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${d.value}%` }}
                                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
                                />
                             </div>
                          </div>
                          <div className="absolute top-0 right-0 p-8 bg-indigo-600/5 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700" />
                       </div>
                     ))}
                  </div>

                  <div className="relative aspect-square bg-zinc-50 dark:bg-zinc-800/50 rounded-[4rem] border-2 border-dashed border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                     <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                        <div className="w-[150%] h-[150%] border border-indigo-600/5 rounded-full animate-spin-slow" />
                     </div>
                     <div className="relative z-10 text-center space-y-6">
                        <div className="w-32 h-32 bg-indigo-600 rounded-[3rem] flex items-center justify-center text-white shadow-3xl shadow-indigo-600/30 mx-auto rotate-12">
                           <Target className="w-16 h-16" />
                        </div>
                        <div>
                           <h4 className="text-3xl font-black uppercase text-zinc-900 dark:text-white leading-none">High Influence</h4>
                           <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-2 italic">Strategic Priority: Engage Closely</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* Action Footer (Global for Detail View) */}
          {!isAdding && (
             <div className="pt-12 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <button 
                  onClick={() => setViewingStakeholder(null)}
                  className="px-8 py-3 dark:text-zinc-500 font-black uppercase text-[10px] tracking-widest hover:text-indigo-600 transition-colors"
                >
                  Return to Library
                </button>
             </div>
          )}
        </motion.div>
      )}
      
      {/* AI Interview Modal */}
      {isInterviewOpen && selectedInterviewer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-5xl h-[80vh] bg-white dark:bg-zinc-900 rounded-[3rem] shadow-2xl relative overflow-hidden border-4 border-indigo-600/20"
          >
             <div className="absolute top-8 right-8 z-50">
               <button 
                onClick={() => { setIsInterviewOpen(false); setSelectedInterviewer(null); }}
                className="p-2 bg-black/5 hover:bg-black/10 rounded-full transition-colors"
               >
                 <X className="w-6 h-6" />
               </button>
             </div>
             <PersonaInterview 
                persona={selectedInterviewer}
                isOpen={isInterviewOpen}
                onClose={() => {
                  setIsInterviewOpen(false);
                  setSelectedInterviewer(null);
                }}
              />
          </motion.div>
        </div>
      )}
    </div>
  );
}
