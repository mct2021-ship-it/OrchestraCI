import React, { useState, useMemo } from 'react';
import { Users, Plus, Search, Filter, Trash2, Edit2, Globe, Building2, Mail, Tag, AlertCircle, Sparkles, Loader2, Check, X, CheckCircle2 } from 'lucide-react';
import { Stakeholder } from '../types';
import { cn } from '../lib/utils';
import { CompanyProfile } from '../components/YourCompany';
import { getGeminiClient, ensureApiKey } from '../lib/gemini';
import { Type } from '@google/genai';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'motion/react';

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
  
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Partial<Stakeholder>[]>([]);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);

  const [formData, setFormData] = useState<Partial<Stakeholder>>({
    name: '',
    category: 'Executive Sponsor',
    organization: '',
    email: '',
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
    } else {
      const newStakeholder: Stakeholder = {
        id: `stk_${Date.now()}`,
        name: formData.name!,
        category: formData.category!,
        organization: formData.organization,
        email: formData.email,
        isGlobal: true
      };
      setStakeholders(prev => [...prev, newStakeholder]);
      onAddToAuditLog?.('Created Stakeholder', `Created stakeholder ${newStakeholder.name}`, 'Create', 'Stakeholder', newStakeholder.id, 'Manual');
    }

    setFormData({ name: '', category: 'Executive Sponsor', organization: '', email: '', isGlobal: true });
    setIsAdding(false);
  };

  const handleEdit = (stakeholder: Stakeholder) => {
    setFormData(stakeholder);
    setEditingId(stakeholder.id);
    setIsAdding(true);
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

      Company Profile:
      Name: ${companyProfile.name}
      Vertical: ${companyProfile.vertical}
      Description: ${companyProfile.description}
      Strategic Goals: ${companyProfile.goals?.join(', ') || 'N/A'}
      
      Respond with a JSON object containing a "suggestions" array.`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
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
                    about: { type: Type.STRING }
                  },
                  required: ["name", "category", "organization", "about"]
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
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="w-7 h-7 text-indigo-600" />
            Global Stakeholder Library
            <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase rounded-md border border-indigo-200 dark:border-indigo-800">Pro</span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">Manage your organization's key stakeholders across all projects.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleAiSuggest}
            disabled={isAiGenerating}
            className="px-4 py-2 bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all shadow-sm disabled:opacity-50"
          >
            {isAiGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            AI Suggest
          </button>
          <button
            onClick={() => {
              setIsAdding(true);
              setEditingId(null);
              setFormData({ name: '', category: 'Executive Sponsor', organization: '', email: '', isGlobal: true });
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-5 h-5" />
            Add Stakeholder
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showAiSuggestions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-zinc-900 dark:text-white">AI Suggested Stakeholders</h3>
                </div>
                <button onClick={() => setShowAiSuggestions(false)} className="text-zinc-400 hover:text-zinc-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {isAiGenerating ? (
                <div className="py-12 text-center text-zinc-500 dark:text-zinc-400">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />
                  <p className="text-sm font-medium">Analyzing company profile and suggesting key stakeholders...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {aiSuggestions.map((suggestion, i) => (
                    <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm hover:border-indigo-300 transition-all flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-zinc-900 dark:text-white leading-tight">{suggestion.name}</h4>
                          <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-lg border border-indigo-100 dark:border-indigo-800 whitespace-nowrap">
                            {suggestion.category}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 font-medium">{suggestion.organization}</p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3">{suggestion.about}</p>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleAcceptAiSuggestion(suggestion)}
                          className="flex-1 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Add
                        </button>
                        <button
                          onClick={() => setAiSuggestions(prev => prev.filter(s => s !== suggestion))}
                          className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-bold rounded-lg hover:bg-zinc-200 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {aiSuggestions.length === 0 && !isAiGenerating && (
                    <div className="col-span-full py-8 text-center text-zinc-500">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-emerald-600">All suggestions reviewed!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search stakeholders or organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none transition-all"
          >
            <option value="All">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              {editingId ? <Edit2 className="w-5 h-5 text-indigo-500" /> : <Plus className="w-5 h-5 text-indigo-500" />}
              {editingId ? 'Edit Stakeholder' : 'Add New Global Stakeholder'}
            </h2>
            <button onClick={() => setIsAdding(false)} className="text-zinc-400 hover:text-zinc-600">
              Cancel
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Name *</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. Jane Doe"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Category *</label>
                <button
                  type="button"
                  onClick={() => setShowAddCategory(!showAddCategory)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  {showAddCategory ? 'Cancel' : 'New Category'}
                </button>
              </div>
              {showAddCategory ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Enter new category..."
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Organization</label>
              <input
                type="text"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. City Council"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="jane@example.com"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">About / Context</label>
              <textarea
                value={formData.about || ''}
                onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px]"
                placeholder="Add background information to help contextualize AI engagement plans..."
              />
            </div>
            <div className="md:col-span-2 pt-4">
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20"
              >
                {editingId ? 'Update Stakeholder' : 'Save Stakeholder'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredStakeholders.length > 0 ? (
          filteredStakeholders.map(s => (
            <div 
              key={s.id}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                  <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEdit(s)}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-indigo-500 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(s.id)}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h3 className="font-bold text-lg text-zinc-900 dark:text-white truncate">{s.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-0.5">
                    <Tag className="w-3 h-3" />
                    {s.category}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  {s.organization && (
                    <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                      <Building2 className="w-4 h-4" />
                      <span className="truncate">{s.organization}</span>
                    </div>
                  )}
                  {s.email && (
                    <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{s.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
              <Users className="w-10 h-10 text-zinc-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">No stakeholders found</h3>
              <p className="text-zinc-500 dark:text-zinc-400">Try adjusting your search or add a new stakeholder to the library.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
