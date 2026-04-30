import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Brain, Footprints, Heart, Plus, Trash2, HelpCircle, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { Persona, EmpathyMap } from '../types';
import { cn } from '../lib/utils';
import { getGeminiClient, ensureApiKey } from '../lib/gemini';
import { AI_MODELS } from '../lib/aiConfig';
import { Type } from '@google/genai';

interface PersonaEmpathyMapProps {
  persona: Persona;
  onChange: (empathyMap: EmpathyMap) => void;
  canEdit?: boolean;
}

const quadrantConfig = [
  { 
    id: 'says' as keyof EmpathyMap, 
    title: 'Says', 
    icon: MessageSquare, 
    color: 'bg-blue-50 dark:bg-blue-900/20', 
    textColor: 'text-blue-700 dark:text-blue-400',
    iconColor: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600',
    description: 'What are the specific quotes and keywords the user says?',
    placeholder: 'Add a quote...'
  },
  { 
    id: 'thinks' as keyof EmpathyMap, 
    title: 'Thinks', 
    icon: Brain, 
    color: 'bg-purple-50 dark:bg-purple-900/20', 
    textColor: 'text-purple-700 dark:text-purple-400',
    iconColor: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600',
    description: 'What is happening in the user’s mind? What are their beliefs?',
    placeholder: 'Add a thought...'
  },
  { 
    id: 'does' as keyof EmpathyMap, 
    title: 'Does', 
    icon: Footprints, 
    color: 'bg-emerald-50 dark:bg-emerald-900/20', 
    textColor: 'text-emerald-700 dark:text-emerald-400',
    iconColor: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600',
    description: 'What physical actions and behaviors do they take?',
    placeholder: 'Add an action...'
  },
  { 
    id: 'feels' as keyof EmpathyMap, 
    title: 'Feels', 
    icon: Heart, 
    color: 'bg-rose-50 dark:bg-rose-900/20', 
    textColor: 'text-rose-700 dark:text-rose-400',
    iconColor: 'bg-rose-100 dark:bg-rose-900/40 text-rose-600',
    description: 'What are the user’s emotional states? What are they worried/excited about?',
    placeholder: 'Add a feeling...'
  },
];

export function PersonaEmpathyMap({ persona, onChange, canEdit = true }: PersonaEmpathyMapProps) {
  const empathyMap = persona.empathyMap || { says: [], thinks: [], does: [], feels: [] };
  const [newItems, setNewItems] = useState<Record<string, string>>({});
  const [isEvolving, setIsEvolving] = useState(false);

  const handleEvolve = async () => {
    setIsEvolving(true);
    try {
      const hasKey = await ensureApiKey();
      if (!hasKey) throw new Error("API Key missing");

      const ai = await getGeminiClient();
      if (!ai) throw new Error("AI Client failed");

      const prompt = `Based on the following persona profile ${persona.contextData ? 'and the provided raw context data,' : ''} generate a refined empathy map.
      
      Persona: ${persona.name} (${persona.role})
      Goals: ${persona.goals?.join(', ')}
      Frustrations: ${persona.frustrations?.join(', ')}
      
      ${persona.contextData ? `RAW CONTEXT DATA:\n${persona.contextData}\n` : ''}
      EXISTING EMPATHY MAP (to be evolved):
      - Says: ${empathyMap.says.join(', ')}
      - Thinks: ${empathyMap.thinks.join(', ')}
      - Does: ${empathyMap.does.join(', ')}
      - Feels: ${empathyMap.feels.join(', ')}
      
      Instructions:
      1. Analyze the persona details ${persona.contextData ? 'and context data ' : ''}for new insights.
      2. Refine existing items or add new ones to each quadrant.
      3. Focus on specific, high-intent behaviors and emotional states.
      4. return ONLY a JSON object matching the EmpathyMap structure: { says: string[], thinks: string[], does: string[], feels: string[] }.
      5. Max 5 key items per quadrant.`;

      const result = await ai.models.generateContent({
        model: AI_MODELS.chat,
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const data = JSON.parse(result.text || '{}');
      if (data.says) {
        onChange(data as EmpathyMap);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsEvolving(false);
    }
  };

  const addItem = (quadrant: keyof EmpathyMap) => {
    const text = newItems[quadrant]?.trim();
    if (!text) return;

    const updated = {
      ...empathyMap,
      [quadrant]: [...empathyMap[quadrant], text]
    };
    onChange(updated);
    setNewItems({ ...newItems, [quadrant]: '' });
  };

  const removeItem = (quadrant: keyof EmpathyMap, index: number) => {
    const updated = {
      ...empathyMap,
      [quadrant]: empathyMap[quadrant].filter((_, i) => i !== index)
    };
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase italic tracking-tight flex items-center gap-2">
            Empathy Map
            <span className="text-[10px] not-italic font-bold bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-500 uppercase tracking-widest">
              Standard Tool
            </span>
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Understand {persona.name}'s experience across different dimensions.
          </p>
        </div>
        {canEdit && (
          <button
            onClick={handleEvolve}
            disabled={isEvolving}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {isEvolving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isEvolving ? 'Updating...' : 'Update with AI'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-200 dark:bg-zinc-800 rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm">
        {quadrantConfig.map((config) => (
          <div 
            key={config.id}
            className={cn(
              "p-6 min-h-[280px] flex flex-col",
              config.color
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-xl", config.iconColor)}>
                  <config.icon className="w-5 h-5" />
                </div>
                <h4 className={cn("font-black uppercase italic tracking-wider", config.textColor)}>
                  {config.title}
                </h4>
              </div>
              <div className="group relative">
                <HelpCircle className="w-4 h-4 text-zinc-400 cursor-help" />
                <div className="absolute right-0 top-full mt-2 w-48 p-2 bg-zinc-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none shadow-xl">
                  {config.description}
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-2">
              {empathyMap[config.id].map((item, idx) => (
                <div 
                  key={idx}
                  className="group flex items-start gap-2 bg-white/60 dark:bg-zinc-900/40 p-3 rounded-xl border border-white/40 dark:border-zinc-800/40 text-sm text-zinc-700 dark:text-zinc-300 transition-all hover:border-indigo-200 dark:hover:border-indigo-900/40 relative pr-10"
                >
                  <span className="flex-1">{item}</span>
                  {canEdit && (
                    <button 
                      onClick={() => removeItem(config.id, idx)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all opacity-40 group-hover:opacity-100"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}

              {canEdit && (
                <div className="mt-4">
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={newItems[config.id] || ''}
                      onChange={(e) => setNewItems({ ...newItems, [config.id]: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && addItem(config.id)}
                      placeholder={config.placeholder}
                      className="flex-1 bg-white/40 dark:bg-zinc-900/20 border border-transparent focus:border-indigo-500/50 rounded-xl px-3 py-2 text-sm outline-none transition-all placeholder:text-zinc-400"
                    />
                    <button 
                      onClick={() => addItem(config.id)}
                      disabled={!newItems[config.id]?.trim()}
                      className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/10"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {empathyMap[config.id].length === 0 && !canEdit && (
                <div className="flex flex-col items-center justify-center py-8 text-zinc-400 border-2 border-dashed border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl">
                  <p className="text-[10px] uppercase font-bold tracking-widest italic">Empty Square</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
