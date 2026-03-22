import React, { useState } from 'react';
import { Shield, Plus, Edit2, Trash2, X, AlertTriangle, CheckCircle2, Clock, Info, Link as LinkIcon, HelpCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { v4 as uuidv4 } from 'uuid';
import { Project, RAIDItem, User } from '../types';
import { cn } from '../lib/utils';
import { ContextualHelp } from '../components/ContextualHelp';
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { useToast } from '../context/ToastContext';

interface RaidLogProps {
  project: Project;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  users?: User[];
}

type RaidTab = 'Risk' | 'Assumption' | 'Issue' | 'Dependency';

export function RaidLog({ project, setProjects, users = [] }: RaidLogProps) {
  const [editingRisk, setEditingRisk] = useState<RAIDItem | null>(null);
  const [activeTab, setActiveTab] = useState<RaidTab>('Risk');
  const [isGeneratingMitigation, setIsGeneratingMitigation] = useState(false);
  const { addToast } = useToast();

  const handleAddRisk = () => {
    const newRisk: RAIDItem = {
      id: uuidv4(),
      type: activeTab,
      description: `New ${activeTab}`,
      impact: 'Medium',
      probability: activeTab === 'Risk' ? 'Medium' : undefined,
      status: 'Open',
      mitigation: activeTab === 'Risk' ? '' : undefined,
      resolution: activeTab === 'Issue' ? '' : undefined,
      owner: activeTab === 'Dependency' ? '' : undefined,
    };
    setProjects(prev => prev.map(p => 
      p.id === project.id ? { ...p, risks: [...(p.risks || []), newRisk] } : p
    ));
    setEditingRisk(newRisk);
  };

  const saveRisk = () => {
    if (!editingRisk) return;
    setProjects(prev => prev.map(p => 
      p.id === project.id ? {
        ...p,
        risks: p.risks?.map(r => r.id === editingRisk.id ? editingRisk : r)
      } : p
    ));
    setEditingRisk(null);
  };

  const deleteRisk = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjects(prev => prev.map(p => 
      p.id === project.id ? { ...p, risks: p.risks?.filter(r => r.id !== id) } : p
    ));
  };

  const handleSuggestMitigation = async () => {
    if (!editingRisk || isGeneratingMitigation) return;
    
    setIsGeneratingMitigation(true);
    addToast('Generating mitigation strategy...', 'info');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Suggest a concise mitigation strategy for the following project ${editingRisk.type}:
        Project: ${project.name}
        Description: ${editingRisk.description}
        Impact: ${editingRisk.impact}
        ${editingRisk.probability ? `Probability: ${editingRisk.probability}` : ''}
        
        Provide a practical, actionable mitigation strategy in 2-3 sentences.`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        }
      });

      const suggestion = response.text;
      setEditingRisk({ ...editingRisk, mitigation: suggestion });
      addToast('Mitigation strategy suggested', 'success');
    } catch (error) {
      console.error('Error generating mitigation:', error);
      addToast('Failed to generate mitigation', 'error');
    } finally {
      setIsGeneratingMitigation(false);
    }
  };

  const filteredItems = (project.risks || []).filter(r => r.type === activeTab);

  const getTabIcon = (tab: RaidTab) => {
    switch (tab) {
      case 'Risk': return <Shield className="w-4 h-4" />;
      case 'Assumption': return <HelpCircle className="w-4 h-4" />;
      case 'Issue': return <AlertTriangle className="w-4 h-4" />;
      case 'Dependency': return <LinkIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-full flex flex-col space-y-8">
      <div className="shrink-0">
        <ContextualHelp 
          title="RAID Log" 
          description="Track and manage Risks, Assumptions, Issues, and Dependencies. Proactively identify potential roadblocks and document mitigation strategies to keep your project on track."
        />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-rose-500" />
            RAID Log
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage Risks, Assumptions, Issues, and Dependencies.</p>
        </div>
        <button 
          onClick={handleAddRisk}
          className="bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add {activeTab}
        </button>
      </div>

      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-px">
        {(['Risk', 'Assumption', 'Issue', 'Dependency'] as RaidTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors",
              activeTab === tab 
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400" 
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            )}
          >
            {getTabIcon(tab)}
            {tab === 'Dependency' ? 'Dependencies' : `${tab}s`}
            <span className="ml-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full text-xs">
              {(project.risks || []).filter(r => r.type === tab).length}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                <th className="p-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Description</th>
                <th className="p-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Impact</th>
                {activeTab === 'Risk' && <th className="p-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Probability</th>}
                <th className="p-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Status</th>
                {activeTab === 'Risk' && <th className="p-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Mitigation</th>}
                {activeTab === 'Issue' && <th className="p-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Resolution</th>}
                {activeTab === 'Dependency' && <th className="p-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Owner</th>}
                <th className="p-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredItems.map(risk => (
                <tr key={risk.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group cursor-pointer" onClick={() => setEditingRisk(risk)}>
                  <td className="p-4 font-medium text-zinc-900 dark:text-white max-w-xs truncate">{risk.description}</td>
                  <td className="p-4">
                    <span className={cn(
                      "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                      risk.impact === 'High' ? 'bg-rose-50 text-rose-700' :
                      risk.impact === 'Medium' ? 'bg-amber-50 text-amber-700' :
                      'bg-emerald-50 text-emerald-700'
                    )}>
                      {risk.impact}
                    </span>
                  </td>
                  {activeTab === 'Risk' && (
                    <td className="p-4">
                      <span className={cn(
                        "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                        risk.probability === 'High' ? 'bg-rose-50 text-rose-700' :
                        risk.probability === 'Medium' ? 'bg-amber-50 text-amber-700' :
                        'bg-emerald-50 text-emerald-700'
                      )}>
                        {risk.probability}
                      </span>
                    </td>
                  )}
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      {risk.status === 'Open' ? <AlertTriangle className="w-4 h-4 text-rose-500" /> :
                       risk.status === 'Mitigated' ? <Clock className="w-4 h-4 text-blue-500" /> :
                       <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      <span className={cn(
                        "text-sm font-bold",
                        risk.status === 'Open' ? 'text-rose-600' :
                        risk.status === 'Mitigated' ? 'text-blue-600' :
                        'text-emerald-600'
                      )}>
                        {risk.status}
                      </span>
                    </div>
                  </td>
                  {activeTab === 'Risk' && (
                    <td className="p-4 text-sm text-zinc-500 dark:text-zinc-400 max-w-xs truncate italic">
                      {risk.mitigation || 'No mitigation strategy defined.'}
                    </td>
                  )}
                  {activeTab === 'Issue' && (
                    <td className="p-4 text-sm text-zinc-500 dark:text-zinc-400 max-w-xs truncate italic">
                      {risk.resolution || 'No resolution defined.'}
                    </td>
                  )}
                  {activeTab === 'Dependency' && (
                    <td className="p-4 text-sm text-zinc-500 dark:text-zinc-400 max-w-xs truncate">
                      {risk.owner || 'Unassigned'}
                    </td>
                  )}
                  <td className="p-4 text-right">
                    <button 
                      onClick={(e) => deleteRisk(risk.id, e)}
                      className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-0">
                    <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900/50 p-12 text-center min-h-[400px]">
                      <div className="w-24 h-24 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mb-6">
                        <Shield className="w-12 h-12" />
                      </div>
                      <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">No {activeTab.toLowerCase()}s yet</h3>
                      <p className="text-zinc-500 dark:text-zinc-400 max-w-md mb-8">
                        Track and manage project risks, assumptions, issues, and dependencies.
                      </p>
                      <button 
                        onClick={handleAddRisk}
                        className="bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg"
                      >
                        <Plus className="w-5 h-5" />
                        Add {activeTab}
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {editingRisk && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-100 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                    {getTabIcon(editingRisk.type)}
                  </div>
                  <h3 className="font-bold text-zinc-900 dark:text-white text-lg">Edit {editingRisk.type}</h3>
                </div>
                <button 
                  onClick={() => setEditingRisk(null)}
                  className="p-2 text-zinc-400 hover:text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 dark:bg-zinc-800 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Description</label>
                  <textarea 
                    value={editingRisk.description}
                    onChange={(e) => setEditingRisk({ ...editingRisk, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-zinc-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Impact</label>
                    <select 
                      value={editingRisk.impact}
                      onChange={(e) => setEditingRisk({ ...editingRisk, impact: e.target.value as any })}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-zinc-900 dark:text-white"
                    >
                      {['Low', 'Medium', 'High'].map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                  {editingRisk.type === 'Risk' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Probability</label>
                      <select 
                        value={editingRisk.probability || 'Medium'}
                        onChange={(e) => setEditingRisk({ ...editingRisk, probability: e.target.value as any })}
                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-zinc-900 dark:text-white"
                      >
                        {['Low', 'Medium', 'High'].map(v => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Status</label>
                  <select 
                    value={editingRisk.status}
                    onChange={(e) => setEditingRisk({ ...editingRisk, status: e.target.value as any })}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-zinc-900 dark:text-white"
                  >
                    {['Open', 'Mitigated', 'Closed', 'Resolved'].map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Assigned To</label>
                  <select 
                    value={editingRisk.owner || ''}
                    onChange={(e) => setEditingRisk({ ...editingRisk, owner: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-zinc-900 dark:text-white"
                  >
                    <option value="">Unassigned</option>
                    <optgroup label="Project Team">
                      {(project.team || []).map(member => (
                        <option key={member.id} value={member.name}>{member.name} ({member.projectRole})</option>
                      ))}
                    </optgroup>
                    <optgroup label="System Users">
                      {users.filter(u => !(project.team || []).some(m => m.name === u.name)).map(user => (
                        <option key={user.id} value={user.name}>{user.name} ({user.role})</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {editingRisk.type === 'Risk' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Mitigation Strategy</label>
                      <button
                        onClick={handleSuggestMitigation}
                        disabled={isGeneratingMitigation}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 disabled:opacity-50"
                      >
                        <Sparkles className={cn("w-3 h-3", isGeneratingMitigation && "animate-pulse")} />
                        {isGeneratingMitigation ? 'Generating...' : 'Suggest with AI'}
                      </button>
                    </div>
                    <textarea 
                      value={editingRisk.mitigation || ''}
                      onChange={(e) => setEditingRisk({ ...editingRisk, mitigation: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-700 dark:text-zinc-200 italic"
                    />
                  </div>
                )}

                {editingRisk.type === 'Issue' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Resolution</label>
                    <textarea 
                      value={editingRisk.resolution || ''}
                      onChange={(e) => setEditingRisk({ ...editingRisk, resolution: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-700 dark:text-zinc-200 italic"
                    />
                  </div>
                )}


              </div>

              <div className="p-6 border-t border-zinc-100 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end gap-3">
                <button 
                  onClick={() => setEditingRisk(null)}
                  className="px-6 py-2 text-zinc-600 dark:text-zinc-400 font-bold hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveRisk}
                  className="px-8 py-2 bg-zinc-900 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-zinc-800 transition-all"
                >
                  Save Item
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
