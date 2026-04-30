import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  User, 
  Bot, 
  X, 
  Sparkles, 
  MessageSquare, 
  Loader2, 
  RefreshCw,
  Paperclip,
  Maximize2,
  Minimize2,
  Upload,
  Target,
  BrainCircuit
} from 'lucide-react';
import { Persona } from '../types';
import { getGeminiClient, ensureApiKey } from '../lib/gemini';
import { AI_MODELS } from '../lib/aiConfig';
import { ThinkingLevel } from "@google/genai";
import { cn } from '../lib/utils';
import { stripPIData } from '../lib/piStripper';

export interface Interviewable {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
  // Persona-specific
  age?: number;
  gender?: string;
  quote?: string;
  goals?: string[];
  frustrations?: string[];
  // Context-specific
  contextData?: string;
  // Stakeholder-specific
  category?: string;
  about?: string;
  power?: number;
  interest?: number;
  engagementStrategy?: string;
}

interface PersonaInterviewProps {
  persona: Interviewable;
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

interface ChatMessage {
  role: 'persona' | 'user';
  content: string;
}

export function PersonaInterview({ persona, isOpen, onClose, isDarkMode }: PersonaInterviewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [evidenceText, setEvidenceText] = useState(persona.contextData || '');
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = !!persona.engagementStrategy || !!persona.power
        ? `Hi, I'm ${persona.name}. I'm acting as a ${persona.role} for this project. How can I help with the engagement strategy today?`
        : `Hi there! I'm ${persona.name}. I'm a ${persona.role} ${persona.age ? `and I'm ${persona.age} years old` : ''}. ${persona.quote ? `"${persona.quote}"` : ''} What would you like to talk about today?`;

      setMessages([
        { 
          role: 'persona', 
          content: greeting
        }
      ]);
    }
  }, [isOpen, messages.length, persona]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const hasKey = await ensureApiKey();
      if (!hasKey) {
        setMessages(prev => [...prev, { role: 'persona', content: "I'm sorry, I can't talk right now. (API Key missing)" }]);
        setIsLoading(false);
        return;
      }

      const ai = await getGeminiClient();
      if (!ai) {
        setMessages(prev => [...prev, { role: 'persona', content: "I'm having trouble thinking right now." }]);
        setIsLoading(false);
        return;
      }

      // Convert local message history to Gemini contents format
      // Note: Gemini roles are 'user' and 'model'
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const isStakeholder = !!persona.engagementStrategy || !!persona.power;
      
      const personaPrompt = `You are roleplaying as ${persona.name}, a ${isStakeholder ? 'Project Stakeholder' : 'Customer Persona'}.
      
      Profile Context:
      Role: ${persona.role}
      ${!isStakeholder ? `
      Goals: ${persona.goals?.join(', ') || 'N/A'}
      Frustrations: ${persona.frustrations?.join(', ') || 'N/A'}
      ` : `
      Power/Influence: ${persona.power}/100
      Interest Level: ${persona.interest}/100
      Engagement Strategy: ${persona.engagementStrategy || 'N/A'}
      About: ${persona.about || 'N/A'}
      `}
      
      ${evidenceText ? `ADDITIONAL CONTEXT/EVIDENCE TO CONSIDER:
      ${evidenceText}` : ''}

      STRICT ROLEPLAY RULES:
      1. Stay COMPLETELY in character at all times.
      2. Keep responses concise and realistic (max 3-4 sentences).
      3. Do NOT reveal you are an AI.
      4. If you are a Stakeholder, focus on your influence, expectations, and how the project impacts your interests.
      5. CRITICAL: Refuse to answer inappropriate, overly personal (e.g. relationship status, romantic and sexual orientation), offensive, or non-professional questions. Politely decline these questions in character, guiding the conversation back to the product/business context.
      6. Current user message: ${stripPIData(userMessage)}`;

      const response = await ai.models.generateContent({
        model: AI_MODELS.chat,
        contents: [
          ...history.map(h => ({ role: h.role as any, parts: h.parts })),
          { role: 'user', parts: [{ text: personaPrompt }] }
        ],
        config: {
          temperature: 0.7,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        }
      });

      const reply = response.text;
      setMessages(prev => [...prev, { role: 'persona', content: reply || "I'm not sure what to say to that." }]);
    } catch (error) {
      console.error('Persona Interview Error:', error);
      setMessages(prev => [...prev, { role: 'persona', content: "Sorry, I've got to run. Let's talk later!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetExpertAdvice = async () => {
    if (messages.length < 2 || isGeneratingSuggestion) return;
    
    setIsGeneratingSuggestion(true);
    try {
      const ai = await getGeminiClient();
      if (!ai) return;

      const conversationContext = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
      
      const prompt = `You are a Senior Strategic Consultant observing an interview between a product team and a persona named ${persona.name} (${persona.role}).
      
      Conversation so far:
      ${conversationContext}
      
      Based on this conversation, identify 2-3 specific strategic opportunities or critical gaps that have surfaced.
      Provide them as concise, action-oriented bullet points.
      Return ONLY a JSON list of strings.`;

      const result = await ai.models.generateContent({
        model: AI_MODELS.chat,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json'
        }
      });

      const responseText = result.text || '[]';
      const parsed = JSON.parse(responseText);
      setSuggestions(parsed);
    } catch (err) {
      console.error('Failed to get advice:', err);
    } finally {
      setIsGeneratingSuggestion(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-zinc-900 w-full max-w-2xl h-[600px] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800"
        >
          {/* Header */}
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img 
                  src={persona.imageUrl} 
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-500/20 shadow-sm" 
                  alt="" 
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full" />
              </div>
              <div>
                <h3 className="font-black text-zinc-900 dark:text-white uppercase italic tracking-tight">{persona.name}</h3>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{persona.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEvidenceOpen(!isEvidenceOpen)}
                className={cn(
                  "p-2 rounded-xl transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider",
                  isEvidenceOpen 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
                    : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                )}
                title="Add Context Evidence"
              >
                <Paperclip className="w-4 h-4" />
                <span className="hidden sm:inline">Context</span>
              </button>
              <button 
                onClick={() => {
                   setMessages([{ role: 'persona', content: `Refreshed character state. Let's talk.` }]);
                }}
                className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                title="Restart Interview"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button 
                onClick={onClose}
                className="p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
            {/* Evidence Panel (Overlay) */}
            <AnimatePresence>
              {isEvidenceOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-indigo-50/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-indigo-200 dark:border-indigo-800 p-6 z-20 absolute top-0 left-0 right-0"
                >
                  <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-indigo-600">
                        <Upload className="w-4 h-4" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest">Ground AI in Evidence</h4>
                      </div>
                  </div>
                  <textarea
                    value={evidenceText}
                    onChange={(e) => setEvidenceText(e.target.value)}
                    placeholder="Paste interview transcripts, customer data, or specific artifacts to influence the AI's roleplay..."
                    className="w-full h-32 bg-white dark:bg-zinc-950 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all placeholder:text-zinc-500"
                  />
                  <div className="mt-4 flex justify-end">
                      <button 
                        onClick={() => setIsEvidenceOpen(false)}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20"
                      >
                        Ground Context
                      </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat Body */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
            >
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/40 p-4 rounded-2xl flex items-start gap-3 text-sm text-blue-800 dark:text-blue-300">
                <BrainCircuit className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">AI Simulation Disclaimer</p>
                  <p>
                    Users should always validate AI interviews with real customers. The more contextual intelligence you provide (via the Context button), the more accurate these simulated responses will be.
                  </p>
                </div>
              </div>

              {messages.map((m, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex items-start gap-3",
                    m.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm",
                    m.role === 'user' 
                      ? "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                      : "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800"
                  )}>
                    {m.role === 'user' ? <User className="w-5 h-5 text-zinc-500" /> : <img src={persona.imageUrl} className="w-full h-full object-cover rounded-2xl" />}
                  </div>
                  <div className="max-w-[80%] space-y-1">
                    <div className={cn(
                      "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                      m.role === 'user'
                        ? "bg-indigo-600 text-white rounded-tr-none"
                        : "bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 rounded-tl-none border border-zinc-200 dark:border-zinc-700"
                    )}>
                      {m.content}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Suggestions Display */}
              {suggestions.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/40 p-6 rounded-[2rem] space-y-4"
                >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                          <Target className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-400">Expert Strategic Insights</h4>
                    </div>
                    <div className="space-y-2">
                        {suggestions.map((s, i) => (
                          <div key={i} className="flex items-start gap-3 text-xs text-zinc-600 dark:text-zinc-300">
                             <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                             {s}
                          </div>
                        ))}
                    </div>
                </motion.div>
              )}

              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center animate-pulse">
                    <img src={persona.imageUrl} className="w-full h-full object-cover rounded-2xl opacity-50" />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Input */}
            <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <form 
                onSubmit={handleSend}
                className="flex gap-4 items-end"
              >
                <div className="flex-1 relative group">
                  <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={`Interview ${persona.name}...`}
                    className="w-full pl-4 pr-12 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm resize-none"
                    rows={1}
                  />
                  <button 
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 bottom-1.5 p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleGetExpertAdvice}
                  disabled={messages.length < 2 || isGeneratingSuggestion}
                  className={cn(
                    "w-12 h-12 flex items-center justify-center rounded-2xl border transition-all relative group",
                    isGeneratingSuggestion ? "animate-pulse border-emerald-500" : "border-zinc-200 dark:border-zinc-800 hover:border-emerald-500"
                  )}
                  title="Ask AI Strategist for insights from this conversation"
                >
                  <Bot className={cn("w-6 h-6", isGeneratingSuggestion ? "text-emerald-500" : "text-zinc-400 group-hover:text-emerald-500")} />
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
