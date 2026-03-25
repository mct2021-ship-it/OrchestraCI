import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Sparkles, Bot, User as UserIcon, HelpCircle } from 'lucide-react';
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { stripPIData } from '../lib/piStripper';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface GeminiChatbotProps {
  onNavigate?: (tab: string, subTab?: string) => void;
  contextData?: {
    activeProject?: any;
    tasks?: any[];
    personas?: any[];
    journeys?: any[];
    stakeholders?: any[];
    projectStakeholders?: any[];
  };
}

export function GeminiChatbot({ onNavigate, contextData }: GeminiChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm your Orchestra CI assistant. I have full knowledge of this site's capabilities and your current project data. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const projectContext = contextData?.activeProject ? `
      Current Active Project: ${contextData.activeProject.name}
      Project Description: ${contextData.activeProject.description}
      Project Goals: ${contextData.activeProject.goals?.join(', ')}
      ` : 'No active project selected.';

      const taskContext = contextData?.tasks ? `
      Active Tasks (${contextData.tasks.length}):
      ${contextData.tasks.slice(0, 5).map(t => `- ${t.title} (${t.kanbanStatus})`).join('\n')}
      ` : '';

      const personaContext = contextData?.personas ? `
      Personas (${contextData.personas.length}):
      ${contextData.personas.map(p => `- ${p.name} (${p.role})`).join('\n')}
      ` : '';
      
      const stakeholderContext = contextData?.stakeholders && contextData?.projectStakeholders ? `
      Project Stakeholders (${contextData.projectStakeholders.length}):
      ${contextData.projectStakeholders.map(ps => {
        const s = contextData.stakeholders?.find(sh => sh.id === ps.stakeholderId);
        return `- ${s?.name || 'Unknown'} (${s?.role || 'No Role'}) - Sentiment: ${ps.sentiment}, Influence: ${ps.influence}`;
      }).join('\n')}
      ` : '';

      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction: `You are the Orchestra CI Help Assistant. You have full knowledge of the Orchestra CI platform and the user's current workspace.
          
          Orchestra CI is a comprehensive Customer Experience (CX) and Project Management platform.
          
          USER CONTEXT:
          ${projectContext}
          ${taskContext}
          ${personaContext}
          ${stakeholderContext}
          
          Key capabilities include:
          - Dashboard: Overview of CX metrics and project status.
          - Personas: Create and manage detailed customer personas.
          - Projects: Manage multiple projects with specific teams, products, and services.
          - Journey Maps: Visualize customer experiences and identify pain points.
          - Stakeholder Mapping: Manage and analyze project stakeholders using power/interest matrices and sentiment tracking.
          - Kanban Board: Track task progress through customizable stages.
          - Backlog: Manage and prioritize project tasks.
          - Sprint Management: Plan and review delivery cycles with AI-powered reports.
          - RAID Log: Track Risks, Assumptions, Issues, and Dependencies.
          - Process Maps: Design and analyze business processes.
          - Intelligence: AI-powered insights and analysis.
          
          IMPORTANT: 
          1. You must be extremely helpful in signposting users to the correct pages. 
          2. Use the provided USER CONTEXT to answer specific questions about their work (e.g., "What are my top tasks?", "Tell me about my personas", or "Who are my key stakeholders?").
          3. When suggesting a feature or page, ALWAYS provide a markdown link to it using the exact tab IDs below as the URL (e.g., [Go to Dashboard](#dashboard)).
          
          Available Tab IDs:
          - #dashboard
          - #projects
          - #project_detail
          - #project_team
          - #personas
          - #journeys
          - #stakeholder_mapping
          - #stakeholders
          - #process_maps
          - #kanban
          - #backlog
          - #tasks
          - #sprints
          - #raid
          - #intelligence
          - #settings
          - #account
          - #audit_log
          - #recycle_bin
          - #pricing
          
          Be professional, helpful, and concise. Always refer to the platform as Orchestra CI.`
        },
        history: messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
        })),
      });

      const result = await chat.sendMessage({ message: stripPIData(userMessage) });
      const text = result.text;

      setMessages(prev => [...prev, { role: 'assistant', content: text }]);
    } catch (error) {
      console.error('Gemini Chat Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#') && onNavigate) {
      e.preventDefault();
      const tab = href.slice(1);
      onNavigate(tab);
      setIsOpen(false); // Optionally close the chatbot when navigating
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] print:hidden">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 right-0 w-96 max-w-[calc(100vw-3rem)] bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 bg-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">Orchestra CI Help</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">AI Assistant Online</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[300px] max-h-[450px] custom-scrollbar bg-zinc-50 dark:bg-zinc-900/50">
              {messages.map((m, i) => (
                <div key={i} className={cn(
                  "flex gap-3",
                  m.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    m.role === 'user' ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"
                  )}>
                    {m.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={cn(
                    "p-4 rounded-2xl text-sm max-w-[80%]",
                    m.role === 'user' 
                      ? "bg-indigo-600 text-white rounded-tr-none" 
                      : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-100 dark:border-zinc-700 rounded-tl-none shadow-sm"
                  )}>
                    {m.role === 'user' ? (
                      m.content
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-a:text-indigo-600 dark:prose-a:text-indigo-400 hover:prose-a:text-indigo-700">
                        <ReactMarkdown
                          components={{
                            a: ({ node, href, children, ...props }) => (
                              <a 
                                href={href} 
                                onClick={(e) => href && handleLinkClick(e, href)}
                                className="font-medium underline underline-offset-2"
                                {...props}
                              >
                                {children}
                              </a>
                            )
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-zinc-500" />
                  </div>
                  <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl rounded-tl-none border border-zinc-100 dark:border-zinc-700 shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything about Orchestra CI..."
                  className="flex-1 px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-2 text-center">
                Please do not enter Personally Identifiable Information (PII).
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 group",
          isOpen 
            ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" 
            : "bg-indigo-600 text-white"
        )}
      >
        {isOpen ? <X className="w-6 h-6" /> : (
          <div className="relative">
            <HelpCircle className="w-6 h-6" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-indigo-600 group-hover:animate-ping" />
          </div>
        )}
      </button>
    </div>
  );
}
