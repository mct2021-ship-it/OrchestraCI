import React, { useState, useMemo } from 'react';
import { Users, Plus, Search, Filter, Trash2, Edit2, Globe, Building2, Mail, Tag, AlertCircle } from 'lucide-react';
import { Stakeholder } from '../types';
import { cn } from '../lib/utils';

interface StakeholdersProps {
  stakeholders: Stakeholder[];
  setStakeholders: (items: Stakeholder[] | ((prev: Stakeholder[]) => Stakeholder[])) => void;
  onDeleteItem: (item: any, type: any) => void;
  isDarkMode?: boolean;
}

export function Stakeholders({ stakeholders, setStakeholders, onDeleteItem, isDarkMode }: StakeholdersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Stakeholder>>({
    name: '',
    category: 'Executive Sponsor',
    organization: '',
    email: '',
    isGlobal: true
  });

  const categories = [
    'Executive Sponsor',
    'Director/Head of Service',
    'Corporate Function (IT, Finance, HR, Legal, Comms)',
    'Key Partner (Contractor, Housing, NHS, Third Sector)',
    'Regulator',
    'Resident/Tenant Group',
    'Union',
    'Other'
  ];

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
    }

    setFormData({ name: '', category: 'Executive Sponsor', organization: '', email: '', isGlobal: true });
    setIsAdding(false);
  };

  const handleEdit = (stakeholder: Stakeholder) => {
    setFormData(stakeholder);
    setEditingId(stakeholder.id);
    setIsAdding(true);
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
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">Manage your organization's key stakeholders across all projects.</p>
        </div>
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
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Category *</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
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
