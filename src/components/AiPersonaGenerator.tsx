import React, { useState, useRef } from 'react';
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { X, Sparkles, Loader2, Check, UserPlus, Upload, FileText as FileIcon } from 'lucide-react';
import { Persona } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AiPersonaGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (personas: Persona[]) => void;
}

export function AiPersonaGenerator({ isOpen, onClose, onSave }: AiPersonaGeneratorProps) {
  const [data, setData] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<Partial<Persona>[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setData(prev => prev + (prev ? '\n\n' : '') + `--- Data from ${file.name} ---\n` + content);
    };
    reader.readAsText(file);
  };

  const handleGenerate = async () => {
    if (!data.trim()) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
        Analyze the following customer data/research and suggest up to 5 distinct user personas.
        For each persona, provide:
        - Name
        - Role/Archetype
        - Age (approximate)
        - A representative quote
        - 3-5 Goals
        - 3-5 Frustrations
        - 3 Demographic sliders (label and value 0-100)
        
        Customer Data:
        ${data}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                role: { type: Type.STRING },
                age: { type: Type.NUMBER },
                quote: { type: Type.STRING },
                goals: { type: Type.ARRAY, items: { type: Type.STRING } },
                frustrations: { type: Type.ARRAY, items: { type: Type.STRING } },
                motivations: { type: Type.ARRAY, items: { type: Type.STRING } },
                sentiment: { type: Type.NUMBER, description: "A number from 1 to 5 representing current sentiment (1=Angry, 5=Delighted)" },
                demographics: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      label: { type: Type.STRING },
                      value: { type: Type.NUMBER }
                    },
                    required: ["label", "value"]
                  }
                }
              },
              required: ["name", "role", "age", "quote", "goals", "frustrations", "motivations", "sentiment", "demographics"]
            }
          }
        }
      });

      const result = JSON.parse(response.text || '[]');
      setSuggestions(result);
      setSelectedIndices(result.map((_: any, i: number) => i)); // Select all by default
    } catch (error) {
      console.error("AI Generation error:", error);
      alert("Failed to generate personas. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    const selectedPersonas = suggestions
      .filter((_, i) => selectedIndices.includes(i))
      .map(s => ({
        ...s,
        id: uuidv4(),
        imageUrl: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?w=400&h=400&fit=crop`,
        demographics: s.demographics?.map(d => ({ ...d, id: uuidv4() })) || []
      } as Persona));
    
    onSave(selectedPersonas);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">AI Persona Generator</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Paste research data or upload files to generate personas.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 dark:bg-zinc-800 rounded-full transition-colors">
            <X className="w-6 h-6 text-zinc-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {suggestions.length === 0 ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Customer Data / Research Notes</label>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                  >
                    <Upload className="w-3 h-3" />
                    Upload File
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    accept=".txt,.csv,.json,.md"
                  />
                </div>
                <textarea 
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  placeholder="Paste interview transcripts, survey results, or market research here..."
                  className="w-full h-64 p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm leading-relaxed"
                />
              </div>
              <button 
                onClick={handleGenerate}
                disabled={isGenerating || !data.trim()}
                className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing Data...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Personas
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suggestions.map((s, i) => (
                  <div 
                    key={i}
                    onClick={() => {
                      setSelectedIndices(prev => 
                        prev.includes(i) ? prev.filter(idx => idx !== i) : [...prev, i]
                      );
                    }}
                    className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative group ${
                      selectedIndices.includes(i) 
                        ? 'border-indigo-600 bg-indigo-50/30' 
                        : 'border-zinc-100 hover:border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                    }`}
                  >
                    <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedIndices.includes(i) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-zinc-200 dark:border-zinc-800'
                    }`}>
                      {selectedIndices.includes(i) && <Check className="w-4 h-4" />}
                    </div>
                    <h4 className="font-bold text-zinc-900 dark:text-white text-lg mb-1">{s.name}</h4>
                    <p className="text-sm text-indigo-600 font-semibold mb-3">{s.role}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 italic line-clamp-2">"{s.quote}"</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px] font-bold text-zinc-600 dark:text-zinc-300">Age: {s.age}</span>
                      <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px] font-bold text-zinc-600 dark:text-zinc-300">{s.goals?.length} Goals</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-between pt-6 border-t border-zinc-100">
                <button 
                  onClick={() => setSuggestions([])}
                  className="text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-white"
                >
                  Back to Data
                </button>
                <button 
                  onClick={handleSave}
                  disabled={selectedIndices.length === 0}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg"
                >
                  <UserPlus className="w-5 h-5" />
                  Create {selectedIndices.length} Personas
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
