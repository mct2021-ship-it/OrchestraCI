import React, { useState, useRef } from 'react';
import { getGeminiClient, ensureApiKey } from '../lib/gemini';
import { AI_MODELS } from '../lib/aiConfig';
import { Type, ThinkingLevel } from "@google/genai";
import { X, Sparkles, Loader2, Check, UserPlus, Upload, FileText as FileIcon, Mic, MicOff } from 'lucide-react';
import { Persona } from '../types';
import { CompanyProfile } from './YourCompany';
import { v4 as uuidv4 } from 'uuid';
import { stripPIData } from '../lib/piStripper';
import { useToast } from '../context/ToastContext';
import { cn } from '../lib/utils';
import { AVATAR_LIBRARY } from '../data/avatars';

interface AiPersonaGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (personas: Persona[]) => void;
  companyProfile?: CompanyProfile;
}

export function AiPersonaGenerator({ isOpen, onClose, onSave, companyProfile }: AiPersonaGeneratorProps) {
  const { addToast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [details, setDetails] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [data, setData] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<Partial<Persona>[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when opening
  React.useEffect(() => {
    if (isOpen) {
      setStep(1);
      setDetails('');
      setData('');
      setIsGenerating(false);
      setSuggestions([]);
      setSelectedIndices([]);
    }
  }, [isOpen]);

  const getAvatarForPersona = (gender: string, age: number) => {
    const ageBracket = age <= 30 ? '18-30' : age <= 50 ? '31-50' : '51+';
    const normalizedGender = gender === 'Non-binary' ? 'Non-binary' : gender === 'Male' ? 'Male' : 'Female';
    
    const matches = AVATAR_LIBRARY.filter(a => a.gender === normalizedGender && a.ageBracket === ageBracket);
    if (matches.length > 0) {
      return matches[Math.floor(Math.random() * matches.length)].url;
    }
    
    // Fallback to gender match
    const genderMatches = AVATAR_LIBRARY.filter(a => a.gender === normalizedGender);
    if (genderMatches.length > 0) {
      return genderMatches[Math.floor(Math.random() * genderMatches.length)].url;
    }
    
    // Total fallback
    return AVATAR_LIBRARY[Math.floor(Math.random() * AVATAR_LIBRARY.length)].url;
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addToast("Speech recognition is not supported in this browser.", "error");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      addToast("Error with voice input. Please try again.", "error");
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setDetails(prev => prev + (prev ? ' ' : '') + finalTranscript);
      }
    };

    recognition.start();

    // Auto-stop after 30 seconds or if user toggles off
    setTimeout(() => {
      if (isListening) recognition.stop();
    }, 30000);
  };

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
    setIsGenerating(true);
    try {
      const ai = await getGeminiClient();
      if (!ai) {
        addToast("Gemini API key is missing. Please select one to enable AI features.", "error");
        await ensureApiKey();
        setIsGenerating(false);
        return;
      }
      const prompt = `
        Analyze the following context and customer data/research to suggest up to 5 distinct user personas.
        
        ${companyProfile ? `Context about the company:
        Name: ${companyProfile.name}
        Industry: ${companyProfile.vertical}
        Description: ${companyProfile.description}
        Customer Benefits: ${companyProfile.customerBenefits}
        Goals: ${companyProfile.goals?.join(', ')}
        ` : ''}

        User Provided Context/Details:
        ${details}

        ${data ? `Additional Research Data:
        ${stripPIData(data)}` : ''}

        For each persona, provide:
        - Name
        - Role/Archetype
        - Type (e.g., Housing Association Tenant, Library User, Standard)
        - Age (approximate)
        - A representative quote
        - 3-5 Goals
        - 3-5 Frustrations
        - 3 Demographic sliders (label and value 0-100)
        - 3 User Stories in the format: "As a [persona], I want [action], so that [benefit]"
        - Visual attributes for an avatar (comma-separated keywords, e.g. "middle-aged man, glasses, smiling")
      `;

      const response = await ai.models.generateContent({
        model: AI_MODELS.personaGeneration,
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
                type: { type: Type.STRING, description: "The category or type of persona (e.g., Housing Association Tenant, Standard)" },
                gender: { type: Type.STRING, enum: ['Male', 'Female', 'Non-binary'] },
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
                },
                userStories: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      asA: { type: Type.STRING },
                      iWant: { type: Type.STRING },
                      soThat: { type: Type.STRING }
                    },
                    required: ["asA", "iWant", "soThat"]
                  }
                },
                avatarAttributes: { type: Type.STRING, description: "Keywords for finding a suitable profile photo" }
              },
              required: ["name", "role", "type", "age", "quote", "goals", "frustrations", "motivations", "sentiment", "demographics", "userStories", "avatarAttributes"]
            }
          }
        }
      });

      const result = JSON.parse(response.text || '[]');
      setSuggestions(result);
      setSelectedIndices(result.map((_: any, i: number) => i)); // Select all by default
      setStep(3);
    } catch (error) {
      console.error("AI Generation error:", error);
      addToast("Failed to generate personas. Please try again.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    const selectedPersonas = suggestions
      .filter((_, i) => selectedIndices.includes(i))
      .map(s => {
        const age = s.age || 30;
        const gender = s.gender || 'Female';
        return {
          ...s,
          id: uuidv4(),
          imageUrl: getAvatarForPersona(gender, age),
          demographics: s.demographics?.map(d => ({ ...d, id: uuidv4() })) || [],
          userStories: s.userStories?.map(us => ({ ...us, id: uuidv4() })) || []
        } as Persona;
      });
    
    onSave(selectedPersonas);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">AI Persona Wizard</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Step {step} of 3: {step === 1 ? 'Define Context' : step === 2 ? 'Add Research' : 'Review Suggestions'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 dark:bg-zinc-800 rounded-full transition-colors">
            <X className="w-6 h-6 text-zinc-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {step === 1 && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-zinc-700 dark:text-zinc-200">
                        Describe your target personas or project context
                      </label>
                      <button
                        onClick={toggleListening}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                          isListening 
                            ? "bg-rose-100 dark:bg-rose-900/30 text-rose-600 animate-pulse" 
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200"
                        )}
                      >
                        {isListening ? (
                          <>
                            <MicOff className="w-3.5 h-3.5" /> Stop Listening
                          </>
                        ) : (
                          <>
                            <Mic className="w-3.5 h-3.5" /> Voice Input
                          </>
                        )}
                      </button>
                    </div>
                    
                    {/* Suggested Prompt */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Suggested:</span>
                      <button
                        onClick={() => setDetails("Create up to five personas based on what you know about my company.")}
                        className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full transition-all font-bold border border-indigo-100 dark:border-indigo-800/50 flex items-center gap-1.5 group"
                      >
                        <Sparkles className="w-3 h-3 group-hover:scale-110 transition-transform" />
                        Create up to 5 personas based on company info
                      </button>
                    </div>
                  </div>
                  <textarea 
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="e.g. We are building a new fitness app for busy professionals. We need personas that represent busy desk workers, weekend warriors, and those recovering from minor injuries..."
                    className="w-full p-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-base leading-relaxed"
                    rows={8}
                  />
                  {isListening && (
                    <p className="text-xs text-rose-500 font-medium animate-pulse">
                      Listening... speak clearly into your microphone.
                    </p>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setStep(2)}
                disabled={!details.trim() || isListening}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-200 dark:shadow-none"
              >
                Next: Add Research Data (Optional)
              </button>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 text-center">
                Orchestra CI uses Gemini AI to analyze your input and suggest realistic, data-driven personas.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Customer Data / Research Notes (Optional)</label>
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
                  placeholder="Paste interview transcripts, survey results, or market research here to make the personas more accurate..."
                  className="w-full h-64 p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm leading-relaxed"
                />
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                  Please do not upload or enter Personally Identifiable Information (PII). The system will automatically strip common PII formats before processing.
                </p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-2xl font-bold hover:bg-zinc-200 transition-all"
                >
                  Back
                </button>
                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex-[2] py-4 bg-zinc-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all disabled:opacity-50 shadow-lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating Personas...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Personas
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
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
                    <div className="flex gap-4">
                      <img 
                        src={getAvatarForPersona(s.gender || 'Female', s.age || 30)}
                        className="w-16 h-16 rounded-full object-cover border border-zinc-200 dark:border-zinc-800 shrink-0"
                        alt=""
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1">
                        <h4 className="font-bold text-zinc-900 dark:text-white text-lg mb-1">{s.name}</h4>
                        <p className="text-sm text-indigo-600 font-semibold mb-1">{s.role}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      {s.type && <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mb-2">{s.type}</p>}
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 italic line-clamp-2">"{s.quote}"</p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px] font-bold text-zinc-600 dark:text-zinc-300">Age: {s.age}</span>
                      <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px] font-bold text-zinc-600 dark:text-zinc-300">{s.goals?.length} Goals</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-between pt-6 border-t border-zinc-100 dark:border-zinc-800">
                <button 
                  onClick={() => setStep(2)}
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
